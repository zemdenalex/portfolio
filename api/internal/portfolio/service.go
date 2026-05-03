package portfolio

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) ListPublished(ctx context.Context, params ListParams) ([]Project, error) {
	query := `SELECT id, slug, title_en, title_ru, description_en, description_ru,
		type, status, thumbnail_url, live_url, featured, tech_stack, sort_order,
		is_iframe_friendly, created_at, updated_at
		FROM portfolio_projects WHERE status = 'PUBLISHED'`
	args := []any{}
	argIdx := 1

	if params.Type != "" {
		query += fmt.Sprintf(" AND type = $%d", argIdx)
		args = append(args, params.Type)
		argIdx++
	}
	if params.Search != "" {
		query += fmt.Sprintf(" AND (title_en ILIKE $%d OR title_ru ILIKE $%d OR description_en ILIKE $%d OR description_ru ILIKE $%d)", argIdx, argIdx, argIdx, argIdx)
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}
	if params.Featured != nil {
		query += fmt.Sprintf(" AND featured = $%d", argIdx)
		args = append(args, *params.Featured)
		argIdx++
	}

	query += " ORDER BY sort_order ASC, created_at DESC"

	if params.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argIdx)
		args = append(args, params.Limit)
		argIdx++
	}
	if params.Offset > 0 {
		query += fmt.Sprintf(" OFFSET $%d", argIdx)
		args = append(args, params.Offset)
	}

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list published projects: %w", err)
	}

	return pgx.CollectRows(rows, scanProject)
}

func (s *Service) ListAll(ctx context.Context, params ListParams) ([]Project, error) {
	query := `SELECT id, slug, title_en, title_ru, description_en, description_ru,
		type, status, thumbnail_url, live_url, featured, tech_stack, sort_order,
		is_iframe_friendly, created_at, updated_at
		FROM portfolio_projects WHERE 1=1`
	args := []any{}
	argIdx := 1

	if params.Type != "" {
		query += fmt.Sprintf(" AND type = $%d", argIdx)
		args = append(args, params.Type)
		argIdx++
	}
	if params.Status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, params.Status)
		argIdx++
	}
	if params.Search != "" {
		query += fmt.Sprintf(" AND (title_en ILIKE $%d OR title_ru ILIKE $%d OR description_en ILIKE $%d OR description_ru ILIKE $%d)", argIdx, argIdx, argIdx, argIdx)
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}

	query += " ORDER BY sort_order ASC, created_at DESC"

	if params.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argIdx)
		args = append(args, params.Limit)
		argIdx++
	}
	if params.Offset > 0 {
		query += fmt.Sprintf(" OFFSET $%d", argIdx)
		args = append(args, params.Offset)
	}

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list all projects: %w", err)
	}

	return pgx.CollectRows(rows, scanProject)
}

func (s *Service) GetBySlug(ctx context.Context, slug string) (*ProjectWithBlocks, error) {
	var p Project
	err := s.db.QueryRow(ctx,
		`SELECT id, slug, title_en, title_ru, description_en, description_ru,
			type, status, thumbnail_url, live_url, featured, tech_stack, sort_order,
			is_iframe_friendly, created_at, updated_at
			FROM portfolio_projects WHERE slug = $1`,
		slug,
	).Scan(&p.ID, &p.Slug, &p.TitleEn, &p.TitleRu, &p.DescriptionEn, &p.DescriptionRu,
		&p.Type, &p.Status, &p.ThumbnailURL, &p.LiveURL, &p.Featured, &p.TechStack,
		&p.SortOrder, &p.IsIframeFriendly, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, ErrProjectNotFound
	}

	blocks, err := s.getBlocksByProjectID(ctx, p.ID)
	if err != nil {
		return nil, fmt.Errorf("get blocks: %w", err)
	}

	return &ProjectWithBlocks{Project: p, Blocks: blocks}, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*ProjectWithBlocks, error) {
	var p Project
	err := s.db.QueryRow(ctx,
		`SELECT id, slug, title_en, title_ru, description_en, description_ru,
			type, status, thumbnail_url, live_url, featured, tech_stack, sort_order,
			is_iframe_friendly, created_at, updated_at
			FROM portfolio_projects WHERE id = $1`,
		id,
	).Scan(&p.ID, &p.Slug, &p.TitleEn, &p.TitleRu, &p.DescriptionEn, &p.DescriptionRu,
		&p.Type, &p.Status, &p.ThumbnailURL, &p.LiveURL, &p.Featured, &p.TechStack,
		&p.SortOrder, &p.IsIframeFriendly, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, ErrProjectNotFound
	}

	blocks, err := s.getBlocksByProjectID(ctx, p.ID)
	if err != nil {
		return nil, fmt.Errorf("get blocks: %w", err)
	}

	return &ProjectWithBlocks{Project: p, Blocks: blocks}, nil
}

