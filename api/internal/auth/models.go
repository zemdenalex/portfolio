package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrEmailRequired      = errors.New("email is required")
	ErrPasswordRequired   = errors.New("password is required")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserNotActive      = errors.New("user account is not active")
	ErrInvalidToken       = errors.New("invalid token")
	ErrTokenExpired       = errors.New("token expired")
)

type Claims struct {
	UserID int64  `json:"user_id"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	jwt.RegisteredClaims
}

type Admin struct {
	ID           int64
	Email        string
	PasswordHash string
	Name         string
	CreatedAt    time.Time
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (r *LoginRequest) Validate() error {
	if r.Email == "" {
		return ErrEmailRequired
	}
	if r.Password == "" {
		return ErrPasswordRequired
	}
	return nil
}

type LoginResponse struct {
	Token string       `json:"token"`
	Admin AdminResponse `json:"admin"`
}

type AdminResponse struct {
	ID    int64  `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

func ToAdminResponse(a *Admin) AdminResponse {
	return AdminResponse{
		ID:    a.ID,
		Email: a.Email,
		Name:  a.Name,
	}
}
