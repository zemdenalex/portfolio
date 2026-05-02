package quiz

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) GetRootNode(ctx context.Context) (*NodeWithOptions, error) {
	var n QuizNode
	err := s.db.QueryRow(ctx,
		`SELECT id, parent_id, type, question_en, question_ru, project_type, sort_order
		FROM quiz_nodes WHERE parent_id IS NULL ORDER BY sort_order ASC LIMIT 1`,
	).Scan(&n.ID, &n.ParentID, &n.Type, &n.QuestionEn, &n.QuestionRu, &n.ProjectType, &n.SortOrder)
	if err != nil {
		return nil, ErrNodeNotFound
	}

	options, err := s.getOptionsByNodeID(ctx, n.ID)
	if err != nil {
		return nil, fmt.Errorf("get options: %w", err)
	}

	result, err := s.getResultByNodeID(ctx, n.ID)
	if err != nil {
		result = nil
	}

	return &NodeWithOptions{QuizNode: n, Options: options, Result: result}, nil
}

func (s *Service) GetNode(ctx context.Context, id string) (*NodeWithOptions, error) {
	var n QuizNode
	err := s.db.QueryRow(ctx,
		`SELECT id, parent_id, type, question_en, question_ru, project_type, sort_order
		FROM quiz_nodes WHERE id = $1`,
		id,
	).Scan(&n.ID, &n.ParentID, &n.Type, &n.QuestionEn, &n.QuestionRu, &n.ProjectType, &n.SortOrder)
	if err != nil {
		return nil, ErrNodeNotFound
	}

	options, err := s.getOptionsByNodeID(ctx, n.ID)
	if err != nil {
		return nil, fmt.Errorf("get options: %w", err)
	}

	result, err := s.getResultByNodeID(ctx, n.ID)
	if err != nil {
		result = nil
	}

	return &NodeWithOptions{QuizNode: n, Options: options, Result: result}, nil
}