func (s *Service) Create(ctx context.Context, req *CreateProjectRequest) (*Project, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	if req.TechStack == nil {
		req.TechStack = []string{}
	}

	var p Project
	err := s.db.QueryRow(ctx,
		`INSERT INTO portfolio_projects (slug, title_en, title_ru, description_en, description_ru,
			type, status, thumbnail_url, live_url, featured, tech_stack, sort_order, is_iframe_friendly)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
			RETURNING id, slug, title_en, title_ru, description_en, description_ru,
			type, status, thumbnail_url, live_url, featured, tech_stack, sort_order,
			is_iframe_friendly, created_at, updated_at`,
		req.Slug, req.TitleEn, req.TitleRu, req.DescriptionEn, req.DescriptionRu,
		req.Type, req.Status, req.ThumbnailURL, req.LiveURL, req.Featured, req.TechStack,
		req.SortOrder, req.IsIframeFriendly,
	).Scan(&p.ID, &p.Slug, &p.TitleEn, &p.TitleRu, &p.DescriptionEn, &p.DescriptionRu,
		&p.Type, &p.Status, &p.ThumbnailURL, &p.LiveURL, &p.Featured, &p.TechStack,
		&p.SortOrder, &p.IsIframeFriendly, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create project: %w", err)
	}

	return &p, nil
}

func (s *Service) Update(ctx context.Context, id string, req *UpdateProjectRequest) (*Project, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if req.Slug != nil {
		setClauses = append(setClauses, fmt.Sprintf("slug = $%d", argIdx))
		args = append(args, *req.Slug)
		argIdx++
	}
	if req.TitleEn != nil {
		setClauses = append(setClauses, fmt.Sprintf("title_en = $%d", argIdx))
		args = append(args, *req.TitleEn)
		argIdx++
	}
	if req.TitleRu != nil {
		setClauses = append(setClauses, fmt.Sprintf("title_ru = $%d", argIdx))
		args = append(args, *req.TitleRu)
		argIdx++
	}
	if req.DescriptionEn != nil {
		setClauses = append(setClauses, fmt.Sprintf("description_en = $%d", argIdx))
		args = append(args, *req.DescriptionEn)
		argIdx++
	}
	if req.DescriptionRu != nil {
		setClauses = append(setClauses, fmt.Sprintf("description_ru = $%d", argIdx))
		args = append(args, *req.DescriptionRu)
		argIdx++
	}
	if req.Type != nil {
		setClauses = append(setClauses, fmt.Sprintf("type = $%d", argIdx))
		args = append(args, *req.Type)
		argIdx++
	}
	if req.Status != nil {
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *req.Status)
		argIdx++
	}
	if req.ThumbnailURL != nil {
		setClauses = append(setClauses, fmt.Sprintf("thumbnail_url = $%d", argIdx))
		args = append(args, *req.ThumbnailURL)
		argIdx++
	}
	if req.LiveURL != nil {
		setClauses = append(setClauses, fmt.Sprintf("live_url = $%d", argIdx))
		args = append(args, *req.LiveURL)
		argIdx++
	}
	if req.Featured != nil {
		setClauses = append(setClauses, fmt.Sprintf("featured = $%d", argIdx))
		args = append(args, *req.Featured)
		argIdx++
	}
	if req.TechStack != nil {
		setClauses = append(setClauses, fmt.Sprintf("tech_stack = $%d", argIdx))
		args = append(args, req.TechStack)
		argIdx++
	}
	if req.SortOrder != nil {
		setClauses = append(setClauses, fmt.Sprintf("sort_order = $%d", argIdx))
		args = append(args, *req.SortOrder)
		argIdx++
	}
	if req.IsIframeFriendly != nil {
		setClauses = append(setClauses, fmt.Sprintf("is_iframe_friendly = $%d", argIdx))
		args = append(args, *req.IsIframeFriendly)
		argIdx++
	}

	if len(setClauses) == 0 {
		return s.getProjectByID(ctx, id)
	}

	args = append(args, id)
	query := fmt.Sprintf(
		`UPDATE portfolio_projects SET %s WHERE id = $%d
		RETURNING id, slug, title_en, title_ru, description_en, description_ru,
		type, status, thumbnail_url, live_url, featured, tech_stack, sort_order,
		is_iframe_friendly, created_at, updated_at`,
		strings.Join(setClauses, ", "), argIdx,
	)

	var p Project
	err := s.db.QueryRow(ctx, query, args...).Scan(
		&p.ID, &p.Slug, &p.TitleEn, &p.TitleRu, &p.DescriptionEn, &p.DescriptionRu,
		&p.Type, &p.Status, &p.ThumbnailURL, &p.LiveURL, &p.Featured, &p.TechStack,
		&p.SortOrder, &p.IsIframeFriendly, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, ErrProjectNotFound
	}

	return &p, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	tag, err := s.db.Exec(ctx, "DELETE FROM portfolio_projects WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete project: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrProjectNotFound
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
		_, err := tx.Exec(ctx, "UPDATE portfolio_projects SET sort_order = $1 WHERE id = $2", i, id)
		if err != nil {
			return fmt.Errorf("reorder project %s: %w", id, err)
		}
	}

	return tx.Commit(ctx)
}

