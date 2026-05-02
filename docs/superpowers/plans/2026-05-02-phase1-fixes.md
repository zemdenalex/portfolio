# Phase 1 Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise prod readiness from 4-5/10 to 8/10 by fixing 3 blockers + demo iframe overhaul + curated UX/polish, organised as 4 independent vertical slices.

**Architecture:** Existing stack untouched. New: one Go binary (`admin-reset`), one frontend wrapper (`<DemoFrame>`), three additive migrations (005-007), one new public API endpoint (`POST /api/public/quiz/result`). Quiz transitions from tree-walk-with-RESULT-rows to tag-based scoring.

**Tech Stack:** Go 1.25 + Chi + pgx (no ORM), Next.js 16 + Tailwind v4 (no UI library), PostgreSQL 16. Tests: `go test ./...` (no test framework added — stdlib only).

**Spec:** `docs/superpowers/specs/2026-05-02-phase1-fixes-design.md`

**Deploy order:** Slice 1 → Slice 4 → Slice 3 → Slice 2 (smallest/safest to riskiest).

---

## Slice 1 — Admin & Auth (Tasks 1-6, ~3-4h)

### Task 1: Add `ResetAdmin` service method

**Files:**
- Modify: `api/internal/auth/service.go`

- [ ] **Step 1: Add method below `SeedAdmin`**

```go
// ResetAdmin upserts an admin: updates password if email exists, inserts if not.
func (s *Service) ResetAdmin(ctx context.Context, email, password, name string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	tag, err := s.db.Exec(ctx,
		"UPDATE admins SET password_hash = $1, name = $2 WHERE email = $3",
		string(hash), name, email,
	)
	if err != nil {
		return fmt.Errorf("update admin: %w", err)
	}
	if tag.RowsAffected() > 0 {
		return nil
	}

	_, err = s.db.Exec(ctx,
		"INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3)",
		email, string(hash), name,
	)
	if err != nil {
		return fmt.Errorf("insert admin: %w", err)
	}
	return nil
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd api && go build ./...
```

Expected: no output (success).

- [ ] **Step 3: Commit**

```bash
git add api/internal/auth/service.go
git commit -m "feat(auth): add ResetAdmin upsert method"
```

### Task 2: Create admin-reset CLI binary

**Files:**
- Create: `api/cmd/admin-reset/main.go`

- [ ] **Step 1: Write the binary**

```go
package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"archifex/api/internal/auth"
	"archifex/api/internal/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	if cfg.Admin.Email == "" || cfg.Admin.Password == "" {
		log.Fatal("ADMIN_EMAIL and ADMIN_PASSWORD must be set in env")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, cfg.Database.URL)
	if err != nil {
		log.Fatalf("connect db: %v", err)
	}
	defer pool.Close()

	svc := auth.NewService(pool, cfg.JWT.Secret, cfg.JWT.Expiry)
	if err := svc.ResetAdmin(ctx, cfg.Admin.Email, cfg.Admin.Password, cfg.Admin.Name); err != nil {
		log.Fatalf("reset admin: %v", err)
	}

	log.Printf("admin reset OK for %s", cfg.Admin.Email)
	os.Exit(0)
}
```

Note: confirm the module path with `head -1 api/go.mod` — if it's not `archifex/api`, replace imports accordingly.

- [ ] **Step 2: Build it locally**

```bash
cd api && go build -o /tmp/admin-reset ./cmd/admin-reset
```

Expected: binary created.

- [ ] **Step 3: Commit**

```bash
git add api/cmd/admin-reset/main.go
git commit -m "feat(api): admin-reset CLI binary"
```

### Task 3: Build admin-reset binary inside Docker image

**Files:**
- Modify: `api/Dockerfile`

- [ ] **Step 1: Read current Dockerfile and add a second binary**

In the build stage (after the existing `go build` line for `cmd/api`), append:

```dockerfile
RUN CGO_ENABLED=0 GOOS=linux go build -o /admin-reset ./cmd/admin-reset
```

In the final/runtime stage, add a `COPY` next to the existing api binary copy:

```dockerfile
COPY --from=builder /admin-reset /admin-reset
```

- [ ] **Step 2: Build the image**

```bash
docker build -t archifex-api:test ./api
```

Expected: build succeeds, no errors.

- [ ] **Step 3: Verify both binaries are in the image**

```bash
docker run --rm --entrypoint sh archifex-api:test -c 'ls -la /admin-reset /api 2>&1 || ls -la /'
```

Expected: both binaries listed (or whatever paths the existing Dockerfile uses; adjust accordingly).

- [ ] **Step 4: Commit**

```bash
git add api/Dockerfile
git commit -m "build(docker): include admin-reset binary in api image"
```

### Task 4: Add Makefile target for admin-reset

**Files:**
- Create: `Makefile` (root) — only if it does not already exist
- Or modify: existing root Makefile

- [ ] **Step 1: Check if root Makefile exists**

```bash
ls Makefile 2>/dev/null && echo EXISTS || echo MISSING
```

- [ ] **Step 2: If MISSING, create with this content**

```makefile
.PHONY: admin-reset admin-reset-prod

admin-reset:
	cd api && go run ./cmd/admin-reset

admin-reset-prod:
	ssh root@archifex.space 'cd /opt/archifex/deploy && docker compose -f docker-compose.prod.yml exec -T api /admin-reset'
```

If EXISTS, append the two targets above.

- [ ] **Step 3: Test `admin-reset` locally (requires local db running)**

```bash
docker compose up -d db
cd api && cp .env.example .env  # if needed
make admin-reset
```

Expected: `admin reset OK for admin@example.com` (or whatever ADMIN_EMAIL is set to in `.env.example`).

- [ ] **Step 4: Commit**

```bash
git add Makefile
git commit -m "build(make): add admin-reset and admin-reset-prod targets"
```

### Task 5: Relax client-side email validation

**Files:**
- Modify: `app/src/components/quiz/contact-form.tsx`

- [ ] **Step 1: Read the file and find any `pattern=` attribute or custom regex on the email input**

```bash
grep -n "pattern\|regex\|@.*\\\\.\\|/.*\\\\@" app/src/components/quiz/contact-form.tsx
```

- [ ] **Step 2: Remove the `pattern=` attribute if present, keep only `type="email"` and `required`**

The input should look like:

```tsx
<input
  type="email"
  name="email"
  required
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className={...}
/>
```

If there's a JS-side regex check (e.g. `if (!/^.../.test(email))`), remove the regex but keep a non-empty check `if (!email.trim())`.

