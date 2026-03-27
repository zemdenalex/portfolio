package packages

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
		response.InternalError(w, "failed to list packages")
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
			response.NotFound(w, "package not found")
			return
		}
		response.InternalError(w, "failed to get package")
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
		response.InternalError(w, "failed to create package")
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
			response.NotFound(w, "package not found")
			return
		}
		if errors.Is(err, ErrSlugRequired) || errors.Is(err, ErrNameRequired) {
			response.ValidationError(w, err.Error())
			return
		}
		response.InternalError(w, "failed to update package")
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
			response.NotFound(w, "package not found")
			return
		}
		response.InternalError(w, "failed to delete package")
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "package deleted"})
}

func (h *Handler) Reorder(w http.ResponseWriter, r *http.Request) {
	var req ReorderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	if err := h.service.Reorder(r.Context(), req.OrderedIDs); err != nil {
		response.InternalError(w, "failed to reorder packages")
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "packages reordered"})
}

func (h *Handler) ToggleActive(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.BadRequest(w, "id is required")
		return
	}

	result, err := h.service.ToggleActive(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(w, "package not found")
			return
		}
		response.InternalError(w, "failed to toggle package")
		return
	}
	response.JSON(w, http.StatusOK, result)
}
