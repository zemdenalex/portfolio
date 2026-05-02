package portfolio

import (
	"encoding/json"
	"errors"
	"time"
)

var (
	ErrProjectNotFound = errors.New("project not found")
	ErrBlockNotFound   = errors.New("content block not found")
	ErrSlugRequired    = errors.New("slug is required")
	ErrTitleRequired   = errors.New("title is required")
	ErrTypeRequired    = errors.New("type is required")
)

type Project struct {
	ID               string    `json:"id"`
	Slug             string    `json:"slug"`
	TitleEn          string    `json:"title_en"`
	TitleRu          string    `json:"title_ru"`
	DescriptionEn    string    `json:"description_en"`
	DescriptionRu    string    `json:"description_ru"`
	Type             string    `json:"type"`
	Status           string    `json:"status"`
	ThumbnailURL     *string   `json:"thumbnail_url"`
	LiveURL          *string   `json:"live_url"`
	Featured         bool      `json:"featured"`
	TechStack        []string  `json:"tech_stack"`
	SortOrder        int       `json:"sort_order"`
	IsIframeFriendly bool      `json:"is_iframe_friendly"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type ContentBlock struct {
	ID        string          `json:"id"`
	ProjectID string          `json:"project_id"`
	Type      string          `json:"type"`
	SortOrder int             `json:"sort_order"`
	Content   json.RawMessage `json:"content"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}

type ProjectWithBlocks struct {
	Project
	Blocks []ContentBlock `json:"blocks"`
}

type CreateProjectRequest struct {
	Slug             string   `json:"slug"`
	TitleEn          string   `json:"title_en"`
	TitleRu          string   `json:"title_ru"`
	DescriptionEn    string   `json:"description_en"`
	DescriptionRu    string   `json:"description_ru"`
	Type             string   `json:"type"`
	Status           string   `json:"status"`
	ThumbnailURL     *string  `json:"thumbnail_url"`
	LiveURL          *string  `json:"live_url"`
	Featured         bool     `json:"featured"`
	TechStack        []string `json:"tech_stack"`
	SortOrder        int      `json:"sort_order"`
	IsIframeFriendly bool     `json:"is_iframe_friendly"`
}

func (r *CreateProjectRequest) Validate() error {
	if r.Slug == "" {
		return ErrSlugRequired
	}
	if r.TitleEn == "" && r.TitleRu == "" {
		return ErrTitleRequired
	}
	if r.Type == "" {
		return ErrTypeRequired
	}
	if r.Status == "" {
		r.Status = "DRAFT"
	}
	return nil
}

type UpdateProjectRequest struct {
	Slug             *string  `json:"slug"`
	TitleEn          *string  `json:"title_en"`
	TitleRu          *string  `json:"title_ru"`
	DescriptionEn    *string  `json:"description_en"`
	DescriptionRu    *string  `json:"description_ru"`
	Type             *string  `json:"type"`
	Status           *string  `json:"status"`
	ThumbnailURL     *string  `json:"thumbnail_url"`
	LiveURL          *string  `json:"live_url"`
	Featured         *bool    `json:"featured"`
	TechStack        []string `json:"tech_stack"`
	SortOrder        *int     `json:"sort_order"`
	IsIframeFriendly *bool    `json:"is_iframe_friendly"`
}

type ReorderRequest struct {
	OrderedIDs []string `json:"ordered_ids"`
}

type CreateBlockRequest struct {
	Type      string          `json:"type"`
	SortOrder int             `json:"sort_order"`
	Content   json.RawMessage `json:"content"`
}

type UpdateBlockRequest struct {
	Content json.RawMessage `json:"content"`
}

type ListParams struct {
	Search string
	Type   string
	Status string
	Limit  int
	Offset int
}
