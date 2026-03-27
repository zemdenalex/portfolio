package content

import (
	"encoding/json"
	"errors"
	"net/http"

	"portfolio-api/internal/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	result, err := h.service.List(r.Context())
	if err != nil {
		response.InternalError(w, "failed to list content")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")
	if key == "" {
		response.BadRequest(w, "key is required")
		return
	}

	var req UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	result, err := h.service.Update(r.Context(), key, req.ValueEn, req.ValueRu)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(w, "content not found")
			return
		}
		response.InternalError(w, "failed to update content")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	result, err := h.service.Create(r.Context(), &req)
	if err != nil {
		if errors.Is(err, ErrKeyRequired) {
			response.ValidationError(w, err.Error())
			return
		}
		response.InternalError(w, "failed to create content")
		return
	}
	response.JSON(w, http.StatusCreated, result)
}
