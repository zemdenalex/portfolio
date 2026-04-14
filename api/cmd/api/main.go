package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"portfolio-api/internal/auth"
	"portfolio-api/internal/config"
	"portfolio-api/internal/content"
	"portfolio-api/internal/database"
	"portfolio-api/internal/leads"
	"portfolio-api/internal/logos"
	"portfolio-api/internal/middleware"
	"portfolio-api/internal/packages"
	"portfolio-api/internal/portfolio"
	"portfolio-api/internal/quiz"
	"portfolio-api/internal/response"
	"portfolio-api/internal/screenshot"
	"portfolio-api/internal/styles"
	"portfolio-api/internal/upload"
)

func main() {
	// 1. Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	// 2. Connect to database
	db, err := database.New(cfg.Database.DSN())
	if err != nil {
		log.Fatalf("connect to database: %v", err)
	}
	defer db.Close()

	// 3. Run migrations
	if err := runMigrations(db); err != nil {
		log.Fatalf("run migrations: %v", err)
	}

	// 4. Initialize services
	authService := auth.NewService(db.Pool, cfg.JWT.Secret, cfg.JWT.Expiry)
	portfolioService := portfolio.NewService(db.Pool)
	quizService := quiz.NewService(db.Pool)
	leadsService := leads.NewService(db.Pool)
	stylesService := styles.NewService(db.Pool)
	packagesService := packages.NewService(db.Pool)
	contentService := content.NewService(db.Pool)
	logosService := logos.NewService(db.Pool)

	// 5. Initialize handlers
	authHandler := auth.NewHandler(authService)
	portfolioHandler := portfolio.NewHandler(portfolioService)
	quizHandler := quiz.NewHandler(quizService)
	leadsHandler := leads.NewHandler(leadsService)
	stylesHandler := styles.NewHandler(stylesService)
	packagesHandler := packages.NewHandler(packagesService)
	contentHandler := content.NewHandler(contentService)
	logosHandler := logos.NewHandler(logosService)
	uploadHandler := upload.NewHandler(cfg.Upload.Path, cfg.Upload.MaxSize)
	screenshotService := screenshot.NewService(cfg.Upload.Path)
	screenshotHandler := screenshot.NewHandler(screenshotService, stylesService)

	// 6. Seed admin user
	if err := authService.SeedAdmin(context.Background(), cfg.Admin.Email, cfg.Admin.Password, cfg.Admin.Name); err != nil {
		log.Fatalf("seed admin: %v", err)
	}

	// 7. Set up router
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.Timeout(30 * time.Second))
	r.Use(middleware.CORS(cfg.Server.FrontendURL))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		if err := db.Health(r.Context()); err != nil {
			response.InternalError(w, "database unhealthy")
			return
		}
		response.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// Static file server for uploads
	uploadsDir := cfg.Upload.Path
	if !filepath.IsAbs(uploadsDir) {
		uploadsDir, _ = filepath.Abs(uploadsDir)
	}
	fileServer := http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadsDir)))
	r.Handle("/uploads/*", fileServer)

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Auth routes (public)
		r.Route("/auth", func(r chi.Router) {
			r.Post("/login", authHandler.Login)
			r.Post("/logout", authHandler.Logout)
			r.Group(func(r chi.Router) {
				r.Use(middleware.Auth(authService))
				r.Get("/me", authHandler.Me)
				r.Put("/profile", authHandler.UpdateProfile)
				r.Put("/password", authHandler.ChangePassword)
			})
		})

		// Public routes (no auth)
		r.Route("/public", func(r chi.Router) {
			// Portfolio
			r.Get("/portfolio", portfolioHandler.ListPublic)
			r.Get("/portfolio/{slug}", portfolioHandler.GetPublic)

			// Quiz
			r.Get("/quiz/root", quizHandler.GetRoot)
			r.Get("/quiz/node/{id}", quizHandler.GetNode)

			// Leads (submit only)
			r.Post("/leads", leadsHandler.Submit)

			// Styles
			r.Get("/styles", stylesHandler.List)
			r.Get("/styles/{id}", stylesHandler.GetByID)

			// Packages
			r.Get("/packages", packagesHandler.List)
			r.Get("/packages/{id}", packagesHandler.GetByID)

			// Content
			r.Get("/content", contentHandler.List)

			// Logo ratings (public, session-based)
			r.Post("/logos/sessions", logosHandler.CreateSession)
			r.Get("/logos/sessions/{id}", logosHandler.GetSession)
			r.Put("/logos/sessions/{id}", logosHandler.UpdateSession)
			r.Post("/logos/sessions/{id}/rate", logosHandler.Rate)
			r.Post("/logos/sessions/{id}/favorite", logosHandler.SetFavorite)
			r.Post("/logos/sessions/{id}/compare", logosHandler.Compare)
			r.Get("/logos/stats", logosHandler.Stats)
		})

		// Admin routes (auth required)
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(authService))
			r.Route("/admin", func(r chi.Router) {
				// Styles
				r.Get("/styles", stylesHandler.List)
				r.Get("/styles/{id}", stylesHandler.GetByID)
				r.Post("/styles", stylesHandler.Create)
				r.Put("/styles/{id}", stylesHandler.Update)
				r.Delete("/styles/{id}", stylesHandler.Delete)
				r.Post("/styles/refs", stylesHandler.CreateRef)
				r.Delete("/styles/refs/{id}", stylesHandler.DeleteRef)
				r.Put("/styles/{id}/reorder-refs", stylesHandler.ReorderRefs)

				// Packages
				r.Get("/packages", packagesHandler.List)
				r.Get("/packages/{id}", packagesHandler.GetByID)
				r.Post("/packages", packagesHandler.Create)
				r.Put("/packages/{id}", packagesHandler.Update)
				r.Delete("/packages/{id}", packagesHandler.Delete)
				r.Put("/packages/reorder", packagesHandler.Reorder)
				r.Put("/packages/{id}/toggle-active", packagesHandler.ToggleActive)

				// Content
				r.Get("/content", contentHandler.List)
				r.Post("/content", contentHandler.Create)
				r.Put("/content/{key}", contentHandler.Update)

				// Upload
				r.Post("/upload", uploadHandler.Upload)

				// Screenshot
				r.Post("/screenshot", screenshotHandler.Capture)

				// Portfolio
				r.Get("/portfolio", portfolioHandler.ListAll)
				r.Post("/portfolio", portfolioHandler.Create)
				r.Put("/portfolio/{id}", portfolioHandler.Update)
				r.Delete("/portfolio/{id}", portfolioHandler.Delete)
				r.Put("/portfolio/reorder", portfolioHandler.Reorder)
				r.Post("/portfolio/{id}/blocks", portfolioHandler.CreateBlock)
				r.Put("/blocks/{id}", portfolioHandler.UpdateBlock)
				r.Delete("/blocks/{id}", portfolioHandler.DeleteBlock)
				r.Put("/portfolio/{id}/blocks/reorder", portfolioHandler.ReorderBlocks)

				// Quiz
				r.Get("/quiz/tree", quizHandler.GetTree)
				r.Post("/quiz/nodes", quizHandler.CreateNode)
				r.Put("/quiz/nodes/{id}", quizHandler.UpdateNode)
				r.Delete("/quiz/nodes/{id}", quizHandler.DeleteNode)
				r.Post("/quiz/options", quizHandler.CreateOption)
				r.Put("/quiz/options/{id}", quizHandler.UpdateOption)
				r.Delete("/quiz/options/{id}", quizHandler.DeleteOption)
				r.Put("/quiz/options/{nodeId}/reorder", quizHandler.ReorderOptions)
				r.Put("/quiz/results/{nodeId}", quizHandler.UpdateResult)

				// Leads
				r.Get("/leads", leadsHandler.List)
				r.Get("/leads/stats", leadsHandler.Stats)
				r.Put("/leads/{id}/status", leadsHandler.UpdateStatus)
				r.Delete("/leads/{id}", leadsHandler.Delete)
			})
		})
	})

	// 8. Start HTTP server with graceful shutdown
	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      r,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	// 9. Log startup message
	log.Printf("Portfolio API starting on port %s", cfg.Server.Port)
	log.Printf("Frontend URL: %s", cfg.Server.FrontendURL)
	log.Printf("Upload path: %s", cfg.Upload.Path)

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-done
	log.Println("shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("server shutdown: %v", err)
	}

	log.Println("server stopped")
}

func runMigrations(db *database.DB) error {
	// Find migrations directory relative to the binary or working directory
	migrationDirs := []string{
		"migrations",
		"../../migrations",
	}

	var migrDir string
	for _, d := range migrationDirs {
		if _, err := os.Stat(d); err == nil {
			migrDir = d
			break
		}
	}
	if migrDir == "" {
		return fmt.Errorf("migrations directory not found")
	}

	entries, err := os.ReadDir(migrDir)
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	// Run all *.up.sql files in sorted order
	for _, entry := range entries {
		name := entry.Name()
		if entry.IsDir() || len(name) < 7 || name[len(name)-7:] != ".up.sql" {
			continue
		}

		sqlBytes, readErr := os.ReadFile(migrDir + "/" + name)
		if readErr != nil {
			return fmt.Errorf("read migration %s: %w", name, readErr)
		}

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		_, execErr := db.Pool.Exec(ctx, string(sqlBytes))
		cancel()
		if execErr != nil {
			log.Printf("migration %s note (may be ok on re-run): %v", name, execErr)
		} else {
			log.Printf("migration %s applied", name)
		}
	}

	return nil
}
