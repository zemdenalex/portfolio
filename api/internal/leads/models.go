package leads

import (
	"encoding/json"
	"errors"
	"strings"
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
	if len(r.Email) > 254 {
		return ErrEmailRequired
	}
	if !strings.Contains(r.Email, "@") {
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

// TrackerExportLead is the shape the Freelance Tracker app expects when importing portfolio leads.
type TrackerExportLead struct {
	ID          string `json:"id"`
	SubmittedAt string `json:"submitted_at"`
	Status      string `json:"status"`
	Client      TrackerClient  `json:"client"`
	Project     TrackerProject `json:"project"`
}

type TrackerClient struct {
	Name  string  `json:"name"`
	Email string  `json:"email"`
	Phone *string `json:"phone"`
	Notes *string `json:"notes"`
}

type TrackerProject struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
	Style       *string `json:"style"`
	Package     *string `json:"package"`
}

type TrackerExportResponse struct {
	Leads      []TrackerExportLead `json:"leads"`
	ExportedAt string              `json:"exported_at"`
}
