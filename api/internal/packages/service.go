package packages

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) List(ctx context.Context) ([]ServicePackage, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, slug, name_en, name_ru, project_type, description_en, description_ru,
		        price_from, price_to, currency, features_en, features_ru, delivery_days, sort_order, active
		 FROM service_packages ORDER BY sort_order`)
	if err != nil {
		return nil, fmt.Errorf("list packages: %w", err)
	}
	defer rows.Close()

	var pkgs []ServicePackage
	for rows.Next() {
		var p ServicePackage
		if err := rows.Scan(
			&p.ID, &p.Slug, &p.NameEn, &p.NameRu, &p.ProjectType,
			&p.DescriptionEn, &p.DescriptionRu,
			&p.PriceFrom, &p.PriceTo, &p.Currency,
			&p.FeaturesEn, &p.FeaturesRu,
			&p.DeliveryDays, &p.SortOrder, &p.Active,
		); err != nil {
			return nil, fmt.Errorf("scan package: %w", err)
		}
		pkgs = append(pkgs, p)
	}

	if pkgs == nil {
		pkgs = []ServicePackage{}
	}

	return pkgs, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*ServicePackage, error) {
	var p ServicePackage
	err := s.db.QueryRow(ctx,
		`SELECT id, slug, name_en, name_ru, project_type, description_en, description_ru,
		        price_from, price_to, currency, features_en, features_ru, delivery_days, sort_order, active
		 FROM service_packages WHERE id = $1`,
		id,
	).Scan(
		&p.ID, &p.Slug, &p.NameEn, &p.NameRu, &p.ProjectType,
		&p.DescriptionEn, &p.DescriptionRu,
		&p.PriceFrom, &p.PriceTo, &p.Currency,
		&p.FeaturesEn, &p.FeaturesRu,
		&p.DeliveryDays, &p.SortOrder, &p.Active,
	)
	if err != nil {
		return nil, ErrNotFound
	}
	return &p, nil
}

func (s *Service) Create(ctx context.Context, req *CreateRequest) (*ServicePackage, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	var p ServicePackage
	err := s.db.QueryRow(ctx,
		`INSERT INTO service_packages (slug, name_en, name_ru, project_type, description_en, description_ru,
		        price_from, price_to, currency, features_en, features_ru, delivery_days,
		        sort_order)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
		         COALESCE((SELECT MAX(sort_order) + 1 FROM service_packages), 0))
		 RETURNING id, slug, name_en, name_ru, project_type, description_en, description_ru,
		           price_from, price_to, currency, features_en, features_ru, delivery_days, sort_order, active`,
		req.Slug, req.NameEn, req.NameRu, req.ProjectType,
		req.DescriptionEn, req.DescriptionRu,
		req.PriceFrom, req.PriceTo, req.Currency,
		req.FeaturesEn, req.FeaturesRu, req.DeliveryDays,
	).Scan(
		&p.ID, &p.Slug, &p.NameEn, &p.NameRu, &p.ProjectType,
		&p.DescriptionEn, &p.DescriptionRu,
		&p.PriceFrom, &p.PriceTo, &p.Currency,
		&p.FeaturesEn, &p.FeaturesRu,
		&p.DeliveryDays, &p.SortOrder, &p.Active,
	)
	if err != nil {
		return nil, fmt.Errorf("create package: %w", err)
	}

	return &p, nil
}

func (s *Service) Update(ctx context.Context, id string, req *UpdateRequest) (*ServicePackage, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	var p ServicePackage
	err := s.db.QueryRow(ctx,
		`UPDATE service_packages
		 SET slug = $2, name_en = $3, name_ru = $4, project_type = $5,
		     description_en = $6, description_ru = $7,
		     price_from = $8, price_to = $9, currency = $10,
		     features_en = $11, features_ru = $12, delivery_days = $13
		 WHERE id = $1
		 RETURNING id, slug, name_en, name_ru, project_type, description_en, description_ru,
		           price_from, price_to, currency, features_en, features_ru, delivery_days, sort_order, active`,
		id, req.Slug, req.NameEn, req.NameRu, req.ProjectType,
		req.DescriptionEn, req.DescriptionRu,
		req.PriceFrom, req.PriceTo, req.Currency,
		req.FeaturesEn, req.FeaturesRu, req.DeliveryDays,
	).Scan(
		&p.ID, &p.Slug, &p.NameEn, &p.NameRu, &p.ProjectType,
		&p.DescriptionEn, &p.DescriptionRu,
		&p.PriceFrom, &p.PriceTo, &p.Currency,
		&p.FeaturesEn, &p.FeaturesRu,
		&p.DeliveryDays, &p.SortOrder, &p.Active,
	)
	if err != nil {
		return nil, ErrNotFound
	}

	return &p, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	tag, err := s.db.Exec(ctx, "DELETE FROM service_packages WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete package: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Service) Reorder(ctx context.Context, orderedIDs []string) error {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	for i, id := range orderedIDs {
		_, err := tx.Exec(ctx,
			"UPDATE service_packages SET sort_order = $1 WHERE id = $2",
			i, id,
		)
		if err != nil {
			return fmt.Errorf("reorder package: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (s *Service) ToggleActive(ctx context.Context, id string) (*ServicePackage, error) {
	var p ServicePackage
	err := s.db.QueryRow(ctx,
		`UPDATE service_packages SET active = NOT active WHERE id = $1
		 RETURNING id, slug, name_en, name_ru, project_type, description_en, description_ru,
		           price_from, price_to, currency, features_en, features_ru, delivery_days, sort_order, active`,
		id,
	).Scan(
		&p.ID, &p.Slug, &p.NameEn, &p.NameRu, &p.ProjectType,
		&p.DescriptionEn, &p.DescriptionRu,
		&p.PriceFrom, &p.PriceTo, &p.Currency,
		&p.FeaturesEn, &p.FeaturesRu,
		&p.DeliveryDays, &p.SortOrder, &p.Active,
	)
	if err != nil {
		return nil, ErrNotFound
	}
	return &p, nil
}
