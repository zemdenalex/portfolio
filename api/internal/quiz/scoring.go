package quiz

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
)

// Style is a lightweight view of quiz_styles used by scoring.
type Style struct {
	ID            string `json:"id"`
	Slug          string `json:"slug"`
	NameEn        string `json:"name_en"`
	NameRu        string `json:"name_ru"`
	DescriptionEn string `json:"description_en"`
	DescriptionRu string `json:"description_ru"`
}

// StyleReference is a lightweight view of style_references used by scoring.
type StyleReference struct {
	ID            string  `json:"id"`
	StyleID       string  `json:"style_id"`
	URL           string  `json:"url"`
	LabelEn       string  `json:"label_en"`
	LabelRu       string  `json:"label_ru"`
	Type          string  `json:"type"`
	SortOrder     int     `json:"sort_order"`
	ScreenshotURL *string `json:"screenshot_url"`
	Embeddable    bool    `json:"embeddable"`
}

// Package is a lightweight view of service_packages used by scoring.
type Package struct {
	ID            string `json:"id"`
	Slug          string `json:"slug"`
	NameEn        string `json:"name_en"`
	NameRu        string `json:"name_ru"`
	ProjectType   string `json:"project_type"`
	DescriptionEn string `json:"description_en"`
	DescriptionRu string `json:"description_ru"`
	PriceFrom     int    `json:"price_from"`
	PriceTo       int    `json:"price_to"`
}

// ScoreResult is the output of ComputeResult.
type ScoreResult struct {
	Style      *Style           `json:"style"`
	References []StyleReference `json:"references"`
	Package    *Package         `json:"package"`
}

// ComputeResult accumulates style_weights from the selected options,
// picks the winning style (highest score; alphabetical tie-break),
// loads the style's references, and optionally matches a service package.
func (s *Service) ComputeResult(ctx context.Context, optionIDs []string) (*ScoreResult, error) {
	if len(optionIDs) == 0 {
		return nil, fmt.Errorf("no options provided")
	}

	rows, err := s.db.Query(ctx,
		`SELECT id, style_weights, project_type FROM quiz_options WHERE id = ANY($1)`,
		optionIDs,
	)
	if err != nil {
		return nil, fmt.Errorf("load options: %w", err)
	}
	defer rows.Close()

	scores := map[string]int{}
	var projectType *string
	for rows.Next() {
		var id string
		var weightsRaw json.RawMessage
		var pt *string
		if err := rows.Scan(&id, &weightsRaw, &pt); err != nil {
			return nil, fmt.Errorf("scan option: %w", err)
		}
		if pt != nil {
			projectType = pt
		}
		var weights map[string]int
		if err := json.Unmarshal(weightsRaw, &weights); err != nil {
			return nil, fmt.Errorf("unmarshal weights: %w", err)
		}
		for slug, w := range weights {
			scores[slug] += w
		}
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	if len(scores) == 0 {
		return nil, fmt.Errorf("no style scores computed — options may have empty weights")
	}

	winningSlug := pickWinner(scores)

	style, err := s.getStyleBySlug(ctx, winningSlug)
	if err != nil {
		return nil, fmt.Errorf("get style: %w", err)
	}
	refs, err := s.getStyleReferences(ctx, style.ID)
	if err != nil {
		return nil, fmt.Errorf("get references: %w", err)
	}

	var pkg *Package
	if projectType != nil {
		pkg, _ = s.getFirstPackageByProjectType(ctx, *projectType)
	}

	return &ScoreResult{Style: style, References: refs, Package: pkg}, nil
}

// pickWinner returns the slug with the highest score.
// Ties are broken alphabetically (lower slug wins).
func pickWinner(scores map[string]int) string {
	type kv struct {
		k string
		v int
	}
	pairs := make([]kv, 0, len(scores))
	for k, v := range scores {
		pairs = append(pairs, kv{k, v})
	}
	sort.Slice(pairs, func(i, j int) bool {
		if pairs[i].v != pairs[j].v {
			return pairs[i].v > pairs[j].v
		}
		return pairs[i].k < pairs[j].k
	})
	return pairs[0].k
}

func (s *Service) getStyleBySlug(ctx context.Context, slug string) (*Style, error) {
	var st Style
	err := s.db.QueryRow(ctx,
		`SELECT id, slug, name_en, name_ru, description_en, description_ru FROM quiz_styles WHERE slug = $1`,
		slug,
	).Scan(&st.ID, &st.Slug, &st.NameEn, &st.NameRu, &st.DescriptionEn, &st.DescriptionRu)
	if err != nil {
		return nil, err
	}
	return &st, nil
}

func (s *Service) getStyleReferences(ctx context.Context, styleID string) ([]StyleReference, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, style_id, url, label_en, label_ru, type, sort_order, screenshot_url, embeddable
		 FROM style_references WHERE style_id = $1 ORDER BY sort_order`,
		styleID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var refs []StyleReference
	for rows.Next() {
		var r StyleReference
		if err := rows.Scan(&r.ID, &r.StyleID, &r.URL, &r.LabelEn, &r.LabelRu, &r.Type, &r.SortOrder, &r.ScreenshotURL, &r.Embeddable); err != nil {
			return nil, err
		}
		refs = append(refs, r)
	}
	if refs == nil {
		refs = []StyleReference{}
	}
	return refs, rows.Err()
}

func (s *Service) getFirstPackageByProjectType(ctx context.Context, pt string) (*Package, error) {
	var p Package
	err := s.db.QueryRow(ctx,
		`SELECT id, slug, name_en, name_ru, project_type, description_en, description_ru, price_from, price_to
		 FROM service_packages WHERE project_type = $1 ORDER BY price_from ASC LIMIT 1`,
		pt,
	).Scan(&p.ID, &p.Slug, &p.NameEn, &p.NameRu, &p.ProjectType, &p.DescriptionEn, &p.DescriptionRu, &p.PriceFrom, &p.PriceTo)
	if err != nil {
		return nil, err
	}
	return &p, nil
}
