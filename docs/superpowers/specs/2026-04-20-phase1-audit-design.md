# P002 Portfolio — Phase 1 Audit Spec

> Verify every Phase 1 feature works end-to-end on production. Log findings. Fix in priority order.

**Date:** 2026-04-20
**Status:** Approved (brainstorming complete)
**Target:** archifex.space (live production)

---

## 1. Context

Phase 1 shipped across three specs (`2026-03-27-phase1-completion`, `2026-04-11-deployment`, `2026-04-13-live-preview`) plus a rebrand and the `/logos` rating tool. The code is live, but the full scope has never been verified as a single coherent system. Before Phase 2 work begins, every Phase 1 feature needs to be confirmed working, with real content and acceptable UX polish.

This spec defines the acceptance checklist, the process for walking it, and how findings are triaged and fixed.

### Success Criteria

- Every item on the checklist has a pass/fail result recorded in the findings log
- All **bug**-severity findings are fixed
- All **content**-severity findings are either fixed or have an explicit owner + date
- All **polish**-severity findings are either fixed or logged as deferred with a reason
- Phase 2 work starts from a known-clean baseline

### Out of Scope

- New features (tech demos, AI analysis, Tracker integration, client portal) — those are Phase 2-4
- Visual redesign — the audit accepts the current design system as-is
- Test automation (Playwright/Cypress) — manual walk-through only; automation is a separate future decision

---

## 2. Approach — Three Passes

### Pass 1: Build the acceptance checklist

The checklist in Section 4 is the source of truth. Every item is a concrete, verifiable claim about a Phase 1 feature. If a claim cannot be verified in one sitting, it is split into smaller claims until each one can.

### Pass 2: Walk the checklist, log findings

**Claude handles (verifiable from code, API, or automated tooling):**

- Every API endpoint returns the expected shape and status code (curl against live)
- i18n: every translation key used in code exists in both `en.json` and `ru.json`
- TypeScript: `npm run build` passes with no errors
- Go: `go build ./cmd/api` passes with no errors
- Responsive breakpoints: screenshots at 375 / 768 / 1024 / 1440 for key pages
- Lighthouse scores: quick run on home, portfolio, quiz, case study, admin login
- SEO: meta tags present, sitemap.xml + robots.txt respond, OG image loads
- SSL: valid cert, HTTPS redirect works, HSTS header set
- Docker: `docker compose ps` shows all services healthy on VPS
- Routes: every registered route in `api/cmd/api/main.go` returns something (even if 401/404 is the expected response)

**Denis handles (subjective, manual, or requires human judgment):**

- Is the copy on every page his real voice and real content, or is any of it placeholder/seeded-demo leftover?
- Does the quiz flow feel right at each branch? Do the recommended styles actually match what he'd recommend?
- Admin UX — block editor, quiz tree editor, form validation feedback — is it usable or friction-heavy?
- Mobile feel on a real phone (not just DevTools)
- Any features that exist in code but he doesn't use or want removed

**Format of findings log:** markdown table in `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md` (created during Pass 2, committed separately from this spec).

| # | Area | Claim | Result | Severity | Notes |
|---|------|-------|--------|----------|-------|
| 1 | Quiz | Root question loads in EN | ✅ | — | — |
| 2 | Quiz | Result page shows live style preview | ❌ | bug | iframe blank on stripe — embeddable flag wrong |
| … | … | … | … | … | … |

### Pass 3: Fix in priority order

**Order:** bugs → content → polish.

Each severity bucket becomes its own set of commits. Bugs are fixed first because they can block other verifications. Content next because it's the second-biggest thing a visitor notices. Polish last because it's the widest and most subjective bucket.

After each bucket is fixed, re-walk the affected checklist rows to confirm resolution.

---

## 3. Severity Triage

Every finding gets exactly one tag:

