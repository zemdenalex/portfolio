package leads

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"portfolio-api/internal/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Submit(w http.ResponseWriter, r *http.Request) {
	var req SubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	lead, err := h.service.Submit(r.Context(), &req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNameRequired), errors.Is(err, ErrEmailRequired):
			response.ValidationError(w, err.Error())
		default:
			response.InternalError(w, "failed to submit lead")
		}
		return
	}

	response.JSON(w, http.StatusCreated, lead)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	params := ListParams{
		Status: r.URL.Query().Get("status"),
	}
	if limit, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil {
		params.Limit = limit
	}
	if offset, err := strconv.Atoi(r.URL.Query().Get("offset")); err == nil {
		params.Offset = offset
	}

	leads, err := h.service.List(r.Context(), params)
	if err != nil {
		response.InternalError(w, "failed to list leads")
		return
	}

	response.JSON(w, http.StatusOK, leads)
}

func (h *Handler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "lead id is required")
		return
	}

	var req UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	if err := h.service.UpdateStatus(r.Context(), id, req.Status); err != nil {
		if errors.Is(err, ErrLeadNotFound) {
			response.NotFound(w, "lead not found")
			return
		}
		response.InternalError(w, "failed to update lead status")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"message": "lead status updated"})
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "lead id is required")
		return
	}

	if err := h.service.Delete(r.Context(), id); err != nil {
		if errors.Is(err, ErrLeadNotFound) {
			response.NotFound(w, "lead not found")
			return
		}
		response.InternalError(w, "failed to delete lead")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"message": "lead deleted"})
}

func (h *Handler) Stats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.service.Stats(r.Context())
	if err != nil {
		response.InternalError(w, "failed to get lead stats")
		return
	}

	response.JSON(w, http.StatusOK, stats)
}

func (h *Handler) TrackerExport(w http.ResponseWriter, r *http.Request) {
	export, err := h.service.TrackerExport(r.Context())
	if err != nil {
		response.InternalError(w, "failed to export leads")
		return
	}
	response.JSON(w, http.StatusOK, export)
}