- [ ] **Step 3: Build the frontend**

```bash
cd app && npm run build
```

Expected: build passes.

- [ ] **Step 4: Manual smoke test**

`cd app && npm run dev`, open `/en/quiz`, walk to the contact form, type `вася@yandex.ru` → should be accepted (no inline error).

- [ ] **Step 5: Commit**

```bash
git add app/src/components/quiz/contact-form.tsx
git commit -m "fix(quiz): accept Cyrillic and unusual email formats"
```

### Task 6: Verify server-side email validation is permissive

**Files:**
- Modify: `api/internal/leads/models.go` (only if a regex exists; current code already minimal)
- Create: `api/internal/leads/models_test.go`

- [ ] **Step 1: Confirm current server validation has no regex**

```bash
grep -n "regexp\|MailAddress\|validator" api/internal/leads/models.go
```

If no matches, server is already permissive (just checks `Email != ""`). Skip step 2.

If matches found, replace the regex check with `strings.Contains(req.Email, "@") && len(req.Email) <= 254`.

- [ ] **Step 2: Add minimal length cap to current Validate**

In `models.go`, replace `Validate()`:

```go
func (r *SubmitRequest) Validate() error {
	if r.Name == "" {
		return ErrNameRequired
	}
	if r.Email == "" {
		return ErrEmailRequired
	}
	if len(r.Email) > 254 {
		return ErrEmailRequired
	}
	if !strings.Contains(r.Email, "@") {
		return ErrEmailRequired
	}
	return nil
}
```

Add `import "strings"` if not present.

- [ ] **Step 3: Add table tests**

Create `api/internal/leads/models_test.go`:

```go
package leads

import "testing"

func TestSubmitRequest_Validate(t *testing.T) {
	cases := []struct {
		name    string
		req     SubmitRequest
		wantErr bool
	}{
		{"valid ascii", SubmitRequest{Name: "Test", Email: "a@b.com"}, false},
		{"valid cyrillic", SubmitRequest{Name: "Test", Email: "вася@yandex.ru"}, false},
		{"valid short", SubmitRequest{Name: "Test", Email: "a@b.c"}, false},
		{"missing name", SubmitRequest{Name: "", Email: "a@b.com"}, true},
		{"missing email", SubmitRequest{Name: "Test", Email: ""}, true},
		{"missing at sign", SubmitRequest{Name: "Test", Email: "noatsign"}, true},
		{"oversize", SubmitRequest{Name: "Test", Email: string(make([]byte, 300)) + "@b.com"}, true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.req.Validate()
			if (err != nil) != tc.wantErr {
				t.Fatalf("Validate() err=%v, wantErr=%v", err, tc.wantErr)
			}
		})
	}
}
```

- [ ] **Step 4: Run tests**

```bash
cd api && go test ./internal/leads/...
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/internal/leads/models.go api/internal/leads/models_test.go
git commit -m "test(leads): minimal email validation tests + length cap"
```

---

## Slice 4 — Global Polish (Tasks 7-12, ~4-6h)

Deployed second per cadence in spec §6.4 (small wins, no schema changes).

### Task 7: Scroll preservation on language toggle

**Files:**
- Modify: `app/src/components/layout/` (find LanguageToggle component)

- [ ] **Step 1: Locate the language toggle**

```bash
grep -rn "locale.*switch\|setLocale\|lang.*toggle" app/src/components --include="*.tsx" -l
```

- [ ] **Step 2: Read the component to understand current navigation pattern**

Likely it uses `useRouter().push(newLocale)` or `<Link href={altLocale}>`.

- [ ] **Step 3: Save scroll before navigation, restore after**

Wrap the navigation in:

```tsx
const handleLocaleChange = (newLocale: string) => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("scroll-pos", String(window.scrollY));
  }
  router.replace(newPath, { scroll: false });
};
```

In the new locale's root layout (`app/src/app/[locale]/layout.tsx`), add a small client-side restore script on mount (use a Client Component wrapper if layout is server):

```tsx
"use client";
import { useEffect } from "react";

export function ScrollRestorer() {
  useEffect(() => {
    const y = sessionStorage.getItem("scroll-pos");
    if (y) {
      window.scrollTo(0, parseInt(y, 10));
      sessionStorage.removeItem("scroll-pos");
    }
  }, []);
  return null;
}
```

Mount `<ScrollRestorer />` in the locale layout.

- [ ] **Step 4: Build and manual smoke**

```bash
cd app && npm run build
```

Manual: scroll to mid-page on `/en`, click EN→RU toggle, verify scroll position preserved.

- [ ] **Step 5: Commit**

```bash
git add app/src/components app/src/app/[locale]/layout.tsx
git commit -m "fix(i18n): preserve scroll position on locale toggle"
```

### Task 8: 404 page with navigation

**Files:**
- Create: `app/src/app/[locale]/not-found.tsx`
- Create: `app/src/app/not-found.tsx` (root, fallback for non-locale routes)

- [ ] **Step 1: Write `app/src/app/[locale]/not-found.tsx`**

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 gap-6">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl">{t("message")}</p>
      <div className="flex gap-4 mt-4">
        <Link href="/" className="px-6 py-3 bg-accent text-bg-primary rounded-lg">
          {t("home")}
        </Link>
        <Link href="/portfolio" className="px-6 py-3 border border-border rounded-lg">
          {t("portfolio")}
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Add i18n keys**

In `app/messages/en.json`, add under root:

```json
"notFound": {
  "message": "We couldn't find what you were looking for.",
  "home": "Home",
  "portfolio": "Portfolio"
}
```

In `app/messages/ru.json`:

```json
"notFound": {
  "message": "Страница не найдена.",
  "home": "На главную",
  "portfolio": "В портфолио"
}
```

- [ ] **Step 3: Write a root fallback `app/src/app/not-found.tsx`**

```tsx
import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 gap-6">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl">Page not found.</p>
      <Link href="/en" className="px-6 py-3 border border-border rounded-lg">
        Home
      </Link>
    </main>
  );
}
```

- [ ] **Step 4: Build + smoke**

```bash
cd app && npm run build
```

Manual: visit `/en/portfolio/does-not-exist-xyz` → should render 404 with two buttons.

- [ ] **Step 5: Commit**

```bash
git add app/src/app/[locale]/not-found.tsx app/src/app/not-found.tsx app/messages/en.json app/messages/ru.json
git commit -m "feat(404): styled not-found page with navigation"
```

### Task 9: Center top filter row on portfolio

