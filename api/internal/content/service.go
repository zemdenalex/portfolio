package content

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

func (s *Service) List(ctx context.Context) ([]SiteContent, error) {
	rows, err := s.db.Query(ctx,
		"SELECT id, key, value_en, value_ru FROM site_content ORDER BY key")
	if err != nil {
		return nil, fmt.Errorf("list content: %w", err)
	}
	defer rows.Close()

	var items []SiteContent
	for rows.Next() {
		var c SiteContent
		if err := rows.Scan(&c.ID, &c.Key, &c.ValueEn, &c.ValueRu); err != nil {
			return nil, fmt.Errorf("scan content: %w", err)
		}
		items = append(items, c)
	}

	if items == nil {
		items = []SiteContent{}
	}

	return items, nil
}

func (s *Service) Get(ctx context.Context, key string) (*SiteContent, error) {
	var c SiteContent
	err := s.db.QueryRow(ctx,
		"SELECT id, key, value_en, value_ru FROM site_content WHERE key = $1",
		key,
	).Scan(&c.ID, &c.Key, &c.ValueEn, &c.ValueRu)
	if err != nil {
		return nil, ErrNotFound
	}
	return &c, nil
}

func (s *Service) Update(ctx context.Context, key string, valueEn, valueRu string) (*SiteContent, error) {
	var c SiteContent
	err := s.db.QueryRow(ctx,
		`UPDATE site_content SET value_en = $2, value_ru = $3 WHERE key = $1
		 RETURNING id, key, value_en, value_ru`,
		key, valueEn, valueRu,
	).Scan(&c.ID, &c.Key, &c.ValueEn, &c.ValueRu)
	if err != nil {
		return nil, ErrNotFound
	}
	return &c, nil
}

func (s *Service) Create(ctx context.Context, req *CreateRequest) (*SiteContent, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	var c SiteContent
	err := s.db.QueryRow(ctx,
		`INSERT INTO site_content (key, value_en, value_ru)
		 VALUES ($1, $2, $3)
		 RETURNING id, key, value_en, value_ru`,
		req.Key, req.ValueEn, req.ValueRu,
	).Scan(&c.ID, &c.Key, &c.ValueEn, &c.ValueRu)
	if err != nil {
		return nil, fmt.Errorf("create content: %w", err)
	}

	return &c, nil
}