func (s *Service) GetFullTree(ctx context.Context) ([]NodeWithOptions, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, parent_id, type, question_en, question_ru, project_type, sort_order
		FROM quiz_nodes ORDER BY sort_order ASC`,
	)
	if err != nil {
		return nil, fmt.Errorf("query nodes: %w", err)
	}

	nodes, err := pgx.CollectRows(rows, scanNode)
	if err != nil {
		return nil, fmt.Errorf("collect nodes: %w", err)
	}

	// Load all options
	optRows, err := s.db.Query(ctx,
		`SELECT id, node_id, label_en, label_ru, next_node_id, sort_order, style_weights, project_type
		FROM quiz_options ORDER BY sort_order ASC`,
	)
	if err != nil {
		return nil, fmt.Errorf("query options: %w", err)
	}
	allOptions, err := pgx.CollectRows(optRows, scanOption)
	if err != nil {
		return nil, fmt.Errorf("collect options: %w", err)
	}

	// Load all results
	resRows, err := s.db.Query(ctx,
		`SELECT id, node_id, style_id, package_id, description_en, description_ru
		FROM quiz_results`,
	)
	if err != nil {
		return nil, fmt.Errorf("query results: %w", err)
	}
	allResults, err := pgx.CollectRows(resRows, scanResult)
	if err != nil {
		return nil, fmt.Errorf("collect results: %w", err)
	}

	// Index options by node_id
	optionsByNode := map[string][]QuizOption{}
	for _, o := range allOptions {
		optionsByNode[o.NodeID] = append(optionsByNode[o.NodeID], o)
	}

	// Index results by node_id
	resultByNode := map[string]*QuizResult{}
	for i := range allResults {
		resultByNode[allResults[i].NodeID] = &allResults[i]
	}

	// Build tree nodes
	tree := make([]NodeWithOptions, 0, len(nodes))
	for _, n := range nodes {
		opts := optionsByNode[n.ID]
		if opts == nil {
			opts = []QuizOption{}
		}
		tree = append(tree, NodeWithOptions{
			QuizNode: n,
			Options:  opts,
			Result:   resultByNode[n.ID],
		})
	}

	return tree, nil
}

func (s *Service) CreateNode(ctx context.Context, req *CreateNodeRequest) (*QuizNode, error) {
	var n QuizNode
	err := s.db.QueryRow(ctx,
		`INSERT INTO quiz_nodes (parent_id, type, question_en, question_ru, project_type, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, parent_id, type, question_en, question_ru, project_type, sort_order`,
		req.ParentID, req.Type, req.QuestionEn, req.QuestionRu, req.ProjectType, req.SortOrder,
	).Scan(&n.ID, &n.ParentID, &n.Type, &n.QuestionEn, &n.QuestionRu, &n.ProjectType, &n.SortOrder)
	if err != nil {
		return nil, fmt.Errorf("create node: %w", err)
	}
	return &n, nil
}

func (s *Service) UpdateNode(ctx context.Context, id string, req *UpdateNodeRequest) (*QuizNode, error) {
	var n QuizNode
	err := s.db.QueryRow(ctx,
		`UPDATE quiz_nodes SET
			type = COALESCE($1, type),
			question_en = COALESCE($2, question_en),
			question_ru = COALESCE($3, question_ru),
			project_type = COALESCE($4, project_type),
			sort_order = COALESCE($5, sort_order)
		WHERE id = $6
		RETURNING id, parent_id, type, question_en, question_ru, project_type, sort_order`,
		req.Type, req.QuestionEn, req.QuestionRu, req.ProjectType, req.SortOrder, id,
	).Scan(&n.ID, &n.ParentID, &n.Type, &n.QuestionEn, &n.QuestionRu, &n.ProjectType, &n.SortOrder)
	if err != nil {
		return nil, ErrNodeNotFound
	}
	return &n, nil
}

func (s *Service) DeleteNode(ctx context.Context, id string) error {
	tag, err := s.db.Exec(ctx, "DELETE FROM quiz_nodes WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete node: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNodeNotFound
	}
	return nil
}

func (s *Service) CreateOption(ctx context.Context, req *CreateOptionRequest) (*QuizOption, error) {
	var o QuizOption
	err := s.db.QueryRow(ctx,
		`INSERT INTO quiz_options (node_id, label_en, label_ru, next_node_id, sort_order, style_weights, project_type)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, node_id, label_en, label_ru, next_node_id, sort_order, style_weights, project_type`,
		req.NodeID, req.LabelEn, req.LabelRu, req.NextNodeID, req.SortOrder, req.StyleWeights, req.ProjectType,
	).Scan(&o.ID, &o.NodeID, &o.LabelEn, &o.LabelRu, &o.NextNodeID, &o.SortOrder, &o.StyleWeights, &o.ProjectType)
	if err != nil {
		return nil, fmt.Errorf("create option: %w", err)
	}
	return &o, nil
}

func (s *Service) UpdateOption(ctx context.Context, id string, req *UpdateOptionRequest) (*QuizOption, error) {
	var o QuizOption
	err := s.db.QueryRow(ctx,
		`UPDATE quiz_options SET
			label_en = COALESCE($1, label_en),
			label_ru = COALESCE($2, label_ru),
			next_node_id = COALESCE($3, next_node_id),
			sort_order = COALESCE($4, sort_order),
			style_weights = COALESCE($5, style_weights),
			project_type = COALESCE($6, project_type)
		WHERE id = $7
		RETURNING id, node_id, label_en, label_ru, next_node_id, sort_order, style_weights, project_type`,
		req.LabelEn, req.LabelRu, req.NextNodeID, req.SortOrder, req.StyleWeights, req.ProjectType, id,
	).Scan(&o.ID, &o.NodeID, &o.LabelEn, &o.LabelRu, &o.NextNodeID, &o.SortOrder, &o.StyleWeights, &o.ProjectType)
	if err != nil {
		return nil, ErrOptionNotFound
	}
	return &o, nil
}

func (s *Service) DeleteOption(ctx context.Context, id string) error {
	tag, err := s.db.Exec(ctx, "DELETE FROM quiz_options WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete option: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrOptionNotFound
	}
	return nil
}

func (s *Service) ReorderOptions(ctx context.Context, nodeID string, orderedIDs []string) error {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	for i, id := range orderedIDs {
		_, err := tx.Exec(ctx,
			"UPDATE quiz_options SET sort_order = $1 WHERE id = $2 AND node_id = $3",
			i, id, nodeID)
		if err != nil {
			return fmt.Errorf("reorder option %s: %w", id, err)
		}
	}

	return tx.Commit(ctx)
}

func (s *Service) UpdateResult(ctx context.Context, nodeID string, req *UpdateResultRequest) (*QuizResult, error) {
	var r QuizResult
	err := s.db.QueryRow(ctx,
		`INSERT INTO quiz_results (node_id, style_id, package_id, description_en, description_ru)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (node_id) DO UPDATE SET
			style_id = EXCLUDED.style_id,
			package_id = EXCLUDED.package_id,
			description_en = EXCLUDED.description_en,
			description_ru = EXCLUDED.description_ru
		RETURNING id, node_id, style_id, package_id, description_en, description_ru`,
		nodeID, req.StyleID, req.PackageID, req.DescriptionEn, req.DescriptionRu,
	).Scan(&r.ID, &r.NodeID, &r.StyleID, &r.PackageID, &r.DescriptionEn, &r.DescriptionRu)
	if err != nil {
		return nil, fmt.Errorf("upsert result: %w", err)
	}
	return &r, nil
}

// --- Helpers ---

func (s *Service) getOptionsByNodeID(ctx context.Context, nodeID string) ([]QuizOption, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, node_id, label_en, label_ru, next_node_id, sort_order, style_weights, project_type
		FROM quiz_options WHERE node_id = $1 ORDER BY sort_order ASC`,
		nodeID,
	)
	if err != nil {
		return nil, err
	}

	options, err := pgx.CollectRows(rows, scanOption)
	if err != nil {
		return nil, err
	}

	if options == nil {
		options = []QuizOption{}
	}
	return options, nil
}

func (s *Service) getResultByNodeID(ctx context.Context, nodeID string) (*QuizResult, error) {
	var r QuizResult
	err := s.db.QueryRow(ctx,
		`SELECT id, node_id, style_id, package_id, description_en, description_ru
		FROM quiz_results WHERE node_id = $1`,
		nodeID,
	).Scan(&r.ID, &r.NodeID, &r.StyleID, &r.PackageID, &r.DescriptionEn, &r.DescriptionRu)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func scanNode(row pgx.CollectableRow) (QuizNode, error) {
	var n QuizNode
	err := row.Scan(&n.ID, &n.ParentID, &n.Type, &n.QuestionEn, &n.QuestionRu, &n.ProjectType, &n.SortOrder)
	return n, err
}

func scanOption(row pgx.CollectableRow) (QuizOption, error) {
	var o QuizOption
	err := row.Scan(&o.ID, &o.NodeID, &o.LabelEn, &o.LabelRu, &o.NextNodeID, &o.SortOrder, &o.StyleWeights, &o.ProjectType)
	return o, err
}

func scanResult(row pgx.CollectableRow) (QuizResult, error) {
	var r QuizResult
	err := row.Scan(&r.ID, &r.NodeID, &r.StyleID, &r.PackageID, &r.DescriptionEn, &r.DescriptionRu)
	return r, err
}