**Files:**
- Modify: `app/src/components/portfolio/portfolio-grid.tsx` (or wherever the filter bar lives)

- [ ] **Step 1: Find the filter container**

```bash
grep -n "filter\|Все\|All\|landing" app/src/components/portfolio/portfolio-grid.tsx
```

- [ ] **Step 2: Update className**

Change the wrapping div from `flex flex-wrap` (left-aligned) to `flex justify-center flex-wrap gap-x-3 gap-y-2`.

- [ ] **Step 3: Build + visual check**

```bash
cd app && npm run dev
```

Open `/en/portfolio` on a wide viewport, verify the filter row is horizontally centered.

- [ ] **Step 4: Commit**

```bash
git add app/src/components/portfolio/portfolio-grid.tsx
git commit -m "fix(portfolio): center filter bar on desktop"
```

### Task 10: Mobile quiz button alignment

**Files:**
- Modify: `app/src/components/quiz/quiz-step.tsx`

- [ ] **Step 1: Find the option button JSX**

```bash
grep -n "option\|button\|justify" app/src/components/quiz/quiz-step.tsx
```

- [ ] **Step 2: Update button inner layout**

Change the button content wrapper from `flex flex-col` (or `flex-col justify-start`) to `flex flex-col justify-end h-full`. The text inside should now sit at the bottom of the button block.

- [ ] **Step 3: Visual check on mobile size**

Open `/ru/quiz` in DevTools mobile mode (375px), verify option text rests at the bottom of each block.

- [ ] **Step 4: Commit**

```bash
git add app/src/components/quiz/quiz-step.tsx
git commit -m "fix(quiz): align option text to bottom on mobile"
```

### Task 11: Light-theme home contrast

**Files:**
- Modify: `app/src/app/[locale]/page.tsx` (or hero component)
- Modify: `app/src/app/globals.css`

- [ ] **Step 1: Identify hero section background**

```bash
grep -n "hero\|bg-bg-primary\|bg-white" app/src/app/[locale]/page.tsx app/src/components/home/*.tsx
```

- [ ] **Step 2: Switch hero background to use a slightly off-white var**

Add to `globals.css` if not present:

```css
:root {
  --bg-secondary: #f4f5f7; /* slightly off-white for hero on light theme */
}
[data-theme="dark"] {
  --bg-secondary: #0a1525; /* slightly different from primary navy */
}
```

In the hero component, change `bg-bg-primary` to `bg-bg-secondary` for the hero section.

- [ ] **Step 3: Increase hero copy weight on light**

If hero text uses `font-medium`, bump to `font-semibold`. If text colour is `text-text-primary`, leave it — primary is already darkest on light.

- [ ] **Step 4: Visual check both themes**

```bash
cd app && npm run dev
```

Open `/en` in light, then dark. Hero should read clearly in both.

- [ ] **Step 5: Commit**

```bash
git add app/src/app/[locale]/page.tsx app/src/components/home app/src/app/globals.css
git commit -m "fix(home): contrast on hero in light theme"
```

### Task 12: Rename "Quiz/Квиз" to "Style finder/Подбор стиля"

**Files:**
- Modify: `app/messages/en.json`
- Modify: `app/messages/ru.json`
- Possibly: components with hard-coded "Quiz" text

- [ ] **Step 1: Find all i18n values containing "Quiz" or "Квиз"**

```bash
grep -niE "\"[^\"]*[qQ]uiz[^\"]*\"" app/messages/en.json
grep -niE "\"[^\"]*[Кк]виз[^\"]*\"" app/messages/ru.json
```

- [ ] **Step 2: Replace user-facing values**

In `en.json`, change values containing "Quiz" → "Style finder" or "Find your style" depending on context (CTA verb-form vs noun). Examples:
- `"Take the Quiz"` → `"Find your style"`
- `"Style Quiz"` → `"Style finder"`
- `"Quiz results"` → `"Your style"`

In `ru.json`, change values containing "Квиз" → "Подбор стиля" or "Подобрать стиль":
- `"Пройти квиз"` → `"Подобрать стиль"`
- `"Квиз стилей"` → `"Подбор стиля"`
- `"Результат квиза"` → `"Твой стиль"`

Keep i18n KEYS as-is (e.g. `home.cta.quiz.title`) — only change values. Keep URL `/quiz` unchanged.

- [ ] **Step 3: Find any hard-coded text outside i18n**

```bash
grep -rniE ">[^<]*[qQК][uвиkВ][iи][zзZ]" app/src --include="*.tsx" --include="*.ts"
```

Replace any user-facing strings with i18n calls (or directly translate if not feasible).

- [ ] **Step 4: Build + smoke**

```bash
cd app && npm run build
```

Manual: visit `/en` and `/ru`, scan for any remaining "Quiz"/"Квиз" in visible UI.

- [ ] **Step 5: Commit**

```bash
git add app/messages app/src
git commit -m "feat(i18n): rename Quiz to Style finder in user-facing copy"
```

---

## Slice 3 — Portfolio & Demos (Tasks 13-19, ~8-10h)

### Task 13: Migration `007_iframe_friendly`

**Files:**
- Create: `api/migrations/007_iframe_friendly.up.sql`
- Create: `api/migrations/007_iframe_friendly.down.sql`

- [ ] **Step 1: Write up.sql**

```sql
ALTER TABLE portfolio_projects ADD COLUMN is_iframe_friendly BOOLEAN NOT NULL DEFAULT FALSE;
```

- [ ] **Step 2: Write down.sql**

```sql
ALTER TABLE portfolio_projects DROP COLUMN is_iframe_friendly;
```

- [ ] **Step 3: Apply locally**

```bash
docker compose up -d db
cd api && go run ./cmd/api  # migrations auto-apply on startup; ctrl-c after "migration 007 applied"
```

- [ ] **Step 4: Verify column exists**

```bash
docker compose exec db psql -U archifex -d archifex -c "\d portfolio_projects" | grep is_iframe_friendly
```

Expected: `is_iframe_friendly | boolean | not null | false`.

- [ ] **Step 5: Commit**

```bash
git add api/migrations/007_iframe_friendly.up.sql api/migrations/007_iframe_friendly.down.sql
git commit -m "db(migration): add is_iframe_friendly to portfolio_projects"
```

### Task 14: Expose `is_iframe_friendly` in Go portfolio service

**Files:**
- Modify: `api/internal/portfolio/models.go`
- Modify: `api/internal/portfolio/service.go`

- [ ] **Step 1: Add field to model**

