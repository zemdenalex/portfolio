package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Upload   UploadConfig
	Admin    AdminSeed
}

type ServerConfig struct {
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	FrontendURL  string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

type JWTConfig struct {
	Secret string
	Expiry time.Duration
}

type UploadConfig struct {
	Path    string
	MaxSize int64
}

type AdminSeed struct {
	Email    string
	Password string
	Name     string
}

func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		d.User, d.Password, d.Host, d.Port, d.Name, d.SSLMode,
	)
}

func Load() (*Config, error) {
	cfg := &Config{
		Server: ServerConfig{
			Port:         getEnv("PORT", "8080"),
			ReadTimeout:  parseDuration(getEnv("READ_TIMEOUT", "10s")),
			WriteTimeout: parseDuration(getEnv("WRITE_TIMEOUT", "30s")),
			FrontendURL:  getEnv("FRONTEND_URL", "http://localhost:3000"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "portfolio"),
			Password: getEnv("DB_PASSWORD", "portfolio_secret"),
			Name:     getEnv("DB_NAME", "portfolio"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", ""),
			Expiry: parseDuration(getEnv("JWT_EXPIRY", "720h")),
		},
		Upload: UploadConfig{
			Path:    getEnv("UPLOAD_PATH", "./uploads"),
			MaxSize: parseInt64(getEnv("UPLOAD_MAX_SIZE", "10485760")), // 10MB
		},
		Admin: AdminSeed{
			Email:    getEnv("ADMIN_EMAIL", "denis@zemtsov.dev"),
			Password: getEnv("ADMIN_PASSWORD", "admin123"),
			Name:     getEnv("ADMIN_NAME", "Denis Zemtsov"),
		},
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c *Config) validate() error {
	if c.JWT.Secret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	if c.Database.Password == "" {
		return fmt.Errorf("DB_PASSWORD is required")
	}

	if err := os.MkdirAll(c.Upload.Path, 0o755); err != nil {
		return fmt.Errorf("create upload dir: %w", err)
	}

	return nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 10 * time.Second
	}
	return d
}

func parseInt64(s string) int64 {
	n, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return 10485760
	}
	return n
}
