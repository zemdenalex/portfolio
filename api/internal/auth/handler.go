package auth

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"portfolio-api/internal/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	result, err := h.service.Login(r.Context(), &req)
	if err != nil {
		switch {
		case errors.Is(err, ErrEmailRequired), errors.Is(err, ErrPasswordRequired):
			response.ValidationError(w, err.Error())
		case errors.Is(err, ErrInvalidCredentials):
			response.Unauthorized(w, "invalid email or password")
		default:
			response.InternalError(w, "login failed")
		}
		return
	}

	// Set JWT as httpOnly cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    result.Token,
		Path:     "/",
		HttpOnly: true,
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(720 * time.Hour / time.Second),
	})

	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
	response.JSON(w, http.StatusOK, map[string]string{"message": "logged out"})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	claims := GetClaimsFromContext(r.Context())
	if claims == nil {
		response.Unauthorized(w, "not authenticated")
		return
	}

	admin, err := h.service.GetAdminByID(r.Context(), claims.UserID)
	if err != nil {
		response.NotFound(w, "admin not found")
		return
	}

	response.JSON(w, http.StatusOK, ToAdminResponse(admin))
}

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims := GetClaimsFromContext(r.Context())
	if claims == nil {
		response.Unauthorized(w, "not authenticated")
		return
	}

	var req struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	if err := h.service.UpdateProfile(r.Context(), claims.UserID, req.Name); err != nil {
		response.InternalError(w, "update failed")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"message": "profile updated"})
}

func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims := GetClaimsFromContext(r.Context())
	if claims == nil {
		response.Unauthorized(w, "not authenticated")
		return
	}

	var req struct {
		Current     string `json:"current_password"`
		NewPassword string `json:"new_password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	if err := h.service.ChangePassword(r.Context(), claims.UserID, req.Current, req.NewPassword); err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			response.Unauthorized(w, "current password is incorrect")
			return
		}
		response.InternalError(w, "password change failed")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"message": "password changed"})
}