In `models.go`, add to `PortfolioProject` struct: `IsIframeFriendly bool \`json:"is_iframe_friendly"\``.

- [ ] **Step 2: Update SELECTs**

Find every `SELECT id, slug, ...` from `portfolio_projects` and add `is_iframe_friendly` to the column list and to the `Scan(...)` call. Update all of: `List`, `GetBySlug`, `GetByID`, etc.

- [ ] **Step 3: Update INSERT and UPDATE**

The admin update endpoint should accept `is_iframe_friendly` in the request body and update the column. Mirror the pattern of other boolean fields like `published`.

- [ ] **Step 4: Build**

```bash
cd api && go build ./...
```

- [ ] **Step 5: Commit**

```bash
git add api/internal/portfolio
git commit -m "feat(portfolio): expose is_iframe_friendly field"
```

### Task 15: Build `<DemoFrame>` wrapper component

**Files:**
- Create: `app/src/components/portfolio/demo-frame.tsx`
- Reference: existing `app/src/components/ui/browser-preview.tsx`

- [ ] **Step 1: Write the wrapper**

```tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { BrowserPreview } from "@/components/ui/browser-preview";

interface DemoFrameProps {
  src: string;
  title: string;
  naturalWidth?: number; // default 1280
}

export function DemoFrame({ src, title, naturalWidth = 1280 }: DemoFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function compute() {
      const w = containerRef.current?.clientWidth ?? naturalWidth;
      setScale(Math.min(1, w / naturalWidth));
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [naturalWidth]);

  const isMobile = scale < 1;

  return (
    <div ref={containerRef} className="relative w-full">
      <BrowserPreview url={src}>
        <div
          style={{
            width: `${naturalWidth}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            height: isMobile ? `${720 * scale}px` : "720px",
            overflow: "hidden",
          }}
        >
          <iframe
            src={src}
            title={title}
            sandbox="allow-scripts allow-same-origin"
            style={{
              width: `${naturalWidth}px`,
              height: "720px",
              border: 0,
              display: "block",
              background: "var(--bg-primary)",
            }}
          />
          {isMobile && !overlayDismissed && (
            <button
              type="button"
              onClick={() => setOverlayDismissed(true)}
              className="absolute inset-0 bg-bg-primary/60 flex items-center justify-center text-text-primary font-medium"
              style={{ transform: "none" }}
            >
              Tap to interact
            </button>
          )}
        </div>
      </BrowserPreview>
    </div>
  );
}
```

If `BrowserPreview` doesn't accept children, adapt accordingly — read `browser-preview.tsx` first and align the API.

- [ ] **Step 2: Build**

```bash
cd app && npm run build
```

- [ ] **Step 3: Manual visual smoke**

Add a temporary route or temporarily render `<DemoFrame src="/demos/swiss-typography.html" title="Test" />` somewhere, verify on desktop (full-size, clickable) and mobile (scaled, tap-to-interact).

- [ ] **Step 4: Commit**

```bash
git add app/src/components/portfolio/demo-frame.tsx
git commit -m "feat(portfolio): DemoFrame wrapper with mobile scaling and tap overlay"
```

### Task 16: Patch demo HTMLs — anchor handlers, no-jitter

**Files:**
- Modify: each of `app/public/demos/*.html` that has internal anchor links

- [ ] **Step 1: For each demo HTML, find internal `<a href="#...">` and inline `<script>` blocks**

```bash
for f in app/public/demos/*.html; do
  echo "=== $f ==="
  grep -nE 'href="#[^"]+"|scrollIntoView' "$f" || echo "  (no anchors)"
done
```

- [ ] **Step 2: For HTMLs with anchors, append a small inline script before `</body>`**

```html
<script>
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const t = document.getElementById(id);
    if (t) t.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
});
</script>
```

This prevents the browser's default scroll-to-anchor (which causes parent page jitter from inside an iframe).

- [ ] **Step 3: Visual smoke per demo**

Open each demo directly in browser via `app/public/demos/<name>.html`, click an internal anchor, verify it scrolls inside the page (no jump).

- [ ] **Step 4: Commit**

```bash
git add app/public/demos
git commit -m "fix(demos): prevent parent-page jitter on internal anchors"
```

### Task 17: Replace iframe usage in case study + style references

**Files:**
- Modify: `app/src/components/portfolio/block-renderer.tsx` (for EMBED block type)
- Modify: `app/src/components/quiz/quiz-result.tsx` (for style references)

- [ ] **Step 1: In `block-renderer.tsx`, find the EMBED block render**

```bash
grep -n "EMBED\|iframe" app/src/components/portfolio/block-renderer.tsx
```

- [ ] **Step 2: Replace direct `<iframe>` with `<DemoFrame>`**

```tsx
import { DemoFrame } from "@/components/portfolio/demo-frame";

// inside switch (block.type) { case "EMBED":
return <DemoFrame src={block.url} title={block.caption ?? "Demo"} />;
```

- [ ] **Step 3: Same in `quiz-result.tsx` style references**

If style references render iframes, swap them for `<DemoFrame>`. If they render images, leave them.

- [ ] **Step 4: Build**

```bash
cd app && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add app/src/components
git commit -m "feat(portfolio): use DemoFrame for embedded demos"
```

### Task 18: Conditional link button + iframe-friendly gating in portfolio card

**Files:**
- Modify: `app/src/components/portfolio/project-card.tsx`

- [ ] **Step 1: Read current card**

```bash
cat app/src/components/portfolio/project-card.tsx
```

- [ ] **Step 2: Conditionally render the "Open project" link**

Find the link button and wrap:

```tsx
{project.live_url && (
  <a
    href={project.live_url}
    target="_blank"
    rel="noopener noreferrer"
    className={...}
  >
    {t("openProject")}
  </a>
)}
```

If the card currently always renders the link, this skips it for projects with no `live_url` (FlowTech, ITAM Landing).

- [ ] **Step 3: Inline tag expand for `+N` chip**

Find the `+N more` chip. Replace navigation with state toggle:

```tsx
const [expanded, setExpanded] = useState(false);
const visibleTags = expanded ? project.tags : project.tags.slice(0, 3);
const hidden = project.tags.length - 3;

return (
  <>
    {visibleTags.map(t => <span key={t}>{t}</span>)}
    {!expanded && hidden > 0 && (
      <button onClick={() => setExpanded(true)}>+{hidden}</button>
    )}
    {expanded && (
      <button onClick={() => setExpanded(false)}>{tHide}</button>
    )}
  </>
);
```

Add i18n key `portfolio.hide` ("Hide" / "Скрыть").

- [ ] **Step 4: Build + smoke**

```bash
cd app && npm run build
cd app && npm run dev
```

Manual: portfolio card with many tags → click `+3` → all tags visible inline, label changes to Hide.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/portfolio/project-card.tsx app/messages
git commit -m "fix(portfolio): conditional link + inline tag expand"
```

### Task 19: Seed iframe-friendly flag, fix FlowTech/ITAM live URLs

**Files:**
- Modify: `api/migrations/002_seed.up.sql` (or create `api/migrations/008_iframe_friendly_seed.up.sql`)
- Or: SQL run via admin

- [ ] **Step 1: Decide seed approach**

Per spec §6.1, mark own demos / approved real projects as `is_iframe_friendly = true`. Create migration `008_iframe_friendly_seed.up.sql`:

```sql
UPDATE portfolio_projects SET is_iframe_friendly = TRUE
  WHERE slug IN ('helvexa-clean', 'dev-portfolio', 'swiss-typography', 'product-showcase');

-- Verify FlowTech/ITAM have live_url null when no public URL exists
-- Denis: review and set actual URLs if any
UPDATE portfolio_projects SET live_url = NULL
  WHERE slug IN ('flowtech', 'itam-landing') AND (live_url = '' OR live_url LIKE 'http://localhost%');
```

Down:

```sql
UPDATE portfolio_projects SET is_iframe_friendly = FALSE;
```

- [ ] **Step 2: Apply locally**

Restart API to apply migration.

- [ ] **Step 3: Verify on prod (preview)**

```bash
ssh root@archifex.space 'cd /opt/archifex/deploy && docker compose -f docker-compose.prod.yml exec -T db sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT slug, is_iframe_friendly, live_url FROM portfolio_projects ORDER BY slug;\""'
```

- [ ] **Step 4: Commit**

```bash
git add api/migrations/008_iframe_friendly_seed.up.sql api/migrations/008_iframe_friendly_seed.down.sql
git commit -m "db(seed): mark demo projects as iframe-friendly, null missing URLs"
```

---

## Slice 2 — Quiz tag-based scoring (Tasks 20-28, ~12-16h)

Deployed last. Highest risk.

### Task 20: Pre-deploy backup script (one-shot, manual)

- [ ] **Step 1: Document the backup command in `deploy/admin-runbook.md`** (create if missing)

```bash
ssh root@archifex.space \
  'cd /opt/archifex/deploy && \
   mkdir -p /opt/archifex/backups && \
   docker compose -f docker-compose.prod.yml exec -T db sh -c \
     "pg_dump -U \$POSTGRES_USER -d \$POSTGRES_DB -t quiz_nodes -t quiz_options -t quiz_results" \
     > /opt/archifex/backups/quiz-pre-006-$(date +%Y%m%d-%H%M).sql'
```

- [ ] **Step 2: Run it before applying migration 006 to prod**

This is operational, not code-committed. Note in plan as a manual step before Slice 2 deploy.

- [ ] **Step 3: Commit the runbook**

```bash
git add deploy/admin-runbook.md
git commit -m "docs(deploy): document pre-006 quiz backup procedure"
```

### Task 21: Migration `005_quiz_scoring`

**Files:**
- Create: `api/migrations/005_quiz_scoring.up.sql`
- Create: `api/migrations/005_quiz_scoring.down.sql`

- [ ] **Step 1: Write up.sql**

```sql
ALTER TABLE quiz_options
  ADD COLUMN style_weights JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE quiz_options
  ADD COLUMN project_type project_type NULL;
```

- [ ] **Step 2: Write down.sql**

```sql
ALTER TABLE quiz_options DROP COLUMN style_weights;
ALTER TABLE quiz_options DROP COLUMN project_type;
```

- [ ] **Step 3: Apply locally**

Restart `go run ./cmd/api`, expect `migration 005 applied`.

- [ ] **Step 4: Verify**

```bash
docker compose exec db psql -U archifex -d archifex -c "\d quiz_options" | grep -E "style_weights|project_type"
```

- [ ] **Step 5: Commit**

```bash
git add api/migrations/005_quiz_scoring.up.sql api/migrations/005_quiz_scoring.down.sql
git commit -m "db(migration): add style_weights and project_type to quiz_options"
```

### Task 22: Update QuizOption model + queries

**Files:**
- Modify: `api/internal/quiz/models.go`
- Modify: `api/internal/quiz/service.go`

- [ ] **Step 1: Add fields to `QuizOption` struct**

```go
type QuizOption struct {
	ID            string          `json:"id"`
	NodeID        string          `json:"node_id"`
	LabelEn       string          `json:"label_en"`
	LabelRu       string          `json:"label_ru"`
	NextNodeID    *string         `json:"next_node_id"`
	SortOrder     int             `json:"sort_order"`
	StyleWeights  json.RawMessage `json:"style_weights"`
	ProjectType   *string         `json:"project_type"`
}
```

- [ ] **Step 2: Update SELECTs in `service.go`**

Every `SELECT id, node_id, label_en, label_ru, next_node_id, sort_order FROM quiz_options` → add `, style_weights, project_type`. Update `Scan(...)` to include the new fields. The `scanOption` helper at the bottom of the file is the central place — update there first.

- [ ] **Step 3: Update CreateOption / UpdateOption**

Add `style_weights` and `project_type` to CreateOptionRequest / UpdateOptionRequest and to the SQL.

- [ ] **Step 4: Build**

```bash
cd api && go build ./...
```

- [ ] **Step 5: Commit**

```bash
git add api/internal/quiz
git commit -m "feat(quiz): expose style_weights and project_type on options"
```

### Task 23: Scoring service method `ComputeResult`

**Files:**
- Create: `api/internal/quiz/scoring.go`
- Create: `api/internal/quiz/scoring_test.go`

- [ ] **Step 1: Write scoring logic**

```go
package quiz

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
)

type ScoreResult struct {
	Style      *Style          `json:"style"`
	References []StyleReference `json:"references"`
	Package    *Package        `json:"package"`
}

func (s *Service) ComputeResult(ctx context.Context, optionIDs []string) (*ScoreResult, error) {
	if len(optionIDs) == 0 {
		return nil, fmt.Errorf("no options provided")
	}

	rows, err := s.db.Query(ctx,
		`SELECT id, style_weights, project_type FROM quiz_options WHERE id = ANY($1)`,
		optionIDs,
	)
	if err != nil {
		return nil, fmt.Errorf("load options: %w", err)
	}
	defer rows.Close()

	scores := map[string]int{}
	var projectType *string
	for rows.Next() {
		var id string
		var weightsRaw json.RawMessage
		var pt *string
		if err := rows.Scan(&id, &weightsRaw, &pt); err != nil {
			return nil, fmt.Errorf("scan option: %w", err)
		}
		if pt != nil {
			projectType = pt
		}
		var weights map[string]int
		if err := json.Unmarshal(weightsRaw, &weights); err != nil {
			return nil, fmt.Errorf("unmarshal weights: %w", err)
		}
		for slug, w := range weights {
			scores[slug] += w
		}
	}

	if len(scores) == 0 {
		return nil, fmt.Errorf("no scores computed")
	}

	winningSlug := pickWinner(scores)

	style, err := s.getStyleBySlug(ctx, winningSlug)
	if err != nil {
		return nil, fmt.Errorf("get style: %w", err)
	}
	refs, err := s.getStyleReferences(ctx, style.ID)
	if err != nil {
		return nil, fmt.Errorf("get references: %w", err)
	}

	var pkg *Package
	if projectType != nil {
		pkg, err = s.getFirstPackageByProjectType(ctx, *projectType)
		if err != nil {
			pkg = nil
		}
	}

	return &ScoreResult{Style: style, References: refs, Package: pkg}, nil
}

func pickWinner(scores map[string]int) string {
	type kv struct {
		k string
		v int
	}
	pairs := make([]kv, 0, len(scores))
	for k, v := range scores {
		pairs = append(pairs, kv{k, v})
	}
	sort.Slice(pairs, func(i, j int) bool {
		if pairs[i].v != pairs[j].v {
			return pairs[i].v > pairs[j].v
		}
		return pairs[i].k < pairs[j].k // alphabetical tie-break for determinism
	})
	return pairs[0].k
}
```

If `Style`, `Package`, `StyleReference` models don't exist in `quiz` package, add them by reading the migrations and mirroring DB columns.

- [ ] **Step 2: Add helper queries**

```go
func (s *Service) getStyleBySlug(ctx context.Context, slug string) (*Style, error) {
	var st Style
	err := s.db.QueryRow(ctx,
		`SELECT id, slug, name_en, name_ru, description_en, description_ru
		 FROM quiz_styles WHERE slug = $1`,
		slug,
	).Scan(&st.ID, &st.Slug, &st.NameEn, &st.NameRu, &st.DescriptionEn, &st.DescriptionRu)
	return &st, err
}

func (s *Service) getStyleReferences(ctx context.Context, styleID string) ([]StyleReference, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, style_id, url, label_en, label_ru, type, sort_order
		 FROM style_references WHERE style_id = $1 ORDER BY sort_order`,
		styleID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var refs []StyleReference
	for rows.Next() {
		var r StyleReference
		if err := rows.Scan(&r.ID, &r.StyleID, &r.URL, &r.LabelEn, &r.LabelRu, &r.Type, &r.SortOrder); err != nil {
			return nil, err
		}
		refs = append(refs, r)
	}
	return refs, nil
}

func (s *Service) getFirstPackageByProjectType(ctx context.Context, pt string) (*Package, error) {
	var p Package
	err := s.db.QueryRow(ctx,
		`SELECT id, slug, name_en, name_ru, project_type, description_en, description_ru, price_from, price_to
		 FROM service_packages WHERE project_type = $1 ORDER BY price_from ASC LIMIT 1`,
		pt,
	).Scan(&p.ID, &p.Slug, &p.NameEn, &p.NameRu, &p.ProjectType, &p.DescriptionEn, &p.DescriptionRu, &p.PriceFrom, &p.PriceTo)
	return &p, err
}
```

- [ ] **Step 3: Write `scoring_test.go` with table-driven test for `pickWinner`**

```go
package quiz

import "testing"

func TestPickWinner(t *testing.T) {
	cases := []struct {
		name   string
		scores map[string]int
		want   string
	}{
		{"single", map[string]int{"minimalist": 5}, "minimalist"},
		{"clear winner", map[string]int{"minimalist": 5, "bold-modern": 2}, "minimalist"},
		{"tie alphabetical", map[string]int{"minimalist": 3, "bold-modern": 3}, "bold-modern"},
		{"three way", map[string]int{"a": 1, "b": 1, "c": 1}, "a"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := pickWinner(tc.scores)
			if got != tc.want {
				t.Fatalf("pickWinner(%v) = %s, want %s", tc.scores, got, tc.want)
			}
		})
	}
}
```

- [ ] **Step 4: Run tests**

```bash
cd api && go test ./internal/quiz/...
```

- [ ] **Step 5: Commit**

```bash
git add api/internal/quiz/scoring.go api/internal/quiz/scoring_test.go
git commit -m "feat(quiz): tag-based scoring service"
```

### Task 24: Public endpoint `POST /api/public/quiz/result`

**Files:**
- Modify: `api/internal/quiz/handler.go`
- Modify: `api/cmd/api/main.go` (route registration)

- [ ] **Step 1: Add handler**

In `api/internal/quiz/handler.go`:

```go
type ComputeResultRequest struct {
	OptionIDs []string `json:"option_ids"`
}

func (h *Handler) ComputeResult(w http.ResponseWriter, r *http.Request) {
	var req ComputeResultRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request")
		return
	}
	result, err := h.svc.ComputeResult(r.Context(), req.OptionIDs)
	if err != nil {
		response.Error(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, result)
}
```

Adapt error/response helper names to match existing patterns in the codebase.

- [ ] **Step 2: Register route**

In `api/cmd/api/main.go`, find the existing `/api/public/quiz/...` routes and add:

```go
r.Post("/api/public/quiz/result", quizHandler.ComputeResult)
```

- [ ] **Step 3: Build**

```bash
cd api && go build ./...
```

- [ ] **Step 4: Manual smoke**

```bash
curl -X POST http://localhost:8080/api/public/quiz/result \
  -H 'content-type: application/json' \
  -d '{"option_ids": ["fake-id"]}'
```

Expected: 422 (no scores computed).

- [ ] **Step 5: Commit**

```bash
git add api/internal/quiz/handler.go api/cmd/api/main.go
git commit -m "feat(quiz): POST /quiz/result endpoint"
```

### Task 25: Migration `006_quiz_reseed`

**Files:**
- Create: `api/migrations/006_quiz_reseed.up.sql`
- Create: `api/migrations/006_quiz_reseed.down.sql`

- [ ] **Step 1: Write up.sql**

```sql
-- Wipe existing tree-style quiz content
TRUNCATE TABLE quiz_results CASCADE;
TRUNCATE TABLE quiz_options CASCADE;
TRUNCATE TABLE quiz_nodes CASCADE;

-- Q1 — project type (drives matched_package)
INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, sort_order) VALUES
  ('q1', NULL, 'QUESTION', 'What kind of project?', 'Какой тип проекта?', 0);

INSERT INTO quiz_options (node_id, label_en, label_ru, next_node_id, project_type, style_weights, sort_order) VALUES
  ('q1', 'Landing page', 'Лендинг', 'q2', 'LANDING', '{}', 0),
  ('q1', 'Corporate site', 'Корпоративный сайт', 'q2', 'CORPORATE', '{}', 1),
  ('q1', 'E-commerce', 'Интернет-магазин', 'q2', 'STORE', '{}', 2),
  ('q1', 'Web app / SaaS', 'Веб-приложение', 'q2', 'WEB_APP', '{}', 3),
  ('q1', 'Telegram bot', 'Telegram-бот', 'q2', 'TG_BOT', '{}', 4);

-- Q2 — audience
INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, sort_order) VALUES
  ('q2', 'q1', 'QUESTION', 'Who is your audience?', 'Кто аудитория?', 1);

INSERT INTO quiz_options (node_id, label_en, label_ru, next_node_id, style_weights, sort_order) VALUES
  ('q2', 'B2B / corporate decision-makers', 'B2B / корпоративные клиенты', 'q3',
    '{"corporate-classic": 3, "minimalist": 1}', 0),
  ('q2', 'B2C / mass consumer', 'B2C / массовый потребитель', 'q3',
    '{"bold-modern": 3, "creative-experimental": 1}', 1),
  ('q2', 'Developers / technical', 'Разработчики / техническая', 'q3',
    '{"minimalist": 3, "bold-modern": 1}', 2),
  ('q2', 'Creative / luxury', 'Творческая / премиум', 'q3',
    '{"creative-experimental": 3, "minimalist": 1}', 3);

-- Q3 — visual tempo
INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, sort_order) VALUES
  ('q3', 'q2', 'QUESTION', 'Visual tempo?', 'Визуальный темп?', 2);

INSERT INTO quiz_options (node_id, label_en, label_ru, next_node_id, style_weights, sort_order) VALUES
  ('q3', 'Calm and steady', 'Спокойный', 'q4',
    '{"minimalist": 3, "corporate-classic": 2}', 0),
  ('q3', 'Energetic', 'Энергичный', 'q4',
    '{"bold-modern": 3, "creative-experimental": 2}', 1);

-- Q4 — colour palette
INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, sort_order) VALUES
  ('q4', 'q3', 'QUESTION', 'Colour palette?', 'Цветовая палитра?', 3);

INSERT INTO quiz_options (node_id, label_en, label_ru, next_node_id, style_weights, sort_order) VALUES
  ('q4', 'Neutral / monochrome', 'Нейтральная', 'q5',
    '{"minimalist": 3, "corporate-classic": 2}', 0),
  ('q4', 'High contrast', 'Контрастная', 'q5',
    '{"bold-modern": 3}', 1),
  ('q4', 'Bright / vivid', 'Яркая', 'q5',
    '{"creative-experimental": 3, "bold-modern": 1}', 2),
  ('q4', 'Dark / muted', 'Тёмная', 'q5',
    '{"corporate-classic": 2, "minimalist": 1}', 3);

-- Q5 — typography
INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, sort_order) VALUES
  ('q5', 'q4', 'QUESTION', 'Typography?', 'Типографика?', 4);

INSERT INTO quiz_options (node_id, label_en, label_ru, next_node_id, style_weights, sort_order) VALUES
  ('q5', 'Clean sans-serif', 'Чистый sans-serif', 'q6',
    '{"minimalist": 3, "corporate-classic": 1}', 0),
  ('q5', 'Expressive display', 'Выразительная display', 'q6',
    '{"bold-modern": 3, "creative-experimental": 2}', 1),
  ('q5', 'Editorial serif', 'Редакционная serif', 'q6',
    '{"corporate-classic": 3, "creative-experimental": 1}', 2);

-- Q6 — animation preference (terminal)
INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, sort_order) VALUES
  ('q6', 'q5', 'QUESTION', 'Animations?', 'Анимации?', 5);

INSERT INTO quiz_options (node_id, label_en, label_ru, next_node_id, style_weights, sort_order) VALUES
  ('q6', 'Static / minimal', 'Статика / минимум', NULL,
    '{"minimalist": 3, "corporate-classic": 2}', 0),
  ('q6', 'Subtle transitions', 'Лёгкие переходы', NULL,
    '{"corporate-classic": 1, "minimalist": 1, "bold-modern": 1}', 1),
  ('q6', 'Rich / immersive', 'Насыщенные', NULL,
    '{"creative-experimental": 3, "bold-modern": 2}', 2);
```

> Denis: review the weights and copy in this file before commit. Adjust to your preference.

- [ ] **Step 2: Write down.sql**

```sql
TRUNCATE TABLE quiz_results CASCADE;
TRUNCATE TABLE quiz_options CASCADE;
TRUNCATE TABLE quiz_nodes CASCADE;
-- Note: original tree content from 002_seed.up.sql will need to be re-applied manually if rolling back
-- (this migration is destructive by design)
```

- [ ] **Step 3: Apply locally**

```bash
docker compose up -d db
cd api && go run ./cmd/api  # apply, then ctrl-c
```

- [ ] **Step 4: Verify quiz tree**

```bash
docker compose exec db psql -U archifex -d archifex -c "SELECT id, type, question_en FROM quiz_nodes ORDER BY sort_order;"
```

Expected: 6 rows q1..q6.

- [ ] **Step 5: Smoke the result endpoint**

```bash
# Get option IDs for a path
curl http://localhost:8080/api/public/quiz/node/q1
# Pick one option_id from each of q1..q6 (5 options total since some link to next)
curl -X POST http://localhost:8080/api/public/quiz/result \
  -H 'content-type: application/json' \
  -d '{"option_ids": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"]}'
```

Expected: 200 with `style`, `references`, `package` populated.

- [ ] **Step 6: Commit**

```bash
git add api/migrations/006_quiz_reseed.up.sql api/migrations/006_quiz_reseed.down.sql
git commit -m "db(seed): reseed quiz with 6 linear scoring questions"
```

### Task 26: Frontend — quiz wizard tracks option_ids, calls /result

**Files:**
- Modify: `app/src/components/quiz/quiz-wizard.tsx`
- Modify: `app/src/app/[locale]/quiz/result/page.tsx`
- Modify: `app/src/components/quiz/quiz-result.tsx`
- Modify: `app/src/lib/api.ts` (add `quizResult` method)

- [ ] **Step 1: Add API client method**

In `app/src/lib/api.ts`:

```ts
export async function postQuizResult(optionIds: string[]) {
  const res = await fetch(`${API_BASE}/api/public/quiz/result`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ option_ids: optionIds }),
  });
  if (!res.ok) throw new Error(`quiz/result ${res.status}`);
  return res.json();
}
```

- [ ] **Step 2: Wizard tracks selected option ids**

In `quiz-wizard.tsx`, add a `selectedOptionIds: string[]` state alongside the existing tree-walk state. On each option click, append `option.id` to the array (alongside the existing `next_node_id` navigation).

When the wizard reaches a node with no `next_node_id` (terminal), navigate to `/quiz/result?ids=<csv>` instead of `/quiz/result/[styleSlug]`.

- [ ] **Step 3: Update result page**

`app/src/app/[locale]/quiz/result/page.tsx` becomes a Client Component (or wraps one):

```tsx
"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { postQuizResult } from "@/lib/api";
import { QuizResult } from "@/components/quiz/quiz-result";

export default function ResultPage() {
  const params = useSearchParams();
  const idsCsv = params.get("ids") ?? "";
  const ids = idsCsv ? idsCsv.split(",") : [];
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length === 0) { setError("no answers"); return; }
    postQuizResult(ids).then(setData).catch(e => setError(String(e)));
  }, [idsCsv]);

  if (error) return <div className="p-8">Error: {error}</div>;
  if (!data) return <div className="p-8">Loading…</div>;
  return <QuizResult result={data} />;
}
```

- [ ] **Step 4: Update QuizResult component**

`quiz-result.tsx` accepts the new shape `{ style, references, package }` and renders it. Remove any logic that fetched style by slug from the URL.

- [ ] **Step 5: Build + manual smoke**

```bash
cd app && npm run build
cd app && npm run dev
```

Walk three different paths through the quiz, verify three different style results.

- [ ] **Step 6: Commit**

```bash
git add app/src
git commit -m "feat(quiz): client tracks option_ids, calls /result endpoint"
```

### Task 27: Admin editor — style weights + project_type per option

**Files:**
- Modify: `app/src/components/admin/quiz-tree-editor.tsx`

- [ ] **Step 1: Read current option editor**

```bash
grep -n "label_en\|label_ru\|next_node_id" app/src/components/admin/quiz-tree-editor.tsx
```

- [ ] **Step 2: Add inputs for weights and project_type**

Inside the option edit form, add:

```tsx
{/* Style weights */}
<div className="grid grid-cols-2 gap-2">
  {STYLE_SLUGS.map(slug => (
    <label key={slug} className="flex flex-col">
      <span className="text-sm">{slug}</span>
      <input
        type="number"
        min={0}
        max={3}
        value={(option.style_weights ?? {})[slug] ?? 0}
        onChange={e => updateWeight(option.id, slug, parseInt(e.target.value, 10))}
        className="border px-2 py-1"
      />
    </label>
  ))}
