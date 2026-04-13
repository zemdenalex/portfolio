package styles

import "errors"

var (
	ErrNotFound     = errors.New("style not found")
	ErrSlugRequired = errors.New("slug is required")
	ErrNameRequired = errors.New("name is required")
	ErrRefNotFound  = errors.New("style reference not found")
)

type QuizStyle struct {
	ID            string `json:"id"`
	Slug          string `json:"slug"`
	NameEn        string `json:"name_en"`
	NameRu        string `json:"name_ru"`
	DescriptionEn string `json:"description_en"`
	DescriptionRu string `json:"description_ru"`
}

type StyleReference struct {
	ID        string `json:"id"`
	StyleID   string `json:"style_id"`
	URL       string `json:"url"`
	LabelEn   string `json:"label_en"`
	LabelRu   string `json:"label_ru"`
	Type          string  `json:"type"`
	SortOrder     int     `json:"sort_order"`
	ScreenshotURL *string `json:"screenshot_url"`
	Embeddable    bool    `json:"embeddable"`
}

type StyleWithRefs struct {
	QuizStyle
	References []StyleReference `json:"references"`
}

type CreateRequest struct {
	Slug          string `json:"slug"`
	NameEn        string `json:"name_en"`
	NameRu        string `json:"name_ru"`
	DescriptionEn string `json:"description_en"`
	DescriptionRu string `json:"description_ru"`
}

func (r *CreateRequest) Validate() error {
	if r.Slug == "" {
		return ErrSlugRequired
	}
	if r.NameEn == "" || r.NameRu == "" {
		return ErrNameRequired
	}
	return nil
}

type UpdateRequest = CreateRequest

type CreateRefRequest struct {
	StyleID string `json:"style_id"`
	URL     string `json:"url"`
	LabelEn string `json:"label_en"`
	LabelRu string `json:"label_ru"`
	Type    string `json:"type"`
}

type ReorderRequest struct {
	OrderedIDs []string `json:"ordered_ids"`
}
