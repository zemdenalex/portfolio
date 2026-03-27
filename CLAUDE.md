# CLAUDE.md — P002 Portfolio + Intake Platform

> Personal portfolio site with smart intake quiz. Architect/blueprint theme.
> Clients land → browse portfolio → take style quiz → Denis gets a structured lead.

## Project

**Owner:** Denis Zemtsov | **Type:** Portfolio + CMS + Lead generation
**Status:** Dev (Phase 1 MVP)

## Current Phase

**Phase:** Dev — Phase 1 MVP core built (Go backend + Next.js frontend)
**Next action:** Deploy (Vercel for frontend, VPS for Go API + PostgreSQL)
**Blocked by:** Nothing — ready to deploy

## Design Spec

Full spec: `E:\Projects\docs\superpowers\specs\2026-03-22-portfolio-platform-design.md`

## Scope (Phase 1 MVP)

- [x] Homepage: hero (Blueprint Split, architect theme) + portfolio grid + quiz entry CTA
- [x] Style quiz: full tree branching wizard (DB-driven, admin-editable)
- [x] Quiz result: recommended style (live embeds) + service package + "Denis will contact you"
- [x] Portfolio grid: filterable by type, from DB
- [x] Case study pages: modular block-based content (TEXT, GALLERY, EMBED, CODE, METRICS, TESTIMONIAL)
- [x] Admin panel: dashboard, leads management, portfolio CRUD + block editor, quiz tree editor, styles, packages, content CMS, settings
- [x] Light/dark mode (prefers-color-scheme, localStorage toggle)
- [x] Comfort mode (accessibility: larger fonts, reduced motion)
- [x] Bilingual EN/RU (next-intl with /[locale]/ routing)
- [x] SEO: meta tags, sitemap, robots.txt
- [x] Go API backend (Chi + pgx + JWT auth)
- [ ] Deploy

### NOT in Phase 1
- Tech demos (Phase 2)
- AI analysis of submissions (Phase 3)
- Tracker App integration (Phase 3)
- Client portal (Phase 4)

## Architecture

```
Next.js Frontend (port 3000) ←→ Go API (port 8080) ←→ PostgreSQL
```

- **Frontend:** Next.js 16 (SSR for SEO) — view layer only, 6 production deps
- **Backend:** Go API with Chi router — all business logic, auth, DB queries, 4 Go deps
- **Database:** PostgreSQL 16 with raw SQL (no ORM)

## Stack

### Frontend (app/)
| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI | Custom HTML + Tailwind (no component libraries) |
| Icons | Lucide React |
| Animations | CSS @keyframes + transitions (no JS animation library) |
| i18n | next-intl (EN + RU) |
| API client | Native fetch (no axios) |

### Backend (api/)
| Layer | Tech |
|-------|------|
| Language | Go 1.25 |
| Router | Chi v5 |
| Database | PostgreSQL via pgx v5 (raw SQL) |
| Auth | JWT (golang-jwt/jwt v5) + bcrypt |
| Structure | cmd/api + internal/{entity}/ (ITAM pattern) |

## Commands

```bash
# Frontend
cd app && npm run dev           # Dev server (Next.js)
cd app && npm run build         # Production build

# Backend
cd api && go run ./cmd/api      # Run Go API (needs env vars)
cd api && go build ./cmd/api    # Build Go binary

# Database
docker compose up -d db         # Start PostgreSQL (port 5433)

# Full stack (dev)
# Terminal 1: docker compose up -d db
# Terminal 2: cd api && source .env && go run ./cmd/api
# Terminal 3: cd app && npm run dev
```

## Files

| What | Where |
|------|-------|
| **Frontend** | |
| Next.js app | `app/` |
| Public pages | `app/src/app/[locale]/` |
| Admin pages | `app/src/app/admin/` |
| Components | `app/src/components/` |
| UI primitives | `app/src/components/ui/` |
| API client | `app/src/lib/api.ts` |
| Theme system | `app/src/lib/theme.ts` |
| i18n config | `app/src/i18n/` |
| Translations | `app/messages/en.json`, `app/messages/ru.json` |
| Proxy (middleware) | `app/src/proxy.ts` |
| **Backend** | |
| Go API entry | `api/cmd/api/main.go` |
| Entity packages | `api/internal/{entity}/` |
| Auth (JWT + bcrypt) | `api/internal/auth/` |
| SQL migrations | `api/migrations/` |
| Config | `api/internal/config/` |
| **Infrastructure** | |
| Docker Compose | `docker-compose.yml` |
| Go Dockerfile | `api/Dockerfile` |

## API Routes

```
/health                          GET     Health check
/api/auth/login                  POST    Admin login → JWT cookie
/api/auth/logout                 POST    Clear JWT cookie
/api/auth/me                     GET     Current admin (protected)
/api/public/portfolio            GET     Published projects
/api/public/portfolio/:slug      GET     Project + blocks
/api/public/quiz/root            GET     Root quiz node
/api/public/quiz/node/:id        GET     Quiz node + options
/api/public/leads                POST    Submit quiz lead
/api/public/styles               GET     All styles
/api/public/packages             GET     All packages
/api/public/content              GET     Site content
/api/admin/*                     *       Protected CRUD (JWT required)
```

## Design

- **Theme:** Architect / Blueprint
- **Light mode:** White bg, dark text, accent on CTAs
- **Dark mode:** Deep navy (#0c1929), ice text, bright accent
- **Accent:** Cyan (#0891b2)
- **Comfort mode:** 22px base font, 1.8 line-height, reduced motion, 48px min click targets
- **Theme switching:** `data-theme` + `data-comfort` on `<html>`, localStorage persisted

## Rules

### DO NOT
- ❌ Commit `.env` or credentials
- ❌ Use `any` in TypeScript
- ❌ Add npm dependencies without justification (current: 6 production deps)
- ❌ Use ORMs — raw SQL only (pgx)
- ❌ Use UI component libraries — custom HTML + Tailwind only
- ❌ Use JS animation libraries — CSS transitions + @keyframes only

### ALWAYS
- ✅ `npm run build` before marking frontend task done
- ✅ `go build ./cmd/api` before marking backend task done
- ✅ Test all 4 theme combos (light/dark × normal/comfort)
- ✅ Test responsive: 375 / 768 / 1024 / 1440px
- ✅ Server Components by default, Client Components only when needed
- ✅ Follow ITAM entity pattern for new Go endpoints (handler → service → models)
