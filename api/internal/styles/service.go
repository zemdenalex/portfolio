package styles

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

func (s *Service) List(ctx context.Context) ([]StyleWithRefs, error) {
	rows, err := s.db.Query(ctx,
		"SELECT id, slug, name_en, name_ru, description_en, description_ru FROM quiz_styles ORDER BY name_en")
	if err != nil {
		return nil, fmt.Errorf("list styles: %w", err)
	}
	defer rows.Close()

	var stylesSlice []QuizStyle
	for rows.Next() {
		var st QuizStyle
		if err := rows.Scan(&st.ID, &st.Slug, &st.NameEn, &st.NameRu, &st.DescriptionEn, &st.DescriptionRu); err != nil {
			return nil, fmt.Errorf("scan style: %w", err)
		}
		stylesSlice = append(stylesSlice, st)
	}

	result := make([]StyleWithRefs, 0, len(stylesSlice))
	for _, st := range stylesSlice {
		refs, err := s.getRefs(ctx, st.ID)
		if err != nil {
			return nil, err
		}
		result = append(result, StyleWithRefs{QuizStyle: st, References: refs})
	}

	return result, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*StyleWithRefs, error) {
	var st QuizStyle
	err := s.db.QueryRow(ctx,
		"SELECT id, slug, name_en, name_ru, description_en, description_ru FROM quiz_styles WHERE id = $1",
		id,
	).Scan(&st.ID, &st.Slug, &st.NameEn, &st.NameRu, &st.DescriptionEn, &st.DescriptionRu)
	if err != nil {
		return nil, ErrNotFound
	}

	refs, err := s.getRefs(ctx, st.ID)
	if err != nil {
		return nil, err
	}

	return &StyleWithRefs{QuizStyle: st, References: refs}, nil
}

func (s *Service) Create(ctx context.Context, req *CreateRequest) (*QuizStyle, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	var st QuizStyle
	err := s.db.QueryRow(ctx,
		`INSERT INTO quiz_styles (slug, name_en, name_ru, description_en, description_ru)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, slug, name_en, name_ru, description_en, description_ru`,
		req.Slug, req.NameEn, req.NameRu, req.DescriptionEn, req.DescriptionRu,
	).Scan(&st.ID, &st.Slug, &st.NameEn, &st.NameRu, &st.DescriptionEn, &st.DescriptionRu)
	if err != nil {
		return nil, fmt.Errorf("create style: %w", err)
	}

	return &st, nil
}

func (s *Service) Update(ctx context.Context, id string, req *UpdateRequest) (*QuizStyle, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	var st QuizStyle
	err := s.db.QueryRow(ctx,
		`UPDATE quiz_styles SET slug = $2, name_en = $3, name_ru = $4, description_en = $5, description_ru = $6
		 WHERE id = $1
		 RETURNING id, slug, name_en, name_ru, description_en, description_ru`,
		id, req.Slug, req.NameEn, req.NameRu, req.DescriptionEn, req.DescriptionRu,
	).Scan(&st.ID, &st.Slug, &st.NameEn, &st.NameRu, &st.DescriptionEn, &st.DescriptionRu)
	if err != nil {
		return nil, ErrNotFound
	}

	return &st, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	tag, err := s.db.Exec(ctx, "DELETE FROM quiz_styles WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete style: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Service) CreateRef(ctx context.Context, req *CreateRefRequest) (*StyleReference, error) {
	var ref StyleReference
	err := s.db.QueryRow(ctx,
		`INSERT INTO style_references (style_id, url, label_en, label_ru, type, sort_order)
		 VALUES ($1, $2, $3, $4, $5, COALESCE((SELECT MAX(sort_order) + 1 FROM style_references WHERE style_id = $1), 0))
		 RETURNING id, style_id, url, label_en, label_ru, type, sort_order`,
		req.StyleID, req.URL, req.LabelEn, req.LabelRu, req.Type,
	).Scan(&ref.ID, &ref.StyleID, &ref.URL, &ref.LabelEn, &ref.LabelRu, &ref.Type, &ref.SortOrder)
	if err != nil {
		return nil, fmt.Errorf("create ref: %w", err)
	}

	return &ref, nil
}

func (s *Service) DeleteRef(ctx context.Context, id string) error {
	tag, err := s.db.Exec(ctx, "DELETE FROM style_references WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete ref: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrRefNotFound
	}
	return nil
}

func (s *Service) ReorderRefs(ctx context.Context, styleID string, orderedIDs []string) error {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	for i, id := range orderedIDs {
		_, err := tx.Exec(ctx,
			"UPDATE style_references SET sort_order = $1 WHERE id = $2 AND style_id = $3",
			i, id, styleID,
		)
		if err != nil {
			return fmt.Errorf("reorder ref: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (s *Service) getRefs(ctx context.Context, styleID string) ([]StyleReference, error) {
	rows, err := s.db.Query(ctx,
		"SELECT id, style_id, url, label_en, label_ru, type, sort_order FROM style_references WHERE style_id = $1 ORDER BY sort_order",
		styleID,
	)
	if err != nil {
		return nil, fmt.Errorf("get refs: %w", err)
	}
	defer rows.Close()

	var refs []StyleReference
	for rows.Next() {
		var ref StyleReference
		if err := rows.Scan(&ref.ID, &ref.StyleID, &ref.URL, &ref.LabelEn, &ref.LabelRu, &ref.Type, &ref.SortOrder); err != nil {
			return nil, fmt.Errorf("scan ref: %w", err)
		}
		refs = append(refs, ref)
	}

	if refs == nil {
		refs = []StyleReference{}
	}

	return refs, nil
}
