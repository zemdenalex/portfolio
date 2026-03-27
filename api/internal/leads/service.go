package leads

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

func (s *Service) Submit(ctx context.Context, req *SubmitRequest) (*Lead, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	if req.Answers == nil {
		req.Answers = []byte("[]")
	}

	var l Lead
	err := s.db.QueryRow(ctx,
		`INSERT INTO leads (name, email, phone, message, answers, result_style_id, result_package_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, name, email, phone, message, answers, result_style_id, result_package_id,
		status, created_at, updated_at`,
		req.Name, req.Email, req.Phone, req.Message, req.Answers,
		req.ResultStyleID, req.ResultPackageID,
	).Scan(&l.ID, &l.Name, &l.Email, &l.Phone, &l.Message, &l.Answers,
		&l.ResultStyleID, &l.ResultPackageID, &l.Status, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("submit lead: %w", err)
	}

	return &l, nil
}

func (s *Service) List(ctx context.Context, params ListParams) ([]LeadWithDetails, error) {
	query := `SELECT l.id, l.name, l.email, l.phone, l.message, l.answers,
		l.result_style_id, l.result_package_id, l.status, l.created_at, l.updated_at,
		qs.name_en AS style_name, sp.name_en AS package_name
		FROM leads l
		LEFT JOIN quiz_styles qs ON l.result_style_id = qs.id
		LEFT JOIN service_packages sp ON l.result_package_id = sp.id
		WHERE 1=1`
	args := []any{}
	argIdx := 1

	if params.Status != "" {
		query += fmt.Sprintf(" AND l.status = $%d", argIdx)
		args = append(args, params.Status)
		argIdx++
	}

	query += " ORDER BY l.created_at DESC"

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
		return nil, fmt.Errorf("list leads: %w", err)
	}
	defer rows.Close()

	var results []LeadWithDetails
	for rows.Next() {
		var l LeadWithDetails
		err := rows.Scan(&l.ID, &l.Name, &l.Email, &l.Phone, &l.Message, &l.Answers,
			&l.ResultStyleID, &l.ResultPackageID, &l.Status, &l.CreatedAt, &l.UpdatedAt,
			&l.StyleName, &l.PackageName)
		if err != nil {
			return nil, fmt.Errorf("scan lead: %w", err)
		}
		results = append(results, l)
	}

	if results == nil {
		results = []LeadWithDetails{}
	}
	return results, nil
}

func (s *Service) UpdateStatus(ctx context.Context, id string, status string) error {
	tag, err := s.db.Exec(ctx,
		"UPDATE leads SET status = $1 WHERE id = $2",
		status, id)
	if err != nil {
		return fmt.Errorf("update lead status: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrLeadNotFound
	}
	return nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	tag, err := s.db.Exec(ctx, "DELETE FROM leads WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete lead: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrLeadNotFound
	}
	return nil
}

func (s *Service) Stats(ctx context.Context) (*Stats, error) {
	var stats Stats
	err := s.db.QueryRow(ctx, "SELECT COUNT(*) FROM leads").Scan(&stats.Total)
	if err != nil {
		return nil, fmt.Errorf("count leads: %w", err)
	}

	err = s.db.QueryRow(ctx, "SELECT COUNT(*) FROM leads WHERE status = 'NEW'").Scan(&stats.NewCount)
	if err != nil {
		return nil, fmt.Errorf("count new leads: %w", err)
	}

	return &stats, nil
}
