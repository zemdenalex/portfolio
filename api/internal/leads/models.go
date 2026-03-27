package leads

import (
	"encoding/json"
	"errors"
	"time"
)

var (
	ErrLeadNotFound  = errors.New("lead not found")
	ErrNameRequired  = errors.New("name is required")
	ErrEmailRequired = errors.New("email is required")
)

type Lead struct {
	ID              string          `json:"id"`
	Name            string          `json:"name"`
	Email           string          `json:"email"`
	Phone           *string         `json:"phone"`
	Message         *string         `json:"message"`
	Answers         json.RawMessage `json:"answers"`
	ResultStyleID   *string         `json:"result_style_id"`
	ResultPackageID *string         `json:"result_package_id"`
	Status          string          `json:"status"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

type LeadWithDetails struct {
	Lead
	StyleName   *string `json:"style_name,omitempty"`
	PackageName *string `json:"package_name,omitempty"`
}

type SubmitRequest struct {
	Name            string          `json:"name"`
	Email           string          `json:"email"`
	Phone           *string         `json:"phone"`
	Message         *string         `json:"message"`
	Answers         json.RawMessage `json:"answers"`
	ResultStyleID   *string         `json:"result_style_id"`
	ResultPackageID *string         `json:"result_package_id"`
}

func (r *SubmitRequest) Validate() error {
	if r.Name == "" {
		return ErrNameRequired
	}
	if r.Email == "" {
		return ErrEmailRequired
	}
	return nil
}

type UpdateStatusRequest struct {
	Status string `json:"status"`
}

type ListParams struct {
	Status string
	Limit  int
	Offset int
}

type Stats struct {
	Total    int `json:"total"`
	NewCount int `json:"new_count"`
}
