# P002 Portfolio — Live Website Preview Spec

> Interactive website previews on the quiz result page. Iframe-first with screenshot fallback. 10 style demo pages.

**Date:** 2026-04-13
**Status:** Approved (brainstorming complete)

---

## 1. Overview

The quiz result page recommends a visual style to the client, showing reference websites that represent that style. Currently the references are iframe embeds pointing to sites like apple.com and stripe.com, which block iframes — resulting in blank boxes.

This spec adds:
1. A **Browser Preview component** that renders references as iframes (if the site allows it) or scrollable screenshots (if it doesn't), inside a realistic browser chrome frame
2. A **screenshot capture system** in the Go API using headless Chrome, with admin panel controls
3. **10 interactive demo pages** showcasing each style, hosted as static HTML

### Success Criteria

- Every style reference on the quiz result page shows either a working iframe or a scrollable screenshot — never a blank box
- Admin can capture screenshots and toggle embeddable status per reference
- 10 demo pages are live, interactive, and visually distinct per style

---

## 2. Browser Preview Component

### `<BrowserPreview>`

A reusable client component that displays a website inside a browser chrome frame.

**Visual structure:**
```
┌──────────────────────────────────────────────┐
│  ● ● ●    https://stripe.com            ↗   │  ← chrome bar (dots, URL, external link icon)
├──────────────────────────────────────────────┤
│                                              │
│          [iframe or screenshot]              │  ← content area, fixed height ~400px
│          rendered at scale(0.6)              │  ← zoomed out to show full width
│          overflow-y: auto (scrollable)       │
│                                              │
└──────────────────────────────────────────────┘
```

**Props:**
```typescript
type BrowserPreviewProps = {
  url: string;
  label: string;
  screenshotUrl: string | null;
  embeddable: boolean;
};
```

**Rendering logic:**
1. If `embeddable === true` → render `<iframe src={url}>` inside the frame. Full interactivity — user can scroll, hover, click within the iframe.
2. If `embeddable === false` and `screenshotUrl` exists → render `<img src={screenshotUrl}>` inside the frame. Image is full-width, container scrolls vertically.
3. If neither → render a styled placeholder with the site's favicon/domain and a "Visit Site →" button.

**Scale trick:** The content area is a fixed-size container (e.g., 700×400px visible). For **screenshots**, the image is rendered at full width (1440px) and scaled down with CSS `transform: scale(0.6); transform-origin: top left`, giving a zoomed-out overview. For **iframes**, use the same scale approach but set the iframe dimensions to `width: 1440px; height: 900px` inside a `pointer-events: auto` wrapper so all interactions work at the original scale — the CSS transform only affects visual size, not click targets.

**External link:** The ↗ icon in the chrome bar opens `url` in a new tab.

**File:** `app/src/components/ui/browser-preview.tsx`

### Integration on Quiz Result Page

Replace the current iframe grid in `app/src/components/quiz/quiz-result.tsx` (lines 81-119) with `<BrowserPreview>` cards. The style references already come from the API with `url`, `label_en`, `label_ru`. We add `screenshot_url` and `embeddable` to the API response.

---

## 3. Screenshot System

### Database Changes

Add two columns to the `style_references` table:

```sql
ALTER TABLE style_references ADD COLUMN screenshot_url TEXT;
ALTER TABLE style_references ADD COLUMN embeddable BOOLEAN NOT NULL DEFAULT false;
```

Migration file: `api/migrations/003_screenshot_fields.up.sql`

### Go API Changes

**New endpoint:** `POST /api/admin/screenshot`

Request:
```json
{
  "url": "https://stripe.com",
  "reference_id": "ref-minimalist-1"
}
```

Response:
```json
{
  "data": {
    "screenshot_url": "/uploads/screenshots/stripe-com.png",
    "embeddable": false
  }
}
```

**Implementation:**
1. Use `chromedp` Go library to launch headless Chrome
2. Navigate to the URL, wait for page load
3. Capture full-page screenshot as PNG
4. Save to `{UPLOAD_PATH}/screenshots/{sanitized-domain}.png`
5. Check response headers for `X-Frame-Options` and `Content-Security-Policy: frame-ancestors` to determine `embeddable`
6. Update the style reference record with `screenshot_url` and `embeddable`
7. Return the result

**New Go dependency:** `github.com/chromedp/chromedp`

**VPS requirement:** Chromium must be installed on the VPS. Add to setup: `apt install -y chromium-browser`

**New internal package:** `api/internal/screenshot/` with handler + service following the existing entity pattern.

### Embeddability Check

Done as part of the screenshot capture (not a separate endpoint):

```go
func checkEmbeddable(url string) bool {
    resp, err := http.Head(url)
    if err != nil {
        return false
    }
    // Check X-Frame-Options
    xfo := resp.Header.Get("X-Frame-Options")
    if xfo == "DENY" || xfo == "SAMEORIGIN" {
        return false
    }
    // Check CSP frame-ancestors
    csp := resp.Header.Get("Content-Security-Policy")
    if strings.Contains(csp, "frame-ancestors") {
        return false // simplified check
    }
    return true
}
```

### Admin Panel

In the style reference editor (within the styles admin page):

- Each reference row shows: URL input, label inputs, type dropdown, **screenshot thumbnail** (if captured), **"Capture" button**, **"Upload" button**, **embeddable toggle**
- "Capture" button: calls `POST /api/admin/screenshot` with the URL, shows loading spinner, updates thumbnail and embeddable on success
- "Upload" button: standard file upload, sets `screenshot_url` to the uploaded path
- Embeddable toggle: manual override (checkbox)

### Public API Changes

The existing `GET /api/public/styles` and `GET /api/public/styles/:id` responses include references. Add `screenshot_url` and `embeddable` to the reference objects:

```json
{
  "id": "ref-minimalist-1",
  "url": "https://stripe.com",
  "label_en": "Stripe",
  "label_ru": "Stripe",
  "type": "EXTERNAL",
  "screenshot_url": "/uploads/screenshots/stripe-com.png",
  "embeddable": false
}
```

---

## 4. Demo Pages

10 self-contained HTML files served as static assets. Each is a single-file landing page demonstrating a visual style with some interactivity.

### Hosting

Files live in `app/public/demos/`. Next.js serves them as static files at `/demos/<name>.html`. No build step, no framework — just HTML + CSS + JS in one file.

### Demo Lineup

| # | Style | Name | Description | Interactivity |
|---|-------|------|-------------|---------------|
| 1 | Minimalist | `swiss-typography` | Clean grid, whitespace, system fonts, monochrome | Smooth scroll, subtle hover states |
| 2 | Minimalist | `product-showcase` | Single product hero, minimal palette, big imagery | Parallax on scroll |
| 3 | Minimalist | `dev-portfolio` | Monospace, terminal aesthetic, dark background | Typing animation in hero |
| 4 | Bold & Modern | `agency-landing` | Big type, vivid gradients, asymmetric layout | Scroll-triggered fade-ins |
| 5 | Bold & Modern | `saas-dashboard` | Dark UI, neon accents, feature cards, metrics | Hover card effects, animated counters |
| 6 | Corporate Classic | `consulting-firm` | Navy + gold, serif headings, trust badges | Accordion FAQ, smooth scroll |
| 7 | Corporate Classic | `financial-services` | Data-heavy, charts, professional, structured | Animated chart counters on scroll |
| 8 | Creative & Experimental | `particle-constellation` | Adapted from `090 - Claude/garden/constellations.html` | Full canvas, mouse interaction |
| 9 | Creative & Experimental | `fluid-art` | Adapted from `090 - Claude/garden/fluid.html` or similar | Full canvas, mouse interaction |
| 10 | Creative & Experimental | `architectural-blueprint` | Blueprint theme matching archifex.space — grid lines, dimensions | SVG animations, hover reveals |

### Database Seeding

After demos are built, add them as OWN_PROJECT style references:
- URL: `https://archifex.space/demos/<name>.html`
- `embeddable: true` (we control the headers)
- `screenshot_url`: captured via the screenshot system

Each style gets 2-3 demo references + 1-2 external references (with screenshots).

---

## 5. Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `api/migrations/003_screenshot_fields.up.sql` | Add screenshot_url and embeddable columns |
| `api/migrations/003_screenshot_fields.down.sql` | Rollback migration |
| `api/internal/screenshot/handler.go` | Screenshot capture HTTP handler |
| `api/internal/screenshot/service.go` | chromedp screenshot logic + embeddability check |
| `app/src/components/ui/browser-preview.tsx` | Browser chrome frame preview component |
| `app/public/demos/*.html` | 10 demo pages (one file each) |

### Modified Files

| File | Change |
|------|--------|
| `api/cmd/api/main.go` | Register screenshot routes |
| `api/go.mod` | Add chromedp dependency |
| `api/internal/styles/models.go` | Add ScreenshotURL, Embeddable fields to reference model |
| `api/internal/styles/service.go` | Include new fields in queries |
| `app/src/components/quiz/quiz-result.tsx` | Replace iframe grid with BrowserPreview cards |

---

## 6. Build Order

1. **Part 2: Screenshot System** — migration, Go endpoint, chromedp, admin panel updates
2. **Part 1: Browser Preview Component** — frontend component, quiz result page integration
3. **Part 3: Demo Pages** — build 10 HTML demos, seed as style references, capture screenshots

Parts 1 and 2 can be built in parallel (backend + frontend). Part 3 comes after both are working.

---

## 7. Verification

1. Quiz result page shows BrowserPreview cards for all style references — no blank boxes
2. Own demo pages render as fully interactive iframes
3. External sites that block iframes show scrollable screenshots
4. Admin can click "Capture" to auto-screenshot any URL
5. Admin can manually upload/override screenshots
6. Admin can toggle embeddable flag
7. All 10 demo pages load at `/demos/<name>.html` with working interactivity
8. Mobile responsive: preview cards stack vertically, browser chrome scales down
