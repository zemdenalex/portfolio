package screenshot

import (
	"encoding/json"
	"net/http"

	"portfolio-api/internal/response"
	"portfolio-api/internal/styles"
)

type Handler struct {
	service       *Service
	stylesService *styles.Service
}

func NewHandler(service *Service, stylesService *styles.Service) *Handler {
	return &Handler{
		service:       service,
		stylesService: stylesService,
	}
}

type CaptureRequest struct {
	URL         string `json:"url"`
	ReferenceID string `json:"reference_id"`
}

func (h *Handler) Capture(w http.ResponseWriter, r *http.Request) {
	var req CaptureRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	if req.URL == "" || req.ReferenceID == "" {
		response.BadRequest(w, "url and reference_id are required")
		return
	}

	result, err := h.service.Capture(r.Context(), req.URL)
	if err != nil {
		response.InternalError(w, "failed to capture screenshot: "+err.Error())
		return
	}

	if err := h.stylesService.UpdateRefScreenshot(r.Context(), req.ReferenceID, result.ScreenshotURL, result.Embeddable); err != nil {
		response.InternalError(w, "screenshot captured but failed to update reference")
		return
	}

	response.JSON(w, http.StatusOK, result)
}
