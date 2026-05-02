# Phase 1 Fixes — Design Spec

**Date:** 2026-05-02
**Author:** Denis (with Claude as tech lead)
**Status:** Approved, ready for implementation plan
**Predecessors:**
- `docs/superpowers/specs/2026-04-20-phase1-audit-design.md` — original audit spec
- `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md` — 110 findings from automated checks
- `docs/superpowers/specs/2026-04-20-phase1-audit-walkthrough-ru.md` — Denis's manual walk-through (filled in 2026-05-01)

## §1. Context & Scope

### Why this spec exists

Phase 1 of the portfolio platform was declared "deploy ready" but two layers of audit revealed gaps:
- The automated audit (Pass 2a) recorded 110 findings, surfacing 3 bugs, 4 content gaps, and 14 polish items.
- The manual walk-through (Pass 2b) by Denis added blockers that didn't surface in automation: admin login on prod has no documented recovery procedure (only manual SQL), email validation rejects Cyrillic, quiz logic always converges on "Minimalist".

Denis self-rated readiness 4-5/10 and called the site not ready to show clients.

### Goal

Raise readiness from 4-5/10 to 8/10 ("not embarrassing to show clients") within ~30 hours of focused work, organised as 4 vertical slices.

### In scope

- All 3 blockers (admin reset, email validation, quiz logic).
- Demo iframe overhaul (desktop + mobile) — explicit user decision: this is a killer feature, fix and improve, do not replace.
- Quiz redesign as tag-based scoring (DB migration, traversal logic, admin editor, EN+RU content).
- UX fixes: `+N tags` inline expand, missing portfolio links, scroll jump on language toggle, 404 navigation, top filter centering, mobile quiz button alignment, light-theme home contrast.
- Label rename: "Quiz/Квиз" → "Style finder/Подбор стиля" in UI text. URL `/quiz` stays.

### Out of scope (Phase 2)

- Custom cursor, hidden scrollbar.
- Comfort-mode reinforcement.
- Rewriting GPT-sounding project descriptions.
- Console noise from Denis's browser extensions (`lockdown-install.js`, `reload.js`, `chrome-extension://...`) — not our code.
- E2E testing infrastructure (Playwright). Manual walkthrough remains the regression check.

### Definition of done

Denis re-runs `2026-04-20-phase1-audit-walkthrough-ru.md` after the last slice deploys and rates readiness ≥ 8/10. The 3 blockers and the recurring demo-iframe complaints must specifically clear.

## §2. Slice 1 — Admin & Auth

**Objective:** unblock administrative access and lead capture from Cyrillic email addresses.

### 2.1. Admin password reset CLI

**Mechanism (Option A from brainstorm):** new Go binary `api/cmd/admin-reset/main.go` invoked via Makefile target.

```
make admin-reset                                    # docker compose exec api /admin-reset
go run ./cmd/admin-reset                            # local with .env loaded
```

Flow:
1. Read `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` from env.
2. If admin row with that email exists → `UPDATE password_hash`.
3. If not → `INSERT` (existing `SeedAdmin` behaviour).
4. Log `admin reset OK for <email>` and exit 0.

### 2.2. Email validation relax

Both client and server tighten down to minimum:
- **Client:** strip the custom regex pattern from `LeadForm.tsx`. Use HTML5 `type="email"` only — browsers accept Cyrillic local-parts and unusual TLDs.
- **Server:** in `api/internal/leads/service.go`, replace any custom regex with `strings.Contains(email, "@") && len(email) <= 254`. SMTP delivery later determines true validity.

### 2.3. Admin dashboard sanity (bonus, ≤30 min)

Once Denis can log in, walk §4б of the audit walkthrough that was previously blocked. Fix any small bugs found inline. If nothing surfaces — slice closes.

### 2.4. Files

| Path | Change |
|---|---|
| `api/cmd/admin-reset/main.go` | new (~50 lines) |
| `api/internal/auth/service.go` | add `ResetAdmin(ctx, email, password, name) error` |
| `api/Dockerfile` | add second build target for admin-reset binary |
| `Makefile` (root) | add `admin-reset` target |
| `app/src/components/quiz/LeadForm.tsx` | drop custom regex |
| `api/internal/leads/service.go` | drop custom regex; minimum-only check |
| `api/internal/leads/service_test.go` | new — table tests for email validation |

### 2.5. Acceptance

- `make admin-reset` succeeds inside docker compose.
- Denis logs into `/admin` with the password from `.env`.
- `вася@yandex.ru` is accepted by the lead form and persisted.
- Dashboard renders real numbers (leads count, projects count).

**Estimated effort:** 3-4 hours.

## §3. Slice 2 — Quiz redesign (tag-based scoring)

