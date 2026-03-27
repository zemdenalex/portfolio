package styles

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
		response.InternalError(w, "failed to list styles")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.BadRequest(w, "id is required")
		return
	}

	result, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(w, "style not found")
			return
		}
		response.InternalError(w, "failed to get style")
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
		if errors.Is(err, ErrSlugRequired) || errors.Is(err, ErrNameRequired) {
			response.ValidationError(w, err.Error())
			return
		}
		response.InternalError(w, "failed to create style")
		return
	}
	response.JSON(w, http.StatusCreated, result)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.BadRequest(w, "id is required")
		return
	}

	var req UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	result, err := h.service.Update(r.Context(), id, &req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(w, "style not found")
			return
		}
		if errors.Is(err, ErrSlugRequired) || errors.Is(err, ErrNameRequired) {
			response.ValidationError(w, err.Error())
			return
		}
		response.InternalError(w, "failed to update style")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.BadRequest(w, "id is required")
		return
	}

	if err := h.service.Delete(r.Context(), id); err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(w, "style not found")
			return
		}
		response.InternalError(w, "failed to delete style")
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "style deleted"})
}

func (h *Handler) CreateRef(w http.ResponseWriter, r *http.Request) {
	var req CreateRefRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	result, err := h.service.CreateRef(r.Context(), &req)
	if err != nil {
		response.InternalError(w, "failed to create reference")
		return
	}
	response.JSON(w, http.StatusCreated, result)
}

func (h *Handler) DeleteRef(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.BadRequest(w, "id is required")
		return
	}

	if err := h.service.DeleteRef(r.Context(), id); err != nil {
		if errors.Is(err, ErrRefNotFound) {
			response.NotFound(w, "reference not found")
			return
		}
		response.InternalError(w, "failed to delete reference")
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "reference deleted"})
}

func (h *Handler) ReorderRefs(w http.ResponseWriter, r *http.Request) {
	styleID := r.PathValue("id")
	if styleID == "" {
		response.BadRequest(w, "style id is required")
		return
	}

	var req ReorderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	if err := h.service.ReorderRefs(r.Context(), styleID, req.OrderedIDs); err != nil {
		response.InternalError(w, "failed to reorder references")
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "references reordered"})
}