| Severity | Meaning | Example |
|----------|---------|---------|
| **bug** | Feature is broken, crashed, wrong data, or returns error | Quiz node 404s, case study 500s, admin create fails silently |
| **content** | Feature works but the data shown is placeholder, wrong, or missing | Seed portfolio still says "Lorem ipsum", RU locale has EN strings |
| **polish** | Feature works with real data but UX could be better | No loading skeleton, empty-state looks bleak, mobile button tap target too small |
| **deferred** | Acknowledged gap that we consciously skip in this audit | Rate limiting on `/api/public/leads` — tracked for Phase 2 |

Rule: if a finding is **possibly** a bug, call it a bug and verify in Pass 3. Over-classification is cheaper than missing real bugs.

---

## 4. Acceptance Checklist

Organized by area. Each row is one verifiable claim. ~120 items total.

### 4.1 Public — Homepage (`/en`, `/ru`)

- [ ] Page loads with HTTP 200 on both locales
- [ ] Hero section renders with real copy (no placeholder)
- [ ] Hero CTAs link to correct destinations (portfolio, quiz)
- [ ] Portfolio grid loads projects from `/api/public/portfolio`
- [ ] Portfolio grid shows ≥ 3 published projects with thumbnails
- [ ] Portfolio grid filters work (by type)
- [ ] Quiz entry CTA links to `/[locale]/quiz`
- [ ] Theme toggle (light/dark) visible and functional
- [ ] Comfort-mode toggle visible and functional
- [ ] Language toggle (EN↔RU) preserves current route
- [ ] No console errors
- [ ] LCP < 2.5s, CLS < 0.1 (Lighthouse)

### 4.2 Public — Portfolio grid (`/[locale]/portfolio`)

- [ ] Page loads HTTP 200 both locales
- [ ] All published projects render
- [ ] Filter by type (LANDING / CORPORATE / WEBAPP / STORE) returns correct subsets
- [ ] Empty-state renders cleanly when a filter has zero results
- [ ] Each project card links to `/[locale]/portfolio/[slug]`
- [ ] Thumbnails load (no broken images)

### 4.3 Public — Case study (`/[locale]/portfolio/[slug]`)

For each published project:

- [ ] Page loads HTTP 200
- [ ] Hero / title renders in correct locale
- [ ] Every block type that exists in DB renders correctly: TEXT, GALLERY, EMBED, CODE, METRICS, TESTIMONIAL
- [ ] Gallery images load and respect `alt` text
- [ ] EMBED iframes render (or show graceful fallback)
- [ ] CODE blocks have syntax highlighting or at least monospace formatting
- [ ] METRICS render numbers + labels
- [ ] TESTIMONIAL renders quote + author
- [ ] No raw JSON or schema leakage in the rendered page

### 4.4 Public — Quiz (`/[locale]/quiz`)

- [ ] Root quiz page loads HTTP 200
- [ ] Root question + options render from `/api/public/quiz/root`
- [ ] Clicking an option navigates to the next question
- [ ] Depth traversal reaches every terminal result node (verify every leaf)
- [ ] Result page shows recommended style + package + CTA
- [ ] Result page shows BrowserPreview cards for style references (from live-preview spec)
- [ ] Preview cards render: iframe for embeddable, screenshot for non-embeddable, placeholder for neither
- [ ] All 10 demo pages reachable at `/demos/<name>.html` with working interactivity
- [ ] Lead submission form validates required fields
- [ ] Lead submits successfully to `/api/public/leads` and returns 200
- [ ] Submitted lead appears in admin leads list within seconds

### 4.5 Public — Logo rating tool (`/logos`)

