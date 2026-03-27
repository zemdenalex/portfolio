package response

import (
	"encoding/json"
	"log"
	"net/http"
)

type Response struct {
	Data  any    `json:"data"`
	Error *Error `json:"error,omitempty"`
}

type Error struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

const (
	ErrCodeBadRequest   = "BAD_REQUEST"
	ErrCodeUnauthorized = "UNAUTHORIZED"
	ErrCodeForbidden    = "FORBIDDEN"
	ErrCodeNotFound     = "NOT_FOUND"
	ErrCodeConflict     = "CONFLICT"
	ErrCodeInternal     = "INTERNAL_ERROR"
	ErrCodeValidation   = "VALIDATION_ERROR"
)

func JSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(Response{Data: data}); err != nil {
		log.Printf("response encode error: %v", err)
	}
}

func Err(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(Response{Error: &Error{Code: code, Message: message}}); err != nil {
		log.Printf("response encode error: %v", err)
	}
}

func BadRequest(w http.ResponseWriter, msg string) {
	Err(w, http.StatusBadRequest, ErrCodeBadRequest, msg)
}

func Unauthorized(w http.ResponseWriter, msg string) {
	Err(w, http.StatusUnauthorized, ErrCodeUnauthorized, msg)
}

func Forbidden(w http.ResponseWriter, msg string) {
	Err(w, http.StatusForbidden, ErrCodeForbidden, msg)
}

func NotFound(w http.ResponseWriter, msg string) {
	Err(w, http.StatusNotFound, ErrCodeNotFound, msg)
}

func Conflict(w http.ResponseWriter, msg string) {
	Err(w, http.StatusConflict, ErrCodeConflict, msg)
}

func InternalError(w http.ResponseWriter, msg string) {
	Err(w, http.StatusInternalServerError, ErrCodeInternal, msg)
}

func ValidationError(w http.ResponseWriter, msg string) {
	Err(w, http.StatusUnprocessableEntity, ErrCodeValidation, msg)
}