**Objective:** different quiz paths produce different recommendations; admin can edit per-option style weights; current convergence on "Minimalist" disappears.

### 3.1. Schema migration `005_quiz_scoring`

```sql
ALTER TABLE quiz_options
  ADD COLUMN style_weights JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE quiz_options
  ADD COLUMN project_type project_type NULL;
```

`style_weights` example: `{"minimalist": 2, "bold-modern": 1, "corporate-classic": 0, "creative-experimental": 0}`. Only non-zero entries need to be present.

`project_type` is set only on options that determine project type (the question "what kind of site do you need?"). It is null elsewhere.

`quiz_nodes.type` enum (`QUESTION`/`RESULT`) is preserved for backward compat. RESULT becomes a "terminal marker" without semantic meaning — style and package are computed.

Down-migration: `DROP COLUMN`. No data loss because data is re-seeded in 006.

### 3.2. Scoring logic (Go)

New endpoint: `POST /api/public/quiz/result`.

Request body:
```json
{ "option_ids": ["uuid1", "uuid2", "uuid3", ...] }
```

Response body:
```json
{
  "style":      { "slug": "...", "name_en": "...", "name_ru": "...", ... },
  "references": [ { "url": "...", "label_en": "...", ... }, ... ],
  "package":    { "slug": "...", "name_en": "...", "price_from": ..., ... }
}
```

Algorithm:
1. Load options by IDs in one query (`WHERE id = ANY($1)`).
2. Sum: for each option, for each `(slug, weight)` in `style_weights` → `scores[slug] += weight`.
3. Track project_type: last non-null `project_type` across selected options wins.
4. `winning_style = argmax(scores)`. Tie-breaker: alphabetical slug for determinism.
5. `matched_package = service_packages WHERE project_type = state.project_type LIMIT 1` (ordered by `price_from ASC` for determinism).
6. Load style references for the winning style (existing `style_references` table).
7. Return assembled object.

### 3.3. Frontend changes

Quiz wizard tracks `selected_option_ids: string[]` in client state (Zustand store extension). On reaching a terminal node it POSTs to `/api/public/quiz/result`. Existing `/quiz/result/[styleSlug]` route is replaced by `/quiz/result` (no slug param). Because the selected options live in client state, the result page must be a Client Component that fetches via `useEffect` on mount.

Loading state: skeleton card while waiting for `/result`.

### 3.4. Admin editor

`app/src/app/admin/quiz/[nodeId]/page.tsx` (or wherever option editing lives) gains for each option:
- 4 number inputs (range 0-3) — one per style slug, labelled by style name.
- A dropdown "Project type (optional)" with explicit empty default.

The previously separate "RESULT node editor" UI is removed. Terminal nodes are just nodes with no options.

### 3.5. Re-seed quiz content (`006_quiz_reseed`)

Strategy: drop existing `quiz_nodes` and `quiz_options` rows (preserve `quiz_styles` and `service_packages`). Insert a new linear set of 6 questions:

| # | Question (en) | Question (ru) | Drives |
|---|---|---|---|
| 1 | What kind of project? | Какой тип проекта? | `project_type` |
| 2 | Target audience | Целевая аудитория | style weights |
| 3 | Visual tempo | Визуальный темп | style weights |
| 4 | Colour palette | Цветовая палитра | style weights |
| 5 | Typography | Типографика | style weights |
| 6 | Animation preference | Анимации | style weights |

Each option distributes 0-3 points across the 4 styles. Specific weight tables and EN+RU copy are written in the seed file at implementation time and reviewed by Denis before commit.

### 3.6. Acceptance

- Five different paths through the quiz produce ≥ 3 distinct styles (no global convergence on minimalist).
- An admin user editing weights on one option sees the change reflected on the next quiz run on prod.
- `005` and `006` `down.sql` cleanly revert.
- Existing `leads` rows continue to render in the admin (their `recommended_style` / `recommended_package` are denormalised strings).

**Estimated effort:** 12-16 hours.

## §4. Slice 3 — Portfolio & Demos

**Objective:** the iframe demos work flawlessly on desktop and mobile, portfolio cards link where they should, tag rows expand inline.

### 4.1. Demo iframe overhaul

Four issues, each with a targeted fix:

**1) White edge on demo sites.** Likely a mismatch between the `<BrowserChrome>` wrapper and the iframe's own background/border. Fix: iframe gets `display: block; background: var(--bg); border: 0`. Chrome wrapper uses the same theme variables so the seam disappears.

**2) Clicks not registering inside iframe.** Sandbox is correct (`allow-scripts allow-same-origin`); the issue is a transparent overlay (likely a lazy-loading shim or a captured `pointer-events`). Audit the DOM around demos and remove the offending `pointer-events: auto` on a non-iframe sibling.