- [ ] Page loads HTTP 200 (not i18n-routed)
- [ ] First visit shows intro banner
- [ ] "Don't show again" dismisses banner and persists via localStorage
- [ ] New session auto-created via `/api/public/logos/sessions` on first visit
- [ ] Session ID persists in localStorage (returning user sees same state)
- [ ] All 30 logos render inline SVG, responsive
- [ ] Score buttons 0-10 clickable and persist via `/rate` endpoint
- [ ] Keyboard shortcuts work: 0-9, Q=10, F=favorite, ←/→ navigate
- [ ] Favorite toggle persists
- [ ] Compare mode picks valid pairs, records via `/compare`, and shows result
- [ ] Results tab: Global / By-voter / Just-mine sub-tabs all render data
- [ ] Share button triggers navigator.share on mobile, clipboard fallback on desktop
- [ ] Mobile: 11 rating buttons fit in one row without wrapping on 375px

### 4.6 Public — i18n

- [ ] `/en` and `/ru` both resolve for every public route listed above
- [ ] No visible EN strings on RU pages (or vice versa)
- [ ] Every translation key referenced in code exists in both `en.json` and `ru.json` (automated scan)
- [ ] `next-intl` locale negotiation works (browser preference detected on first visit)

### 4.7 Public — Theme system

- [ ] Light mode: white bg, dark text
- [ ] Dark mode: deep navy bg, ice text
- [ ] Comfort mode: 22px base, 1.8 line-height, reduced motion, 48px click targets
- [ ] Toggle persists across navigation (localStorage)
- [ ] `prefers-color-scheme: dark` respected on first visit
- [ ] Every combination (light/dark × normal/comfort) renders without layout breakage on home, portfolio, quiz, case study

### 4.8 Public — SEO

- [ ] `<title>` and `<meta description>` present on every public route
- [ ] `/sitemap.xml` returns valid XML listing public routes in both locales
- [ ] `/robots.txt` returns and permits crawl of public routes, disallows `/admin`, `/logos`
- [ ] Open Graph tags present: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- [ ] Twitter Card tags present
- [ ] Favicon loads (light + dark variants if applicable)
- [ ] OG image resolves and is ~1200×630

### 4.9 Admin — Auth

- [ ] `/admin/login` page loads HTTP 200
- [ ] Login with seeded credentials succeeds → JWT cookie set (httpOnly, secure)
- [ ] `/admin/dashboard` unreachable without cookie (302 to login)
- [ ] `/api/admin/*` returns 401 without JWT
- [ ] Logout clears cookie
- [ ] Password change form works and invalidates old token

### 4.10 Admin — Dashboard

- [ ] Dashboard renders stats (leads count, projects count, etc.)
- [ ] Stats numbers match DB truth
- [ ] Recent leads list renders

### 4.11 Admin — Leads

- [ ] List loads with every submitted lead
- [ ] Status filter works (new / contacted / qualified / lost)
- [ ] Status update persists via `/api/admin/leads/:id/status`
- [ ] Delete works and removes from list

### 4.12 Admin — Portfolio CRUD

- [ ] List shows all projects (published + draft)
- [ ] Create project: form submits, record appears in list
- [ ] Edit project: changes persist
- [ ] Delete project: removes from list
- [ ] Reorder via `/api/admin/portfolio/reorder` persists
- [ ] Block editor: create each block type (TEXT, GALLERY, EMBED, CODE, METRICS, TESTIMONIAL)
- [ ] Block editor: edit, delete, reorder
- [ ] Image upload works → uploaded file serves from `/uploads/*`

### 4.13 Admin — Quiz tree editor

- [ ] Tree renders entire quiz structure
- [ ] Create node, create option, set result all work
- [ ] Delete node cascades correctly (no orphaned options)
- [ ] Reorder options persists

### 4.14 Admin — Styles + references

- [ ] List loads
- [ ] Create style + references works
- [ ] Screenshot capture button works (POST `/api/admin/screenshot` → chromedp success)
- [ ] `embeddable` toggle persists
- [ ] Manual screenshot upload works

### 4.15 Admin — Packages

- [ ] List, create, update, delete, reorder, toggle-active all work

### 4.16 Admin — Content CMS

- [ ] List loads site-content key-value pairs
- [ ] Create, update persist

### 4.17 Admin — Settings

