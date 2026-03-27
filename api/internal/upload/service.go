package upload

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var allowedTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/gif":  true,
	"image/webp": true,
	"image/svg+xml": true,
}

func IsAllowedType(contentType string) bool {
	return allowedTypes[contentType]
}

func GenerateFilename(original string) string {
	ext := filepath.Ext(original)
	name := strings.TrimSuffix(filepath.Base(original), ext)
	// Sanitize name: keep only alphanumeric, hyphens, underscores
	sanitized := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			return r
		}
		return -1
	}, name)
	if sanitized == "" {
		sanitized = "file"
	}
	timestamp := time.Now().UnixMilli()
	return fmt.Sprintf("%s-%d%s", sanitized, timestamp, ext)
}

func SaveFile(file multipart.File, uploadPath string, filename string) (string, error) {
	if err := os.MkdirAll(uploadPath, 0o755); err != nil {
		return "", fmt.Errorf("create upload dir: %w", err)
	}

	destPath := filepath.Join(uploadPath, filename)
	dst, err := os.Create(destPath)
	if err != nil {
		return "", fmt.Errorf("create file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("copy file: %w", err)
	}

	return "/uploads/" + filename, nil
}