</div>

{/* Project type (optional) */}
<label className="flex flex-col">
  <span className="text-sm">Project type (optional)</span>
  <select
    value={option.project_type ?? ""}
    onChange={e => updateProjectType(option.id, e.target.value || null)}
  >
    <option value="">— none —</option>
    {PROJECT_TYPES.map(pt => <option key={pt}>{pt}</option>)}
  </select>
</label>
```

Define `STYLE_SLUGS = ["bold-modern", "corporate-classic", "creative-experimental", "minimalist"]` and `PROJECT_TYPES = ["LANDING", "CORPORATE", "STORE", "WEB_APP", "TG_BOT"]` (mirror DB enum).

The `updateWeight` and `updateProjectType` handlers POST to the admin update-option endpoint with the new shape.

- [ ] **Step 3: Confirm admin update endpoint accepts new fields**

The Go handler from Task 22 should accept `style_weights` and `project_type` in the update request. Verify with curl.

- [ ] **Step 4: Build + smoke**

```bash
cd app && npm run build
```

Manual: log into admin, edit a quiz option, change a weight, save, walk the quiz on the public side, verify weight took effect.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/admin/quiz-tree-editor.tsx
git commit -m "feat(admin): edit style_weights and project_type per quiz option"
```

### Task 28: Whole-flow integration test (manual walkthrough)

