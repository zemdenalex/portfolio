package quiz

import (
	"encoding/json"
	"errors"
)

var (
	ErrNodeNotFound   = errors.New("quiz node not found")
	ErrOptionNotFound = errors.New("quiz option not found")
	ErrResultNotFound = errors.New("quiz result not found")
)

type QuizNode struct {
	ID          string  `json:"id"`
	ParentID    *string `json:"parent_id"`
	Type        string  `json:"type"`
	QuestionEn  *string `json:"question_en"`
	QuestionRu  *string `json:"question_ru"`
	ProjectType *string `json:"project_type"`
	SortOrder   int     `json:"sort_order"`
}

type QuizOption struct {
	ID           string          `json:"id"`
	NodeID       string          `json:"node_id"`
	LabelEn      string          `json:"label_en"`
	LabelRu      string          `json:"label_ru"`
	NextNodeID   *string         `json:"next_node_id"`
	SortOrder    int             `json:"sort_order"`
	StyleWeights json.RawMessage `json:"style_weights"`
	ProjectType  *string         `json:"project_type"`
}

type QuizResult struct {
	ID            string  `json:"id"`
	NodeID        string  `json:"node_id"`
	StyleID       string  `json:"style_id"`
	PackageID     string  `json:"package_id"`
	DescriptionEn *string `json:"description_en"`
	DescriptionRu *string `json:"description_ru"`
}

type NodeWithOptions struct {
	QuizNode
	Options []QuizOption `json:"options"`
	Result  *QuizResult  `json:"result,omitempty"`
}

type CreateNodeRequest struct {
	ParentID    *string `json:"parent_id"`
	Type        string  `json:"type"`
	QuestionEn  *string `json:"question_en"`
	QuestionRu  *string `json:"question_ru"`
	ProjectType *string `json:"project_type"`
	SortOrder   int     `json:"sort_order"`
}

type UpdateNodeRequest struct {
	Type        *string `json:"type"`
	QuestionEn  *string `json:"question_en"`
	QuestionRu  *string `json:"question_ru"`
	ProjectType *string `json:"project_type"`
	SortOrder   *int    `json:"sort_order"`
}

type CreateOptionRequest struct {
	NodeID       string          `json:"node_id"`
	LabelEn      string          `json:"label_en"`
	LabelRu      string          `json:"label_ru"`
	NextNodeID   *string         `json:"next_node_id"`
	SortOrder    int             `json:"sort_order"`
	StyleWeights json.RawMessage `json:"style_weights"`
	ProjectType  *string         `json:"project_type"`
}

type UpdateOptionRequest struct {
	LabelEn      *string         `json:"label_en"`
	LabelRu      *string         `json:"label_ru"`
	NextNodeID   *string         `json:"next_node_id"`
	SortOrder    *int            `json:"sort_order"`
	StyleWeights json.RawMessage `json:"style_weights"`
	ProjectType  *string         `json:"project_type"`
}

type ReorderRequest struct {
	OrderedIDs []string `json:"ordered_ids"`
}

type UpdateResultRequest struct {
	StyleID       string  `json:"style_id"`
	PackageID     string  `json:"package_id"`
	DescriptionEn *string `json:"description_en"`
	DescriptionRu *string `json:"description_ru"`
}
