package packages

import "errors"

var (
	ErrNotFound     = errors.New("package not found")
	ErrSlugRequired = errors.New("slug is required")
	ErrNameRequired = errors.New("name is required")
)

type ServicePackage struct {
	ID            string   `json:"id"`
	Slug          string   `json:"slug"`
	NameEn        string   `json:"name_en"`
	NameRu        string   `json:"name_ru"`
	ProjectType   string   `json:"project_type"`
	DescriptionEn string   `json:"description_en"`
	DescriptionRu string   `json:"description_ru"`
	PriceFrom     int      `json:"price_from"`
	PriceTo       int      `json:"price_to"`
	Currency      string   `json:"currency"`
	FeaturesEn    []string `json:"features_en"`
	FeaturesRu    []string `json:"features_ru"`
	DeliveryDays  *int     `json:"delivery_days"`
	SortOrder     int      `json:"sort_order"`
	Active        bool     `json:"active"`
}

type CreateRequest struct {
	Slug          string   `json:"slug"`
	NameEn        string   `json:"name_en"`
	NameRu        string   `json:"name_ru"`
	ProjectType   string   `json:"project_type"`
	DescriptionEn string   `json:"description_en"`
	DescriptionRu string   `json:"description_ru"`
	PriceFrom     int      `json:"price_from"`
	PriceTo       int      `json:"price_to"`
	Currency      string   `json:"currency"`
	FeaturesEn    []string `json:"features_en"`
	FeaturesRu    []string `json:"features_ru"`
	DeliveryDays  *int     `json:"delivery_days"`
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

type ReorderRequest struct {
	OrderedIDs []string `json:"ordered_ids"`
}