**3) Page jitter on click.** Anchor clicks inside the iframe scroll the parent page because the browser focuses the iframe and scrolls to it. Fix in two places: iframe wrapper gets `scroll-margin-top: 0`; demo HTMLs use `e.preventDefault()` on internal anchor handlers, then `scrollIntoView({ block: 'nearest' })` against the iframe body.

**4) Mobile UX (Option A from brainstorm).** New component `<DemoFrame>`:
- Width ≥ 768px: render iframe natively inside `<BrowserChrome>`.
- Width < 768px: iframe wrapped in `transform: scale(0.5); transform-origin: top left`, container height computed from scaled iframe. Transparent overlay shows "Tap to interact" — first tap removes overlay (state in React) so subsequent gestures hit the iframe.

### 4.2. Curated iframe usage

Denis: only sites that work well in iframe (own demos and approved real projects) get the treatment. Add a flag:

```sql
-- 007_iframe_friendly.up.sql
ALTER TABLE portfolio_projects ADD COLUMN is_iframe_friendly BOOLEAN NOT NULL DEFAULT FALSE;
```

Seed: own demos (`helvexa-clean`, `dev-portfolio`, `swiss-typography`, `product-showcase`) → `true`. Real projects without permission or under auth → `false`. Frontend renders `<DemoFrame>` when true; otherwise renders a static thumbnail with an external link.

### 4.3. Missing portfolio links (FlowTech, ITAM Landing)

Two-sided fix:
- **Content:** verify `portfolio_projects.live_url` for both rows. Either fill in URLs (if there is a public version) or leave null.
- **Code:** `<PortfolioCard>` conditionally renders the "Open project" button: `{liveUrl ? <LinkButton href={liveUrl}>...</LinkButton> : null}`. Cards without a link don't show a dead button.

### 4.4. `+N tags` inline expand

Currently a `+3` chip likely navigates to the project page. Replace with inline expand: clicking expands the card to show the hidden tags in a wrap row, label changes to `Скрыть / Hide`. Use React state — no library.

### 4.5. Files

| Path | Change |
|---|---|
| `app/src/components/demos/DemoFrame.tsx` | new — wrapper with desktop/mobile branches |
| `app/src/components/demos/BrowserChrome.tsx` | clean up border/padding/background |
| `app/public/demos/*.html` (4 files) | patch internal anchor handlers |
| `app/src/components/portfolio/PortfolioCard.tsx` | conditional link button + use `<DemoFrame>` when `is_iframe_friendly` |
| `app/src/components/portfolio/TagList.tsx` (or equivalent) | inline expand state |
| `api/migrations/007_iframe_friendly.up.sql` + `.down.sql` | new column |
| `api/internal/portfolio/models.go` | expose `IsIframeFriendly` |
| `api/internal/portfolio/service.go` | include in SELECTs and admin update |

### 4.6. Acceptance

- Four iframe complaints (white edge, clicks, jitter, mobile) are gone on prod, verified in walkthrough.
- FlowTech and ITAM Landing cards either have a working link button or have no button at all.
- "+3" chip expands the card inline; clicking again collapses it.
- Only `is_iframe_friendly = true` projects render the `<DemoFrame>`; others fall back to a static thumbnail.

**Estimated effort:** 8-10 hours.

## §5. Slice 4 — Global polish

**Objective:** finish the small items that together meaningfully shift perception.

### 5.1. Scroll jump on language toggle

Currently `EN ↔ RU` resets scroll. Fix: `LanguageToggle` saves `window.scrollY` to `sessionStorage` before navigation; the new locale page reads it on mount and restores. Alternative implementation: `router.replace(newUrl, { scroll: false })` if the i18n routing supports it.

### 5.2. Light-theme home contrast

Hero on light theme reads as "white on white". Fix: hero section background switches to `bg-bg-secondary` (slightly off-white) on light theme; hero copy uses heavier weight + darker tone on light. Specific CSS values chosen during implementation.

### 5.3. 404 navigation

`app/src/app/[locale]/not-found.tsx` (or root `not-found.tsx`) gains two visible buttons: "На главную / Home" and "В портфолио / Portfolio".

### 5.4. Top filter row centering

`<FilterBar>` container becomes `flex justify-center flex-wrap gap-x-3`. Currently left-aligned on desktop.

### 5.5. Mobile quiz button alignment

`<QuizOption>` button inner content uses `flex flex-col justify-end` so option text rests against the bottom of its block, not the top.

### 5.6. Label rename "Quiz" → "Style finder"

Touch only i18n keys and JSX:
- `app/messages/en.json`: any key whose user-facing value contains "Quiz" → "Style finder" / "Find your style".
- `app/messages/ru.json`: any key whose user-facing value contains "Квиз" → "Подбор стиля".
- JSX: search for hard-coded `quiz`/`Quiz`/`Квиз`/`квиз` outside i18n calls — translate or move into i18n.

