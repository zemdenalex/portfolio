package quiz

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

func (h *Handler) GetRoot(w http.ResponseWriter, r *http.Request) {
	node, err := h.service.GetRootNode(r.Context())
	if err != nil {
		if errors.Is(err, ErrNodeNotFound) {
			response.NotFound(w, "quiz root node not found")
			return
		}
		response.InternalError(w, "failed to get root node")
		return
	}

	response.JSON(w, http.StatusOK, node)
}

func (h *Handler) GetNode(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "node id is required")
		return
	}

	node, err := h.service.GetNode(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNodeNotFound) {
			response.NotFound(w, "quiz node not found")
			return
		}
		response.InternalError(w, "failed to get node")
		return
	}

	response.JSON(w, http.StatusOK, node)
}

func (h *Handler) GetTree(w http.ResponseWriter, r *http.Request) {
	tree, err := h.service.GetFullTree(r.Context())
	if err != nil {
		response.InternalError(w, "failed to get quiz tree")
		return
	}

	response.JSON(w, http.StatusOK, tree)
}

func (h *Handler) CreateNode(w http.ResponseWriter, r *http.Request) {
	var req CreateNodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	node, err := h.service.CreateNode(r.Context(), &req)
	if err != nil {
		response.InternalError(w, "failed to create node")
		return
	}

	response.JSON(w, http.StatusCreated, node)
}

func (h *Handler) UpdateNode(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "node id is required")
		return
	}

	var req UpdateNodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	node, err := h.service.UpdateNode(r.Context(), id, &req)
	if err != nil {
		if errors.Is(err, ErrNodeNotFound) {
			response.NotFound(w, "quiz node not found")
			return
		}
		response.InternalError(w, "failed to update node")
		return
	}

	response.JSON(w, http.StatusOK, node)
}

func (h *Handler) DeleteNode(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "node id is required")
		return
	}

	if err := h.service.DeleteNode(r.Context(), id); err != nil {
		if errors.Is(err, ErrNodeNotFound) {
			response.NotFound(w, "quiz node not found")
			return
		}
		response.InternalError(w, "failed to delete node")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"message": "node deleted"})
}

func (h *Handler) CreateOption(w http.ResponseWriter, r *http.Request) {
	var req CreateOptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	option, err := h.service.CreateOption(r.Context(), &req)
	if err != nil {
		response.InternalError(w, "failed to create option")
		return
	}

	response.JSON(w, http.StatusCreated, option)
}

func (h *Handler) UpdateOption(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "option id is required")
		return
	}

	var req UpdateOptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	option, err := h.service.UpdateOption(r.Context(), id, &req)
	if err != nil {
		if errors.Is(err, ErrOptionNotFound) {
			response.NotFound(w, "quiz option not found")
			return
		}
		response.InternalError(w, "failed to update option")
		return
	}

	response.JSON(w, http.StatusOK, option)
}

func (h *Handler) DeleteOption(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "option id is required")
		return
	}

	if err := h.service.DeleteOption(r.Context(), id); err != nil {
		if errors.Is(err, ErrOptionNotFound) {
			response.NotFound(w, "quiz option not found")
			return
		}
		response.InternalError(w, "failed to delete option")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"message": "option deleted"})
}

func (h *Handler) ReorderOptions(w http.ResponseWriter, r *http.Request) {
	nodeID := chi.URLParam(r, "id")
	if nodeID == "" {
		response.BadRequest(w, "node id is required")
		return
	}

	var req ReorderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	if err := h.service.ReorderOptions(r.Context(), nodeID, req.OrderedIDs); err != nil {
		response.InternalError(w, "failed to reorder options")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"message": "options reordered"})
}

func (h *Handler) UpdateResult(w http.ResponseWriter, r *http.Request) {
	nodeID := chi.URLParam(r, "id")
	if nodeID == "" {
		response.BadRequest(w, "node id is required")
		return
	}

	var req UpdateResultRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	result, err := h.service.UpdateResult(r.Context(), nodeID, &req)
	if err != nil {
		response.InternalError(w, "failed to update result")
		return
	}

	response.JSON(w, http.StatusOK, result)
}