- [ ] Profile update persists
- [ ] Password change succeeds

### 4.18 Infra — Docker / VPS

- [ ] `docker compose ps` on VPS shows all services healthy
- [ ] nginx proxies `/` → app:3000, `/api/` → api:8080, `/uploads/` → api:8080
- [ ] SSL certificate valid (check expiry > 30 days)
- [ ] HTTP → HTTPS 301 redirect works
- [ ] HSTS header set
- [ ] `/health` endpoint responds `{"status":"ok"}`
- [ ] Uploads volume persists across `docker compose down/up`
- [ ] Postgres data persists across `docker compose down/up`
- [ ] Certbot renewal cron works (simulate or check last-renewal timestamp)

### 4.19 Cross-cutting — Responsive

- [ ] Home: 375 / 768 / 1024 / 1440 renders without overflow or layout breaks
- [ ] Portfolio grid: responsive column counts
- [ ] Case study: blocks stack cleanly on mobile
- [ ] Quiz: wizard buttons are tap-friendly (44×44 min)
- [ ] Admin: usable on 768+ (mobile-first is not a requirement for admin)

### 4.20 Cross-cutting — Error / empty / loading states

- [ ] Public pages have loading state during SSR hydration (or SSR skips it cleanly)
- [ ] API-down scenario: public pages fall back gracefully (error boundary or retry message, not white screen)
- [ ] Empty portfolio / empty leads / empty quiz tree all render informative empty states in admin
- [ ] 404 page exists for unknown routes
- [ ] 500 page exists (or Next.js default is acceptable)

---

## 5. Findings Log Format

A separate file `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md` is created during Pass 2. One row per checklist item, plus any issues discovered outside the checklist.

**Schema:**

```markdown
| # | Section | Claim | Result | Severity | Notes | Fix Commit |
|---|---------|-------|--------|----------|-------|-----------|
```

- `#` — numeric ID, stable across revisions
- `Section` — the 4.x subsection
- `Claim` — copied verbatim from checklist
- `Result` — `pass` / `fail` / `skip` (skipped with reason)
- `Severity` — `bug` / `content` / `polish` / `deferred` / `—` (for passes)
- `Notes` — one-line description of what was observed
- `Fix Commit` — git SHA after Pass 3 resolves it

---

## 6. Build Order

1. Commit this spec
2. Create findings log file (empty table, committed)
3. Run Pass 2 automated verifications (Claude) — update findings log
4. Run Pass 2 manual verifications (Denis, guided) — update findings log
5. Triage: sort findings by severity, confirm classifications
6. Pass 3.a — fix all **bugs**, commit in small groups, re-verify affected rows
7. Pass 3.b — fix all **content** items, commit, re-verify
8. Pass 3.c — fix all **polish** items, commit, re-verify
9. Update CLAUDE.md Phase 1 section to reflect audited state
10. Declare Phase 1 clean, unblock Phase 2

---

## 7. Files to Create / Modify

### New files

| File | Purpose |
|------|---------|
| `docs/superpowers/specs/2026-04-20-phase1-audit-design.md` | This spec |
| `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md` | Findings log (created during Pass 2) |
| `docs/superpowers/plans/2026-04-20-phase1-audit.md` | Implementation plan (next step, after spec approval) |

### Modified files (count unknown until Pass 2)

- Any file touched by a bug fix
- Any content file (seed data, i18n messages, markdown) touched by content fixes
- `CLAUDE.md` at the end of Pass 3

---

## 8. Verification

- Every row in Section 4 has a result in the findings log
- All rows marked `bug` have `Fix Commit` filled in
- All rows marked `content` have either `Fix Commit` filled in or an explicit note why deferred
- All rows marked `polish` have either `Fix Commit` filled in or `deferred` with a reason
- CLAUDE.md reflects the audited state
- A final smoke test: Claude walks the top ten most-visible user paths end-to-end on production and confirms all pass
