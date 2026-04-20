# Phase 1 Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify every Phase 1 feature of archifex.space works end-to-end, log findings, fix in priority order (bugs → content → polish) until Phase 1 is a known-clean baseline.

**Architecture:** This is an audit, not a feature build. The "deliverable" is (a) a populated findings log, (b) fix commits addressing each finding, (c) an updated CLAUDE.md. Work is split into **Pass 2a** (automated/scriptable verification by Claude), **Pass 2b** (manual verification by Denis), **Triage** (classify findings), and **Pass 3** (fix in priority order — re-planned after triage because fix tasks depend on what's found).

**Tech Stack:** curl, jq, grep, WebFetch, `npm run build`, `go build`, SSH to VPS (62.76.228.106 or archifex.space), bash scripting. No new dependencies.

**Reference spec:** `docs/superpowers/specs/2026-04-20-phase1-audit-design.md`

---

## Phase A — Setup

### Task 1: Create findings log scaffold

**Files:**
- Create: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: Write the findings log scaffold**

Create `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md` with this content:

```markdown
# P002 Portfolio — Phase 1 Audit Findings

**Date started:** 2026-04-20
**Spec:** `2026-04-20-phase1-audit-design.md`
**Target:** archifex.space (production)

## Legend

- **Result:** `pass` | `fail` | `skip`
- **Severity:** `bug` | `content` | `polish` | `deferred` | `—` (for passes)

## Findings

| # | Section | Claim | Result | Severity | Notes | Fix Commit |
|---|---------|-------|--------|----------|-------|-----------|

## Summary (filled in after Pass 2)

- Total claims: TBD
- Passed: TBD
- Failed — bug: TBD
- Failed — content: TBD
- Failed — polish: TBD
- Skipped / deferred: TBD
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "docs: scaffold Phase 1 audit findings log"
```

---

## Phase B — Pass 2a: Automated Verification (Claude)

**Rule for every task in this phase:** after running the verification, append one row per claim to the findings log table. Keep IDs monotonic (#1, #2, …). Use `—` for Severity if the claim passed. Commit the findings log update at the end of each task.

### Task 2: Public API endpoint smoke test

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: Verify health + public endpoints return 200**

Run each command. Expected: HTTP 200 body is valid JSON with `data` key (except `/health` which returns `{"status":"ok"}`).

```bash
curl -s -o /dev/null -w "/health %{http_code}\n" https://archifex.space/health
curl -s -o /dev/null -w "/api/public/portfolio %{http_code}\n" https://archifex.space/api/public/portfolio
curl -s -o /dev/null -w "/api/public/quiz/root %{http_code}\n" https://archifex.space/api/public/quiz/root
curl -s -o /dev/null -w "/api/public/styles %{http_code}\n" https://archifex.space/api/public/styles
curl -s -o /dev/null -w "/api/public/packages %{http_code}\n" https://archifex.space/api/public/packages
curl -s -o /dev/null -w "/api/public/content %{http_code}\n" https://archifex.space/api/public/content
curl -s -o /dev/null -w "/api/public/logos/stats %{http_code}\n" https://archifex.space/api/public/logos/stats
curl -s -o /dev/null -w "/api/public/logos/sessions %{http_code}\n" https://archifex.space/api/public/logos/sessions
```

- [ ] **Step 2: Verify response shapes (not just status codes)**

Run and inspect output. Every response must have a top-level `data` key.

```bash
curl -s https://archifex.space/api/public/portfolio | jq 'has("data")'
curl -s https://archifex.space/api/public/quiz/root | jq 'has("data")'
curl -s https://archifex.space/api/public/styles | jq 'has("data") | .data | length'
curl -s https://archifex.space/api/public/packages | jq 'has("data") | .data | length'
curl -s https://archifex.space/api/public/content | jq '.data | length'
curl -s https://archifex.space/api/public/logos/stats | jq '.data | length'
```

Expected: all `has("data")` returns `true`; `length` values are non-zero for styles/packages/content (seeded); logos/stats has 30 items.

- [ ] **Step 3: Verify portfolio slug route with a real slug**

```bash
SLUG=$(curl -s https://archifex.space/api/public/portfolio | jq -r '.data[0].slug')
echo "Testing slug: $SLUG"
curl -s -o /dev/null -w "%{http_code}\n" "https://archifex.space/api/public/portfolio/$SLUG"
```

Expected: HTTP 200. Take note of `$SLUG` for later tasks.

- [ ] **Step 4: Append findings rows**

For each claim in spec §4.1–4.5 that corresponds to "endpoint X returns 200", add one row to the findings log. Example row:

```markdown
| 1 | 4.1 | GET /api/public/portfolio returns 200 JSON with data key | pass | — | — | — |
```

For each failing claim, add severity `bug` and the HTTP code or error in Notes.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: record public API endpoint smoke test results"
```

### Task 3: Admin API auth check

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: Verify admin endpoints reject unauthenticated requests**

```bash
curl -s -o /dev/null -w "/api/admin/portfolio (no auth) %{http_code}\n" https://archifex.space/api/admin/portfolio
curl -s -o /dev/null -w "/api/admin/leads (no auth) %{http_code}\n" https://archifex.space/api/admin/leads
curl -s -o /dev/null -w "/api/admin/styles (no auth) %{http_code}\n" https://archifex.space/api/admin/styles
curl -s -o /dev/null -w "/api/admin/packages (no auth) %{http_code}\n" https://archifex.space/api/admin/packages
curl -s -o /dev/null -w "/api/admin/content (no auth) %{http_code}\n" https://archifex.space/api/admin/content
curl -s -o /dev/null -w "/api/admin/quiz/tree (no auth) %{http_code}\n" https://archifex.space/api/admin/quiz/tree
```

Expected: all return 401.

- [ ] **Step 2: Verify login endpoint rejects invalid credentials**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://archifex.space/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.com","password":"wrong"}'
```

Expected: HTTP 401.

- [ ] **Step 3: Verify login endpoint accepts valid credentials and sets cookie**

This requires Denis's real admin credentials from `deploy/.env` on the VPS. Ask Denis for the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values (or fetch from VPS via SSH: `ssh root@62.76.228.106 'grep ADMIN_ /opt/archifex/deploy/.env'`).

**Do not commit credentials anywhere.** Use them in the shell only.

```bash
read -sp "Admin email: " ADMIN_EMAIL && echo
read -sp "Admin password: " ADMIN_PASSWORD && echo
curl -s -i -X POST https://archifex.space/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  -c /tmp/archifex-cookies.txt | head -20
```

Expected: HTTP 200, `Set-Cookie` header with JWT cookie, response body `{"data":{"token":"…","user":{…}}}`.

- [ ] **Step 4: Verify authenticated requests succeed**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -b /tmp/archifex-cookies.txt https://archifex.space/api/auth/me
curl -s -o /dev/null -w "%{http_code}\n" -b /tmp/archifex-cookies.txt https://archifex.space/api/admin/portfolio
curl -s -o /dev/null -w "%{http_code}\n" -b /tmp/archifex-cookies.txt https://archifex.space/api/admin/leads
```

Expected: all 200.

- [ ] **Step 5: Delete the cookie jar**

```bash
rm -f /tmp/archifex-cookies.txt
```

- [ ] **Step 6: Append findings rows for §4.9 + §4.10 admin auth claims, then commit**

```bash
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: record admin auth check results"
```

### Task 4: Public page HTTP smoke test (both locales)

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: Fetch every public page route in both locales**

```bash
for locale in en ru; do
  for path in "" "/portfolio" "/quiz"; do
    curl -s -o /dev/null -w "/$locale$path %{http_code}\n" "https://archifex.space/$locale$path"
  done
done
curl -s -o /dev/null -w "/logos %{http_code}\n" https://archifex.space/logos
```

Expected: all HTTP 200.

- [ ] **Step 2: Fetch every published portfolio case-study page**

```bash
curl -s https://archifex.space/api/public/portfolio | jq -r '.data[].slug' | while read slug; do
  curl -s -o /dev/null -w "/en/portfolio/$slug %{http_code}\n" "https://archifex.space/en/portfolio/$slug"
  curl -s -o /dev/null -w "/ru/portfolio/$slug %{http_code}\n" "https://archifex.space/ru/portfolio/$slug"
done
```

Expected: all HTTP 200.

- [ ] **Step 3: Walk every quiz path to every leaf**

```bash
curl -s https://archifex.space/api/public/quiz/root | jq -r '.data.id' > /tmp/quiz-nodes-to-visit
SEEN=/tmp/quiz-nodes-seen
: > $SEEN

while [ -s /tmp/quiz-nodes-to-visit ]; do
  NODE=$(head -1 /tmp/quiz-nodes-to-visit)
  tail -n +2 /tmp/quiz-nodes-to-visit > /tmp/quiz-nodes-to-visit.tmp
  mv /tmp/quiz-nodes-to-visit.tmp /tmp/quiz-nodes-to-visit
  if grep -qx "$NODE" $SEEN; then continue; fi
  echo "$NODE" >> $SEEN
  RESP=$(curl -s "https://archifex.space/api/public/quiz/node/$NODE")
  echo "Visited $NODE — type=$(echo "$RESP" | jq -r '.data.type') children=$(echo "$RESP" | jq -r '.data.options | length')"
  echo "$RESP" | jq -r '.data.options[]?.next_node_id // empty' >> /tmp/quiz-nodes-to-visit
done
```

Expected output: every QUESTION node reports children > 0, every RESULT node has recommended style + package IDs. Record total nodes visited, and any node that returned 404 or missing fields.

- [ ] **Step 4: Append findings rows for §4.1 home, §4.2 portfolio grid, §4.3 case studies, §4.4 quiz pages, §4.5 logos — one row per locale/route**

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: record public page HTTP smoke test results"
```

### Task 5: i18n key parity check

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: Compare key sets between en.json and ru.json**

```bash
cd app
# Extract all leaf keys from each JSON using jq
jq -r 'paths(scalars) | map(tostring) | join(".")' messages/en.json | sort > /tmp/en-keys.txt
jq -r 'paths(scalars) | map(tostring) | join(".")' messages/ru.json | sort > /tmp/ru-keys.txt
diff /tmp/en-keys.txt /tmp/ru-keys.txt
```

Expected: no diff output (empty). If there is a diff, record every divergent key.

- [ ] **Step 2: Grep code for translation key usage and verify each exists**

```bash
cd app
# Extract string args from useTranslations('ns') / t('key') calls
grep -rE "useTranslations\(['\"]([^'\"]+)['\"]" src/ | grep -oE "['\"]([^'\"]+)['\"]\)" | sort -u > /tmp/ns-used.txt
grep -rE "\bt\(['\"]([^'\"]+)['\"]" src/ | grep -oE "t\(['\"]([^'\"]+)['\"]" | sort -u > /tmp/keys-used.txt
cat /tmp/ns-used.txt
cat /tmp/keys-used.txt
```

Spot-check a sample of 5 keys manually: for each `ns` + `key` pair, confirm `messages/en.json` contains the path `ns.key`. Example:

```bash
jq -r '.Hero.title' messages/en.json
```

Expected: returns the expected string, not `null`.

- [ ] **Step 3: Append findings rows for §4.6 i18n claims**

Record one row for "en/ru key parity" (pass if diff is empty), and one row per sampled key ("hero.title exists in en" etc.).

- [ ] **Step 4: Commit**

```bash
cd "E:/Projects/000 - Personal/002 - Portfolio Project"
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: record i18n key parity results"
```

### Task 6: Build health check

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: Frontend TypeScript build**

```bash
cd "E:/Projects/000 - Personal/002 - Portfolio Project/app"
npm run build 2>&1 | tee /tmp/frontend-build.log
echo "EXIT: ${PIPESTATUS[0]}"
```

Expected: exit 0, no TypeScript errors.

- [ ] **Step 2: Backend Go build**

```bash
cd "E:/Projects/000 - Personal/002 - Portfolio Project/api"
go build ./cmd/api 2>&1 | tee /tmp/api-build.log
echo "EXIT: ${PIPESTATUS[0]}"
```

Expected: exit 0, no compilation errors.

- [ ] **Step 3: Append findings rows**

One row per build (frontend, backend). If either fails, severity `bug`, Notes = first error line.

- [ ] **Step 4: Commit**

```bash
cd "E:/Projects/000 - Personal/002 - Portfolio Project"
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: record build health check results"
```

### Task 7: SSL + HTTPS redirect + security headers

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: Verify HTTPS redirect**

```bash
curl -s -I http://archifex.space | head -5
```

Expected: `HTTP/1.1 301 Moved Permanently` and `Location: https://archifex.space/`.

- [ ] **Step 2: Verify SSL cert expiry**

```bash
echo | openssl s_client -servername archifex.space -connect archifex.space:443 2>/dev/null | openssl x509 -noout -dates
```

Expected: `notAfter` is >30 days in the future.

- [ ] **Step 3: Verify security headers**

```bash
curl -s -I https://archifex.space | grep -iE "strict-transport|x-frame|x-content-type|referrer-policy"
```

Expected: `Strict-Transport-Security` header present. Others are nice-to-have — log absences as `polish`.

- [ ] **Step 4: Append findings rows for §4.18 claims and any missing security header**

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: record SSL and security header results"
```

### Task 8: SEO — meta tags, sitemap, robots, OG

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: Check sitemap.xml**

```bash
curl -s -o /tmp/sitemap.xml -w "%{http_code}\n" https://archifex.space/sitemap.xml
head -40 /tmp/sitemap.xml
xmllint --noout /tmp/sitemap.xml && echo "valid XML" || echo "INVALID XML"
```

Expected: HTTP 200, valid XML, contains public route URLs in both locales.

- [ ] **Step 2: Check robots.txt**

```bash
curl -s https://archifex.space/robots.txt
```

Expected: contains `Disallow: /admin` at minimum. `/logos` should also be disallowed per spec §4.8.

- [ ] **Step 3: Check meta tags on homepage**

Use WebFetch tool with URL `https://archifex.space/en` and prompt: "Report the values of `<title>`, `<meta name='description'>`, `<meta property='og:title'>`, `<meta property='og:description'>`, `<meta property='og:image'>`, `<meta property='og:url'>`, `<meta property='og:type'>`, and any `<meta name='twitter:*'>` tags. Also check if there is a `<link rel='icon'>` tag."

Expected: all tags present, no empty values, `og:image` is a full URL.

- [ ] **Step 4: Verify OG image resolves**

Take the `og:image` URL from step 3 and fetch it:

```bash
curl -s -o /tmp/og.png -w "%{http_code} %{size_download}\n" "<og:image URL>"
file /tmp/og.png
```

Expected: HTTP 200, file is a PNG/JPEG with reasonable size (> 10 KB).

- [ ] **Step 5: Repeat meta tag check on /en/portfolio and /en/portfolio/[slug]**

Use WebFetch on each. Record whether page-specific meta descriptions exist or fall back to site default.

- [ ] **Step 6: Append findings rows for §4.8**

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: record SEO meta/sitemap/robots/OG results"
```

### Task 9: VPS container health + persistence

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

This task requires SSH access to the VPS. If Denis is not available to approve SSH commands, mark all §4.18 rows as `skip` with note "pending VPS access" and move on; they can be re-verified later.

- [ ] **Step 1: SSH to VPS and list containers**

```bash
ssh root@archifex.space 'cd /opt/archifex/deploy && docker compose ps'
```

Expected: all services (nginx, app, api, db, certbot) listed with `running` / `healthy` status.

- [ ] **Step 2: Check uptime and resource usage**

```bash
ssh root@archifex.space 'cd /opt/archifex/deploy && docker compose top | head -30; free -m; df -h /var/lib/docker'
```

Expected: no container has restarted recently (check STARTED column), memory not fully pegged, disk not full.

- [ ] **Step 3: Verify certbot last-renewal**

```bash
ssh root@archifex.space 'cd /opt/archifex/deploy && docker compose logs certbot --tail 30'
```

Expected: renewal attempts are happening every ~12 hours, no errors.

- [ ] **Step 4: Append findings rows for §4.18**

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: record VPS container health results"
```

### Task 10: Block type rendering check

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: List all block types present in the DB**

```bash
curl -s https://archifex.space/api/public/portfolio | jq -r '.data[].slug' | while read slug; do
  echo "=== $slug ==="
  curl -s "https://archifex.space/api/public/portfolio/$slug" | jq -r '.data.blocks[].type' | sort -u
done
```

Record which block types appear across the published portfolio. Spec §4.3 lists: TEXT, GALLERY, EMBED, CODE, METRICS, TESTIMONIAL.

- [ ] **Step 2: For every block type found, verify it renders in the frontend**

For each slug that uses a given block type, use WebFetch to load `https://archifex.space/en/portfolio/<slug>` and confirm the block's content appears in the HTML. For GALLERY, confirm image src attributes resolve (HTTP 200 on a sample). For EMBED, confirm the URL appears in the rendered page.

- [ ] **Step 3: Record "block type X renders correctly" as one row per type in §4.3**

For any block type listed in §4.3 but not present in any DB record, record as `skip` with note "no DB data to test against" — severity `content` (suggests seeded portfolio is missing examples of this block type).

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: record block type rendering results"
```

### Task 11: Logos tool functional check

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: Create a throwaway session and verify each endpoint**

```bash
SID=$(curl -s -X POST https://archifex.space/api/public/logos/sessions \
  -H "Content-Type: application/json" \
  -d '{"label":"audit-test"}' | jq -r '.data.id')
echo "Created session: $SID"

curl -s -o /dev/null -w "GET session %{http_code}\n" "https://archifex.space/api/public/logos/sessions/$SID"

curl -s -o /dev/null -w "PUT label %{http_code}\n" -X PUT \
  "https://archifex.space/api/public/logos/sessions/$SID" \
  -H "Content-Type: application/json" -d '{"label":"audit-test-renamed"}'

curl -s -o /dev/null -w "POST rate %{http_code}\n" -X POST \
  "https://archifex.space/api/public/logos/sessions/$SID/rate" \
  -H "Content-Type: application/json" -d '{"logo_id":1,"score":7}'

curl -s -o /dev/null -w "POST favorite %{http_code}\n" -X POST \
  "https://archifex.space/api/public/logos/sessions/$SID/favorite" \
  -H "Content-Type: application/json" -d '{"logo_id":1,"is_favorite":true}'

curl -s -o /dev/null -w "POST compare %{http_code}\n" -X POST \
  "https://archifex.space/api/public/logos/sessions/$SID/compare" \
  -H "Content-Type: application/json" -d '{"winner":1,"loser":2}'

curl -s "https://archifex.space/api/public/logos/sessions/$SID" | jq '.data'
```

Expected: all endpoints 200. Final GET shows the rating, the favorite, and `comparison_count: 1`.

- [ ] **Step 2: Verify stats endpoint reflects the new data**

```bash
curl -s https://archifex.space/api/public/logos/stats | jq '.data[] | select(.logo_id == 1)'
```

Expected: logo 1 has vote_count >= 1.

- [ ] **Step 3: Verify input validation rejects bad data**

```bash
curl -s -o /dev/null -w "bad logo_id %{http_code}\n" -X POST \
  "https://archifex.space/api/public/logos/sessions/$SID/rate" \
  -H "Content-Type: application/json" -d '{"logo_id":999,"score":5}'

curl -s -o /dev/null -w "bad score %{http_code}\n" -X POST \
  "https://archifex.space/api/public/logos/sessions/$SID/rate" \
  -H "Content-Type: application/json" -d '{"logo_id":1,"score":50}'

curl -s -o /dev/null -w "self-compare %{http_code}\n" -X POST \
  "https://archifex.space/api/public/logos/sessions/$SID/compare" \
  -H "Content-Type: application/json" -d '{"winner":1,"loser":1}'
```

Expected: all three return 400 (validation error).

- [ ] **Step 4: Verify all 30 SVG files serve from /logos/**

```bash
for i in $(seq -w 01 30); do
  RESP=$(curl -s -o /dev/null -w "%{http_code}" "https://archifex.space/logos/${i}-*.svg" 2>/dev/null || echo "000")
  echo "logo $i: $RESP"
done
```

If wildcard doesn't work in curl, list local SVGs and test each:

```bash
cd "E:/Projects/000 - Personal/002 - Portfolio Project/app/public/logos"
ls *.svg | while read f; do
  curl -s -o /dev/null -w "$f %{http_code}\n" "https://archifex.space/logos/$f"
done
```

Expected: all 30 return 200.

- [ ] **Step 5: Append findings rows for §4.5 logos claims**

- [ ] **Step 6: Commit**

```bash
cd "E:/Projects/000 - Personal/002 - Portfolio Project"
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: record logos tool functional check results"
```

### Task 12: Content presence check (is seed data real?)

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: Dump portfolio titles and summaries**

```bash
curl -s https://archifex.space/api/public/portfolio | jq -r '.data[] | "\(.slug): \(.title_en) / \(.title_ru)\n  summary_en: \(.summary_en)\n  summary_ru: \(.summary_ru)"'
```

Scan for: Lorem ipsum, "placeholder", "TODO", empty strings, obviously fake company names. Anything suspicious → severity `content`.

- [ ] **Step 2: Dump package titles, descriptions, prices**

```bash
curl -s https://archifex.space/api/public/packages | jq '.data[] | {slug, title_en, title_ru, price, duration}'
```

Verify prices are realistic (match Denis's price list) and durations are sensible.

- [ ] **Step 3: Dump style names and references**

```bash
curl -s https://archifex.space/api/public/styles | jq '.data[] | {slug, name_en, name_ru, references: [.references[] | {url, label_en, type, embeddable}]}'
```

Check that references have real labels, URLs are https, and types match (OWN_PROJECT / DEMO / EXTERNAL).

- [ ] **Step 4: Dump site content**

```bash
curl -s https://archifex.space/api/public/content | jq '.data[] | {key, value_en, value_ru}'
```

Same Lorem-ipsum / placeholder scan.

- [ ] **Step 5: Dump quiz root question**

```bash
curl -s https://archifex.space/api/public/quiz/root | jq '.data | {question_en, question_ru, options: [.options[] | {label_en, label_ru}]}'
```

Check question text is Denis's voice.

- [ ] **Step 6: Append findings rows — one per content area with result pass/fail + Notes describing any placeholder strings found**

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: record content presence check results"
```

### Task 13: Lead submission end-to-end

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: Submit a test lead**

```bash
# Find a RESULT node first
ROOT=$(curl -s https://archifex.space/api/public/quiz/root | jq -r '.data.id')
# For this audit, we can pass any result_node_id that exists. Reuse the root ID if tree leaves are hard to find — the API should still accept the payload.

curl -s -X POST https://archifex.space/api/public/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AUDIT TEST — delete me",
    "email": "audit@archifex.test",
    "phone": null,
    "message": "phase 1 audit, 2026-04-20",
    "result_node_id": "'$ROOT'",
    "style_id": null,
    "package_id": null,
    "answers": {}
  }' | jq '.'
```

Expected: HTTP 200, returned lead record with `id`.

- [ ] **Step 2: Verify lead appears in admin list (requires auth from Task 3)**

Re-authenticate with credentials from Task 3, then:

```bash
curl -s -b /tmp/archifex-cookies.txt https://archifex.space/api/admin/leads | jq '.data[] | select(.email == "audit@archifex.test")'
```

Expected: the test lead appears with `status: "new"`.

- [ ] **Step 3: Delete the test lead to keep the admin clean**

```bash
LEAD_ID=$(curl -s -b /tmp/archifex-cookies.txt https://archifex.space/api/admin/leads | jq -r '.data[] | select(.email == "audit@archifex.test") | .id')
curl -s -X DELETE -b /tmp/archifex-cookies.txt -o /dev/null -w "%{http_code}\n" \
  "https://archifex.space/api/admin/leads/$LEAD_ID"
rm -f /tmp/archifex-cookies.txt
```

Expected: HTTP 204 or 200.

- [ ] **Step 4: Append findings rows for §4.4 lead submission + §4.11 leads admin**

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: record lead submission E2E results"
```

### Task 14: Update findings summary counts

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: Count findings by result and severity**

Open `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md` and replace the "Summary" section TBDs with real counts based on the table:

```markdown
## Summary (filled in after Pass 2)

- Total claims: NN
- Passed: NN
- Failed — bug: NN
- Failed — content: NN
- Failed — polish: NN
- Skipped / deferred: NN
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: finalize Pass 2a summary counts"
```

---

## Phase C — Pass 2b: Manual Verification (Denis)

### Task 15: Generate Denis walk-through guide

**Files:**
- Create: `docs/superpowers/specs/2026-04-20-phase1-audit-walkthrough.md`

- [ ] **Step 1: Write the walk-through doc**

Create `docs/superpowers/specs/2026-04-20-phase1-audit-walkthrough.md` with this content:

```markdown
# Phase 1 Audit — Manual Walk-Through for Denis

> Claims from the audit spec that need human judgment. Work through each, mark pass/fail, add notes. Claude will transfer these into the findings log.

**Date:** 2026-04-20
**Approx time:** 45-60 minutes
**Devices needed:** laptop + phone

## Setup

1. Open https://archifex.space on laptop
2. Open https://archifex.space on phone (real device, not DevTools)
3. Have notes app open

## Checklist

### A. Homepage (both locales)

- [ ] EN hero copy is your real voice, not placeholder or AI-generated filler
- [ ] RU hero copy is your real voice, not machine-translated gibberish
- [ ] Portfolio grid shows projects you're proud of (not stale/wrong ones)
- [ ] Quiz CTA copy sells the idea (vs being generic)
- [ ] On phone, hero + CTAs are usable, nothing cut off

### B. Portfolio grid + case studies

- [ ] Every published project is a project you actually did
- [ ] Every project has correct dates, stack, outcome
- [ ] Case study blocks tell a real story — no placeholder sections
- [ ] Galleries have real images, no broken / missing
- [ ] Embeds render correctly (where used)
- [ ] On phone, case study reads well (no horizontal scroll, images fit)

### C. Quiz flow

Walk every branch from root to a leaf. You know the tree best.

- [ ] Every question phrasing is natural, matches your sales voice
- [ ] Every option is distinct and meaningful (no "A and B are basically the same")
- [ ] Every RESULT leaf recommends a style + package that genuinely fits the path taken
- [ ] Result page preview cards show the right references for the recommended style
- [ ] Result CTA copy compels to submit a lead

### D. Admin panel

- [ ] Login is smooth — no errors, no double-click needed
- [ ] Dashboard stats are accurate (check against DB if in doubt)
- [ ] Leads list — you can find a specific lead and update status without friction
- [ ] Portfolio editor — creating a new project + adding all 6 block types is doable without checking code
- [ ] Block editor — reorder, edit, delete blocks feels responsive
- [ ] Quiz tree editor — can edit a question and add a new option without breaking the tree
- [ ] Styles editor — screenshot capture works (try one new URL)
- [ ] Packages editor — create, reorder, toggle-active, delete all work
- [ ] Content CMS — can edit a site-content key and see the change reflected on the public page
- [ ] Settings — profile edit + password change both work

### D2. Error / empty / loading states

- [ ] Disconnect from internet briefly and reload a public page — does it degrade gracefully or white-screen?
- [ ] Visit a non-existent route (e.g., /en/portfolio/does-not-exist) — is there a real 404 page?
- [ ] In admin, delete everything from a list temporarily (or visit a fresh filter) — does the empty state look intentional?
- [ ] Slow network throttle in DevTools — do loading states show up, or does the page just look broken for a beat?

### E. Themes

- [ ] Light / dark toggle works and looks good on every page you visit
- [ ] Comfort mode (larger text, reduced motion) is actually useful, not just bigger
- [ ] Theme preference persists across navigation
- [ ] Theme preference persists across reload

### F. Mobile (real phone, not DevTools)

- [ ] Home, portfolio, case study, quiz — all readable and tappable on 5-6" phone
- [ ] Quiz buttons have enough tap area (thumb-friendly)
- [ ] Admin on phone: usable for checking leads / quick edits? (Nice-to-have, not P1 critical)
- [ ] /logos rating flow is smooth on phone (this is the main use case for voting)

### G. /logos rating tool

- [ ] Intro banner shows + dismisses
- [ ] Rating feels fast (keyboard or tap)
- [ ] Compare mode picks good pairs, records votes
- [ ] Results tab (global / by-voter / just-mine) shows expected data
- [ ] Share button works on phone

### H. Anything that bothers you that I haven't listed

Free-form notes:

-
-
-

## What to do with this

After you finish, hand the file back to Claude (or paste your notes into chat). Claude will:

1. Transfer each finding into the main findings log
2. Classify severity (bug / content / polish)
3. Propose fixes
```

- [ ] **Step 2: Commit the walk-through**

```bash
git add docs/superpowers/specs/2026-04-20-phase1-audit-walkthrough.md
git commit -m "docs: add Phase 1 audit manual walk-through for Denis"
```

- [ ] **Step 3: Hand off to Denis**

Tell Denis:
> "Walk-through ready at `docs/superpowers/specs/2026-04-20-phase1-audit-walkthrough.md`. Takes ~45-60 min, needs laptop + real phone. Mark pass/fail in the file and share notes when done. I'll merge findings into the log."

Pause here until Denis completes the walk-through.

### Task 16: Merge Denis's walk-through into findings log

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: For each marked item in the walk-through, add a row to the findings log**

Use the same schema. Map §A–§H of the walk-through to the relevant spec §4.x subsection. Classify severity based on what Denis wrote.

- [ ] **Step 2: Update the Summary counts**

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: merge manual walk-through findings"
```

---

## Phase D — Triage Checkpoint

### Task 17: Triage checkpoint

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-phase1-audit-findings.md`

- [ ] **Step 1: Review every `fail` row and confirm its severity**

Open the findings log. For each `fail` row, ask:
- **bug:** Does this block a visitor or an admin from completing a task? Does it return wrong data? → `bug`
- **content:** Does the feature technically work, but the content is placeholder, missing, or wrong voice? → `content`
- **polish:** Does it work and the content is real, but UX/visual is rough? → `polish`
- **deferred:** Is this a gap we're consciously accepting for now? → `deferred` (rare)

Adjust severity where needed. Re-commit.

- [ ] **Step 2: Group findings by severity**

At the bottom of the findings log, add three tables:

```markdown
## Pass 3 Work Queue

### Bugs (fix first)
| # | Area | Summary |
|---|------|---------|
| … | … | … |

### Content (fix next)
| # | Area | Summary |
|---|------|---------|

### Polish (fix last, batch possible)
| # | Area | Summary |
|---|------|---------|
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-20-phase1-audit-findings.md
git commit -m "audit: triage findings into Pass 3 work queue"
```

- [ ] **Step 4: Halt for re-planning**

**Stop executing this plan here.** The remaining phases (D2 fixes) need a concrete fix-task list derived from actual findings. After the work queue is populated, the next step is to re-enter the writing-plans skill to produce `docs/superpowers/plans/2026-04-20-phase1-fixes.md` — one task per finding or per tight group — with real code changes, not placeholders.

---

## Phase E — Pass 3: Fix Bugs, Content, Polish

This phase is **intentionally empty** in this plan. The fix tasks are written after triage, in a separate fixes plan, because their content depends on what Pass 2 found. That separate plan will:

1. Have one task per `bug` finding (or tightly-grouped set) — exact file paths, exact code changes, verify command.
2. Have one task per `content` finding — exact file(s) to edit with the new content.
3. Have one task per `polish` finding — exact design/UX change.
4. End with a final task: update `CLAUDE.md` to reflect the audited Phase 1 state.

After the fixes plan is written, execution resumes on that plan.

---

## Verification (of this audit plan)

- [ ] All Phase A-C tasks completed; findings log has a row for every spec §4 claim
- [ ] Summary counts in findings log match actual table rows
- [ ] Denis's walk-through notes fully merged
- [ ] Triage complete — every `fail` row has a confirmed severity
- [ ] Pass 3 work queue populated at the bottom of findings log
- [ ] A new plan `2026-04-20-phase1-fixes.md` is written before any fix work begins
