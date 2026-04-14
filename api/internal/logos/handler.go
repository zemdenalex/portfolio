package logos

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"portfolio-api/internal/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) CreateSession(w http.ResponseWriter, r *http.Request) {
	var req CreateSessionRequest
	if r.Body != http.NoBody {
		_ = json.NewDecoder(r.Body).Decode(&req)
	}
	sess, err := h.service.CreateSession(r.Context(), req.Label)
	if err != nil {
		response.InternalError(w, "failed to create session")
		return
	}
	response.JSON(w, http.StatusCreated, sess)
}

func (h *Handler) GetSession(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "session id is required")
		return
	}
	data, err := h.service.GetSession(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrSessionNotFound) {
			response.NotFound(w, "session not found")
			return
		}
		response.InternalError(w, "failed to get session")
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) UpdateSession(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "session id is required")
		return
	}
	var req UpdateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}
	if err := h.service.UpdateSessionLabel(r.Context(), id, req.Label); err != nil {
		if errors.Is(err, ErrSessionNotFound) {
			response.NotFound(w, "session not found")
			return
		}
		response.InternalError(w, "failed to update session")
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "session updated"})
}

func (h *Handler) Rate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "session id is required")
		return
	}
	var req RateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}
	if err := h.service.Rate(r.Context(), id, &req); err != nil {
		switch {
		case errors.Is(err, ErrInvalidLogoID), errors.Is(err, ErrInvalidScore):
			response.ValidationError(w, err.Error())
		default:
			response.InternalError(w, "failed to save rating")
		}
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "rating saved"})
}

func (h *Handler) SetFavorite(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "session id is required")
		return
	}
	var body struct {
		LogoID     int  `json:"logo_id"`
		IsFavorite bool `json:"is_favorite"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}
	if err := h.service.SetFavorite(r.Context(), id, body.LogoID, body.IsFavorite); err != nil {
		if errors.Is(err, ErrInvalidLogoID) {
			response.ValidationError(w, err.Error())
			return
		}
		response.InternalError(w, "failed to update favorite")
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "favorite updated"})
}

func (h *Handler) Compare(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "session id is required")
		return
	}
	var req CompareRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}
	if err := h.service.Compare(r.Context(), id, &req); err != nil {
		switch {
		case errors.Is(err, ErrInvalidLogoID), errors.Is(err, ErrSameLogoCompared):
			response.ValidationError(w, err.Error())
		default:
			response.InternalError(w, "failed to record comparison")
		}
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "comparison recorded"})
}

func (h *Handler) Stats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.service.Stats(r.Context())
	if err != nil {
		response.InternalError(w, "failed to load stats")
		return
	}
	response.JSON(w, http.StatusOK, stats)
}

func (h *Handler) ListSessions(w http.ResponseWriter, r *http.Request) {
	sessions, err := h.service.ListSessions(r.Context())
	if err != nil {
		response.InternalError(w, "failed to list sessions")
		return
	}
	response.JSON(w, http.StatusOK, sessions)
}
