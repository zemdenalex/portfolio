package middleware

import (
	"net/http"
	"strings"

	"portfolio-api/internal/auth"
	"portfolio-api/internal/response"
)

func Auth(authService *auth.Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var tokenString string

			// Try cookie first
			if cookie, err := r.Cookie("auth_token"); err == nil {
				tokenString = cookie.Value
			}

			// Fall back to Authorization header
			if tokenString == "" {
				authHeader := r.Header.Get("Authorization")
				if strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
					tokenString = authHeader[7:]
				}
			}

			if tokenString == "" {
				response.Unauthorized(w, "authentication required")
				return
			}

			claims, err := authService.ValidateToken(tokenString)
			if err != nil {
				response.Unauthorized(w, "invalid or expired token")
				return
			}

			// Verify admin still exists
			_, err = authService.GetAdminByID(r.Context(), claims.UserID)
			if err != nil {
				response.Unauthorized(w, "admin not found")
				return
			}

			ctx := auth.ContextWithClaims(r.Context(), claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
