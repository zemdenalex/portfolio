package portfolio

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

func (h *Handler) ListPublic(w http.ResponseWriter, r *http.Request) {
	params := ListParams{
		Search: r.URL.Query().Get("search"),
		Type:   r.URL.Query().Get("type"),
	}
	if r.URL.Query().Get("featured") == "true" {
		t := true
		params.Featured = &t
	}
	if limit, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil {
		params.Limit = limit
	}
	if offset, err := strconv.Atoi(r.URL.Query().Get("offset")); err == nil {
		params.Offset = offset
	}

	projects, err := h.service.ListPublished(r.Context(), params)
	if err != nil {
		response.InternalError(w, "failed to list projects")
		return
	}

	response.JSON(w, http.StatusOK, projects)
}

// ListSlugs returns a minimal list of {slug, updated_at} for sitemap generation.
func (h *Handler) ListSlugs(w http.ResponseWriter, r *http.Request) {
	slugs, err := h.service.ListSlugs(r.Context())
	if err != nil {
		response.InternalError(w, "failed to list slugs")
		return
	}
	response.JSON(w, http.StatusOK, slugs)
}

func (h *Handler) GetPublic(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if slug == "" {
		response.BadRequest(w, "slug is required")
		return
	}

	project, err := h.service.GetBySlug(r.Context(), slug)
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			response.NotFound(w, "project not found")
			return
		}
		response.InternalError(w, "failed to get project")
		return
	}

	if project.Status != "PUBLISHED" {
		response.NotFound(w, "project not found")
		return
	}

	response.JSON(w, http.StatusOK, project)
}

func (h *Handler) ListAll(w http.ResponseWriter, r *http.Request) {
	params := ListParams{
		Search: r.URL.Query().Get("search"),
		Type:   r.URL.Query().Get("type"),
		Status: r.URL.Query().Get("status"),
	}
	if limit, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil {
		params.Limit = limit
	}
	if offset, err := strconv.Atoi(r.URL.Query().Get("offset")); err == nil {
		params.Offset = offset
	}

	projects, err := h.service.ListAll(r.Context(), params)
	if err != nil {
		response.InternalError(w, "failed to list projects")
		return
	}

	response.JSON(w, http.StatusOK, projects)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	project, err := h.service.Create(r.Context(), &req)
	if err != nil {
		switch {
		case errors.Is(err, ErrSlugRequired), errors.Is(err, ErrTitleRequired), errors.Is(err, ErrTypeRequired):
			response.ValidationError(w, err.Error())
		default:
			response.InternalError(w, "failed to create project")
		}
		return
	}

	response.JSON(w, http.StatusCreated, project)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "id is required")
		return
	}

	var req UpdateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	project, err := h.service.Update(r.Context(), id, &req)
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			response.NotFound(w, "project not found")
			return
		}
		response.InternalError(w, "failed to update project")
		return
	}

	response.JSON(w, http.StatusOK, project)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "id is required")
		return
	}

	if err := h.service.Delete(r.Context(), id); err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			response.NotFound(w, "project not found")
			return
		}
		response.InternalError(w, "failed to delete project")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"message": "project deleted"})
}

func (h *Handler) Reorder(w http.ResponseWriter, r *http.Request) {
	var req ReorderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	if err := h.service.Reorder(r.Context(), req.OrderedIDs); err != nil {
		response.InternalError(w, "failed to reorder projects")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"message": "projects reordered"})
}

func (h *Handler) CreateBlock(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	if projectID == "" {
		response.BadRequest(w, "project id is required")
		return
	}

	var req CreateBlockRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	block, err := h.service.CreateBlock(r.Context(), projectID, &req)
	if err != nil {
		response.InternalError(w, "failed to create block")
		return
	}

	response.JSON(w, http.StatusCreated, block)
}

func (h *Handler) UpdateBlock(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "block id is required")
		return
	}

	var req UpdateBlockRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	block, err := h.service.UpdateBlock(r.Context(), id, &req)
	if err != nil {
		if errors.Is(err, ErrBlockNotFound) {
			response.NotFound(w, "block not found")
			return
		}
		response.InternalError(w, "failed to update block")
		return
	}

	response.JSON(w, http.StatusOK, block)
}

func (h *Handler) DeleteBlock(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "block id is required")
		return
	}

	if err := h.service.DeleteBlock(r.Context(), id); err != nil {
		if errors.Is(err, ErrBlockNotFound) {
			response.NotFound(w, "block not found")
			return
		}
		response.InternalError(w, "failed to delete block")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"message": "block deleted"})
}

func (h *Handler) ReorderBlocks(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	if projectID == "" {
		response.BadRequest(w, "project id is required")
		return
	}

	var req ReorderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	if err := h.service.ReorderBlocks(r.Context(), projectID, req.OrderedIDs); err != nil {
		response.InternalError(w, "failed to reorder blocks")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"message": "blocks reordered"})
}