URL `/quiz` stays. Internal route name and admin labels can stay technical.

### 5.7. Acceptance

- Switching EN ↔ RU on a long-scrolled page keeps scroll position.
- Light-theme home reads cleanly; hero is no longer "floating in white".
- 404 page has two working buttons back to safe pages.
- Filter row is horizontally centred on desktop.
- Mobile quiz options visually anchor text to the bottom of their block.
- Word "Quiz" / "Квиз" no longer appears in the public UI (URL excepted).

**Estimated effort:** 4-6 hours.

## §6. Cross-cutting concerns

### 6.1. Migrations

| Migration | Purpose | Risk |
|---|---|---|
| `005_quiz_scoring.up.sql` | add `style_weights`, `project_type` to `quiz_options` | low (additive) |
| `006_quiz_reseed.up.sql` | wipe & re-seed `quiz_nodes` + `quiz_options` with new linear flow | medium (data overwrite) |
| `007_iframe_friendly.up.sql` | add `is_iframe_friendly` to `portfolio_projects` | low (additive, default false) |

Each has a `.down.sql`. Pre-deploy of `006`, run a one-shot backup script:

```bash
ssh root@archifex.space \
  'cd /opt/archifex/deploy && \
   docker compose -f docker-compose.prod.yml exec -T db sh -c \
     "pg_dump -U \$POSTGRES_USER -d \$POSTGRES_DB \
        -t quiz_nodes -t quiz_options" \
     > /opt/archifex/backups/quiz-pre-006-$(date +%Y%m%d-%H%M).sql'
```

This protects against the (unlikely) case Denis manually edited quiz content via the admin between deploy and the reseed.

### 6.2. Testing

**Backend (Go unit tests):**
- `TestQuizScoring` — table-driven: input `[]option_ids` → expected `(style_slug, package_slug)`.
- `TestEmailValidation` — `вася@yandex.ru` ✅, `nope` ❌, `a@b` ❌, `a@b.c` ✅, oversize input ❌.
- `TestAdminReset` — minimal happy-path with a fakeDB.

**Frontend:** `npm run build` must pass before merge. No new E2E framework introduced this cycle.

**Manual regression:** after each slice deploy, Denis re-runs the relevant section of `2026-04-20-phase1-audit-walkthrough-ru.md`. After the last slice deploys, Denis does the full walkthrough.

### 6.3. Rollback

- Each slice merges as one PR. `git revert <merge-sha>` + redeploy is the rollback.
- Slice 2 (quiz redesign) is the highest-risk: revert order is API binary first, then `006_quiz_reseed.down.sql`, then `005_quiz_scoring.down.sql`. Restore quiz content from the pre-006 backup if needed.
- Slice 3 (portfolio & demos) is mostly frontend; redeploy of the previous Next.js build is sufficient. Migration `007` is additive — no urgency to roll it back.

### 6.4. Deployment cadence

Vertical slices are independent, so deploy order is optimised for risk and momentum:

1. **Slice 1 — Admin & Auth.** Smallest, lowest risk, immediately unblocks Denis from accessing the admin panel.
2. **Slice 4 — Global Polish.** Pure frontend, no schema, accumulates visible wins quickly.
3. **Slice 3 — Portfolio & Demos.** Frontend-heavy + one additive migration (007).
4. **Slice 2 — Quiz redesign.** Most complex, deployed last when surrounding code is stable.

Each deploy is followed by a ~5 minute smoke check by Denis (`/`, `/admin`, `/quiz`, `/logos` HTTP 200, no obvious visual regression).

### 6.5. Whole-phase acceptance

- All 4 slices deployed and accepted.
- Denis re-runs the full walkthrough and rates ≥ 8/10.
- `/health`, `/admin`, `/quiz`, `/logos` return 200 on prod.
- No out-of-scope work (custom cursor, GPT-rewriting, comfort mode reinforcement) snuck into any slice.

## §7. Open questions for implementation phase

These are deliberately deferred to the writing-plans step, because they're tactical:

- Specific colour values for §5.2 (light-theme contrast).
- Exact weights table for the 6 questions in §3.5 (will be reviewed by Denis when seed file is drafted).
- Whether `<DemoFrame>` mobile overlay uses CSS `:has()` (newer browsers) or React state (universal). Default: React state.
- Mobile iframe scale factor (the spec uses `0.5` as an example; implementation will compute `viewport_width / iframe_natural_width` per viewport).

## §8. Files

Spec lives at `docs/superpowers/specs/2026-05-02-phase1-fixes-design.md`. Implementation plan will be written to `docs/superpowers/plans/2026-05-02-phase1-fixes.md` after this spec is approved.
