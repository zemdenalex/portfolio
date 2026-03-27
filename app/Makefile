.PHONY: help install dev build start lint clean \
       db-setup db-migrate db-seed db-studio db-reset db-push \
       env-setup env-check hash-password \
       deploy-vercel deploy-docker docker-build docker-up docker-down \
       healthcheck check-db check-app \
       prisma-generate type-check

# ─── Help ────────────────────────────────────────────

help: ## Show this help
	@echo ""
	@echo "  Portfolio Platform — Make Commands"
	@echo "  ──────────────────────────────────"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ─── Local Development ───────────────────────────────

install: ## Install dependencies
	npm install

dev: ## Start dev server
	npm run dev

build: ## Production build
	npm run build

start: ## Start production server (run build first)
	npm run start

lint: ## Run ESLint
	npm run lint

type-check: ## Run TypeScript type checking only
	npx tsc --noEmit

clean: ## Remove build artifacts and node_modules
	rm -rf .next node_modules

# ─── Database ────────────────────────────────────────

db-setup: ## First-time DB setup: generate client + migrate + seed
	npx prisma generate
	npx prisma migrate dev --name init
	npx prisma db seed

db-migrate: ## Create a new migration (usage: make db-migrate NAME=add-field)
	npx prisma migrate dev --name $(NAME)

db-seed: ## Run seed script
	npx prisma db seed

db-studio: ## Open Prisma Studio (visual DB browser)
	npx prisma studio

db-reset: ## Reset DB: drop all data, re-migrate, re-seed
	npx prisma migrate reset

db-push: ## Push schema changes without creating a migration (dev only)
	npx prisma db push

prisma-generate: ## Regenerate Prisma client after schema changes
	npx prisma generate

# ─── Environment ─────────────────────────────────────

env-setup: ## Create .env from .env.example
	@if [ -f .env ]; then \
		echo "⚠  .env already exists. Remove it first or edit manually."; \
	else \
		cp .env.example .env; \
		echo "✓  Created .env from .env.example"; \
		echo "   Edit .env with your real values:"; \
		echo "   - DATABASE_URL (PostgreSQL connection string)"; \
		echo "   - NEXTAUTH_SECRET (run: make gen-secret)"; \
		echo "   - ADMIN_PASSWORD_HASH (run: make hash-password)"; \
	fi

env-check: ## Verify required env vars are set
	@echo "Checking environment variables..."
	@test -f .env || (echo "✗ .env file missing. Run: make env-setup" && exit 1)
	@grep -q "DATABASE_URL" .env && echo "  ✓ DATABASE_URL" || echo "  ✗ DATABASE_URL missing"
	@grep -q "NEXTAUTH_SECRET" .env && echo "  ✓ NEXTAUTH_SECRET" || echo "  ✗ NEXTAUTH_SECRET missing"
	@grep -q "NEXTAUTH_URL" .env && echo "  ✓ NEXTAUTH_URL" || echo "  ✗ NEXTAUTH_URL missing"

gen-secret: ## Generate a random NEXTAUTH_SECRET
	@node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

hash-password: ## Generate bcrypt hash for admin password (usage: make hash-password PASS=yourpassword)
	@node -e "require('bcryptjs').hash('$(PASS)', 10).then(h => console.log(h))"

# ─── Health Checks ───────────────────────────────────

healthcheck: check-db check-app ## Run all health checks

check-db: ## Check database connection
	@echo "Checking database connection..."
	@npx tsx -e " \
		const { PrismaClient } = require('@prisma/client'); \
		const { PrismaPg } = require('@prisma/adapter-pg'); \
		const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL }); \
		const prisma = new PrismaClient({ adapter }); \
		prisma.\$$connect() \
			.then(() => { console.log('  ✓ Database connected'); return prisma.admin.count(); }) \
			.then(c => { console.log('  ✓ Admin users:', c); return prisma.\$$disconnect(); }) \
			.catch(e => { console.error('  ✗ Database error:', e.message); process.exit(1); }); \
	" 2>/dev/null || echo "  ✗ Failed to connect. Check DATABASE_URL in .env"

check-app: ## Check if app builds cleanly
	@echo "Checking build..."
	@npm run build > /dev/null 2>&1 && echo "  ✓ Build passes" || echo "  ✗ Build failed. Run: npm run build"

# ─── Deploy: Vercel ──────────────────────────────────

deploy-vercel: ## Deploy to Vercel (requires vercel CLI)
	@command -v vercel >/dev/null 2>&1 || (echo "Install Vercel CLI: npm i -g vercel" && exit 1)
	vercel --prod

deploy-preview: ## Deploy preview to Vercel
	@command -v vercel >/dev/null 2>&1 || (echo "Install Vercel CLI: npm i -g vercel" && exit 1)
	vercel

# ─── Deploy: Docker (for VPS) ────────────────────────

docker-build: ## Build Docker image
	docker build -t portfolio-app .

docker-up: ## Start with docker compose (app + postgres)
	docker compose up -d

docker-down: ## Stop docker compose
	docker compose down

docker-logs: ## Tail docker compose logs
	docker compose logs -f app

# ─── Shortcuts ───────────────────────────────────────

fresh: install prisma-generate db-setup dev ## Full fresh start: install → setup DB → dev

rebuild: clean install prisma-generate build ## Clean rebuild from scratch

status: ## Show project status
	@echo ""
	@echo "  Portfolio Platform Status"
	@echo "  ─────────────────────────"
	@echo "  Node:       $$(node -v)"
	@echo "  npm:        $$(npm -v)"
	@echo "  Next.js:    $$(npx next --version 2>/dev/null || echo 'not found')"
	@echo "  TypeScript: $$(npx tsc --version 2>/dev/null || echo 'not found')"
	@echo "  Prisma:     $$(npx prisma --version 2>/dev/null | head -1 || echo 'not found')"
	@test -f .env && echo "  .env:       ✓ exists" || echo "  .env:       ✗ missing"
	@test -d .next && echo "  Build:      ✓ .next exists" || echo "  Build:      ✗ not built"
	@test -d node_modules && echo "  Deps:       ✓ installed" || echo "  Deps:       ✗ not installed"
	@echo ""