// --- Content Blocks ---

func (s *Service) CreateBlock(ctx context.Context, projectID string, req *CreateBlockRequest) (*ContentBlock, error) {
	var b ContentBlock
	err := s.db.QueryRow(ctx,
		`INSERT INTO content_blocks (project_id, type, sort_order, content)
		VALUES ($1, $2, $3, $4)
		RETURNING id, project_id, type, sort_order, content, created_at, updated_at`,
		projectID, req.Type, req.SortOrder, req.Content,
	).Scan(&b.ID, &b.ProjectID, &b.Type, &b.SortOrder, &b.Content, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create block: %w", err)
	}
	return &b, nil
}

func (s *Service) UpdateBlock(ctx context.Context, id string, req *UpdateBlockRequest) (*ContentBlock, error) {
	var b ContentBlock
	err := s.db.QueryRow(ctx,
		`UPDATE content_blocks SET content = $1 WHERE id = $2
		RETURNING id, project_id, type, sort_order, content, created_at, updated_at`,
		req.Content, id,
	).Scan(&b.ID, &b.ProjectID, &b.Type, &b.SortOrder, &b.Content, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, ErrBlockNotFound
	}
	return &b, nil
}

func (s *Service) DeleteBlock(ctx context.Context, id string) error {
	tag, err := s.db.Exec(ctx, "DELETE FROM content_blocks WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete block: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrBlockNotFound
	}
	return nil
}

func (s *Service) ReorderBlocks(ctx context.Context, projectID string, orderedIDs []string) error {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	for i, id := range orderedIDs {
		_, err := tx.Exec(ctx,
			"UPDATE content_blocks SET sort_order = $1 WHERE id = $2 AND project_id = $3",
			i, id, projectID)
		if err != nil {
			return fmt.Errorf("reorder block %s: %w", id, err)
		}
	}

	return tx.Commit(ctx)
}

// --- Helpers ---

func (s *Service) getProjectByID(ctx context.Context, id string) (*Project, error) {
	var p Project
	err := s.db.QueryRow(ctx,
		`SELECT id, slug, title_en, title_ru, description_en, description_ru,
			type, status, thumbnail_url, live_url, featured, tech_stack, sort_order,
			is_iframe_friendly, created_at, updated_at
			FROM portfolio_projects WHERE id = $1`,
		id,
	).Scan(&p.ID, &p.Slug, &p.TitleEn, &p.TitleRu, &p.DescriptionEn, &p.DescriptionRu,
		&p.Type, &p.Status, &p.ThumbnailURL, &p.LiveURL, &p.Featured, &p.TechStack,
		&p.SortOrder, &p.IsIframeFriendly, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, ErrProjectNotFound
	}
	return &p, nil
}

func (s *Service) getBlocksByProjectID(ctx context.Context, projectID string) ([]ContentBlock, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, project_id, type, sort_order, content, created_at, updated_at
		FROM content_blocks WHERE project_id = $1 ORDER BY sort_order ASC`,
		projectID,
	)
	if err != nil {
		return nil, fmt.Errorf("query blocks: %w", err)
	}

	blocks, err := pgx.CollectRows(rows, scanBlock)
	if err != nil {
		return nil, fmt.Errorf("collect blocks: %w", err)
	}

	if blocks == nil {
		blocks = []ContentBlock{}
	}
	return blocks, nil
}

type ProjectSlug struct {
	Slug      string    `json:"slug"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *Service) ListSlugs(ctx context.Context) ([]ProjectSlug, error) {
	rows, err := s.db.Query(ctx,
		`SELECT slug, updated_at FROM portfolio_projects WHERE status = 'PUBLISHED' ORDER BY sort_order`,
	)
	if err != nil {
		return nil, fmt.Errorf("list slugs: %w", err)
	}
	defer rows.Close()

	var slugs []ProjectSlug
	for rows.Next() {
		var ps ProjectSlug
		if err := rows.Scan(&ps.Slug, &ps.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan slug: %w", err)
		}
		slugs = append(slugs, ps)
	}
	if slugs == nil {
		slugs = []ProjectSlug{}
	}
	return slugs, rows.Err()
}

func scanProject(row pgx.CollectableRow) (Project, error) {
	var p Project
	err := row.Scan(&p.ID, &p.Slug, &p.TitleEn, &p.TitleRu, &p.DescriptionEn, &p.DescriptionRu,
		&p.Type, &p.Status, &p.ThumbnailURL, &p.LiveURL, &p.Featured, &p.TechStack,
		&p.SortOrder, &p.IsIframeFriendly, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}

func scanBlock(row pgx.CollectableRow) (ContentBlock, error) {
	var b ContentBlock
	err := row.Scan(&b.ID, &b.ProjectID, &b.Type, &b.SortOrder, &b.Content, &b.CreatedAt, &b.UpdatedAt)
	return b, err
}
