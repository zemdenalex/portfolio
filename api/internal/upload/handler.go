package upload

import (
	"net/http"

	"portfolio-api/internal/response"
)

type Handler struct {
	uploadPath string
	maxSize    int64
}

func NewHandler(uploadPath string, maxSize int64) *Handler {
	return &Handler{
		uploadPath: uploadPath,
		maxSize:    maxSize,
	}
}

func (h *Handler) Upload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(h.maxSize); err != nil {
		response.BadRequest(w, "file too large or invalid form data")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		response.BadRequest(w, "file is required")
		return
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	if !IsAllowedType(contentType) {
		response.BadRequest(w, "only image files are allowed (jpeg, png, gif, webp, svg)")
		return
	}

	filename := GenerateFilename(header.Filename)
	url, err := SaveFile(file, h.uploadPath, filename)
	if err != nil {
		response.InternalError(w, "failed to save file")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{
		"url":      url,
		"filename": filename,
	})
}