- [ ] **Step 1: Deploy slice 2 to prod**

Pre-step: run pre-006 backup from Task 20.

```bash
git push  # triggers prod deploy via existing pipeline
```

- [ ] **Step 2: Manual quiz path test**

Visit `https://archifex.space/en/quiz`, walk five different paths:
1. Landing + Devs + Calm + Neutral + Clean + Static → expect minimalist
2. Corporate + B2B + Calm + Dark + Editorial + Subtle → expect corporate-classic
3. E-commerce + B2C + Energetic + Bright + Display + Rich → expect bold-modern or creative-experimental
4. Web App + Creative + Energetic + Bright + Display + Rich → expect creative-experimental
5. Telegram bot + B2C + Energetic + Contrast + Display + Subtle → expect bold-modern

- [ ] **Step 3: Confirm ≥ 3 distinct styles surface across the 5 paths**

If they all converge — adjust weights in admin or via SQL.

- [ ] **Step 4: Run final walkthrough**

Denis re-runs `2026-04-20-phase1-audit-walkthrough-ru.md` end-to-end. Acceptance: ≥ 8/10.

- [ ] **Step 5: Tag the release**

```bash
git tag phase1-fixes-complete
git push --tags
```

---

## Self-review notes

- All 28 tasks map back to spec sections (Slice 1 → §2, Slice 4 → §5, Slice 3 → §4, Slice 2 → §3 + §6).
- Migrations 005, 006, 007, 008 sequenced consistently. 006 is destructive — Task 20 documents the backup procedure.
- `pickWinner` tie-breaker is alphabetical (matches spec §3.2 step 4).
- No "TBD" or "TODO" placeholders.
- The plan assumes `archifex/api` as the Go module path; confirm with `head -1 api/go.mod` and adjust imports in Task 2 if different.
- The plan assumes the existing `BrowserPreview` component renders children; if it takes only a `url` prop, Task 15 needs to be adapted to nest the iframe outside it instead.
