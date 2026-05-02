package main

import (
	"context"
	"log"
	"os"

	"portfolio-api/internal/auth"
	"portfolio-api/internal/config"
	"portfolio-api/internal/database"
)

func main() {
	// Check raw env vars FIRST, before config.Load()'s defaults can mask them.
	// config.Load() has fallback values for ADMIN_EMAIL and ADMIN_PASSWORD, so
	// checking cfg.Admin.* after Load would never detect missing vars.
	email := os.Getenv("ADMIN_EMAIL")
	password := os.Getenv("ADMIN_PASSWORD")
	if email == "" || password == "" {
		log.Fatal("ADMIN_EMAIL and ADMIN_PASSWORD must be set")
	}

	// Load config using the same pattern as cmd/api/main.go.
	// This validates JWT_SECRET and DB_PASSWORD and resolves the DB DSN.
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	// Resolve admin name: prefer explicit env var, fall back to config default.
	name := os.Getenv("ADMIN_NAME")
	if name == "" {
		name = cfg.Admin.Name
	}

	// Connect to PostgreSQL using the same pgxpool pattern as cmd/api/main.go.
	db, err := database.New(cfg.Database.DSN())
	if err != nil {
		log.Fatalf("connect to database: %v", err)
	}
	defer db.Close()

	ctx := context.Background()

	// ResetAdmin upserts: updates password+name if email exists, inserts if not.
	svc := auth.NewService(db.Pool, cfg.JWT.Secret, cfg.JWT.Expiry)
	if err := svc.ResetAdmin(ctx, email, password, name); err != nil {
		log.Fatalf("reset admin: %v", err)
	}

	log.Printf("admin reset OK for %s", email)
}
