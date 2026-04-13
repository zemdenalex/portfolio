# Live Website Preview — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace broken iframe previews on the quiz result page with a Browser Preview component that shows iframes for embeddable sites and scrollable screenshots for sites that block iframes. Add screenshot capture to the Go API and build 10 interactive demo pages.

**Architecture:** Three parts — (1) Go API screenshot endpoint using chromedp + DB migration for screenshot_url/embeddable fields on style_references, (2) BrowserPreview React component with browser chrome frame + quiz result page integration, (3) 10 static HTML demo pages in app/public/demos/. Parts 1+2 are independent and can be built in parallel. Part 3 depends on both.

**Tech Stack:** Go (chromedp), PostgreSQL (ALTER TABLE), Next.js/React (client component), static HTML/CSS/JS (demo pages)

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Create | `api/migrations/003_screenshot_fields.up.sql` | Add screenshot_url + embeddable columns |
| Create | `api/migrations/003_screenshot_fields.down.sql` | Rollback migration |
| Create | `api/internal/screenshot/service.go` | chromedp screenshot capture + embeddability check |
| Create | `api/internal/screenshot/handler.go` | HTTP handler for POST /api/admin/screenshot |
| Create | `app/src/components/ui/browser-preview.tsx` | Browser chrome frame preview component |
| Create | `app/public/demos/swiss-typography.html` | Demo: Minimalist — clean grid, whitespace |
| Create | `app/public/demos/product-showcase.html` | Demo: Minimalist — single product hero |
| Create | `app/public/demos/dev-portfolio.html` | Demo: Minimalist — terminal aesthetic |
| Create | `app/public/demos/agency-landing.html` | Demo: Bold — big type, gradients |
| Create | `app/public/demos/saas-dashboard.html` | Demo: Bold — dark UI, neon accents |
| Create | `app/public/demos/consulting-firm.html` | Demo: Corporate — navy + gold, serif |
| Create | `app/public/demos/financial-services.html` | Demo: Corporate — data-heavy, charts |
| Create | `app/public/demos/particle-constellation.html` | Demo: Creative — adapted from Claude garden |
| Create | `app/public/demos/fluid-art.html` | Demo: Creative — fluid simulation |
| Create | `app/public/demos/architectural-blueprint.html` | Demo: Creative — blueprint/archifex theme |
| Modify | `api/internal/styles/models.go` | Add ScreenshotURL + Embeddable to StyleReference |
| Modify | `api/internal/styles/service.go` | Update queries to include new fields |
| Modify | `api/cmd/api/main.go` | Register screenshot handler + route |
| Modify | `api/go.mod` / `api/go.sum` | Add chromedp dependency |
| Modify | `app/src/components/quiz/quiz-result.tsx` | Replace iframe grid with BrowserPreview |
| Modify | `app/src/components/admin/style-editor.tsx` | Add Capture/Upload buttons + embeddable toggle |
| Modify | `app/src/app/admin/styles/page.tsx` | Update StyleRefData type with new fields |

---

### Task 1: Database migration — add screenshot fields

**Files:**
- Create: `api/migrations/003_screenshot_fields.up.sql`
- Create: `api/migrations/003_screenshot_fields.down.sql`

- [ ] **Step 1: Write up migration**

Create `api/migrations/003_screenshot_fields.up.sql`:

```sql
ALTER TABLE style_references ADD COLUMN screenshot_url TEXT;
ALTER TABLE style_references ADD COLUMN embeddable BOOLEAN NOT NULL DEFAULT false;
```

- [ ] **Step 2: Write down migration**

Create `api/migrations/003_screenshot_fields.down.sql`:

```sql
ALTER TABLE style_references DROP COLUMN IF EXISTS screenshot_url;
ALTER TABLE style_references DROP COLUMN IF EXISTS embeddable;
```

- [ ] **Step 3: Commit**

```bash
git add api/migrations/003_screenshot_fields.up.sql api/migrations/003_screenshot_fields.down.sql
git commit -m "feat: add screenshot_url and embeddable columns to style_references"
```

---

### Task 2: Update styles models and queries

**Files:**
- Modify: `api/internal/styles/models.go`
- Modify: `api/internal/styles/service.go`

- [ ] **Step 1: Add fields to StyleReference model**

In `api/internal/styles/models.go`, update the `StyleReference` struct to include the new columns:

```go
type StyleReference struct {
	ID            string  `json:"id"`
	StyleID       string  `json:"style_id"`
	URL           string  `json:"url"`
	LabelEn       string  `json:"label_en"`
	LabelRu       string  `json:"label_ru"`
	Type          string  `json:"type"`
	SortOrder     int     `json:"sort_order"`
	ScreenshotURL *string `json:"screenshot_url"`
	Embeddable    bool    `json:"embeddable"`
}
```

- [ ] **Step 2: Update getRefs query in service.go**

In `api/internal/styles/service.go`, update the `getRefs` method. Change the query and scan to include the new columns:

```go
func (s *Service) getRefs(ctx context.Context, styleID string) ([]StyleReference, error) {
	rows, err := s.db.Query(ctx,
		"SELECT id, style_id, url, label_en, label_ru, type, sort_order, screenshot_url, embeddable FROM style_references WHERE style_id = $1 ORDER BY sort_order",
		styleID,
	)
	if err != nil {
		return nil, fmt.Errorf("get refs: %w", err)
	}
	defer rows.Close()

	var refs []StyleReference
	for rows.Next() {
		var ref StyleReference
		if err := rows.Scan(&ref.ID, &ref.StyleID, &ref.URL, &ref.LabelEn, &ref.LabelRu, &ref.Type, &ref.SortOrder, &ref.ScreenshotURL, &ref.Embeddable); err != nil {
			return nil, fmt.Errorf("scan ref: %w", err)
		}
		refs = append(refs, ref)
	}

	if refs == nil {
		refs = []StyleReference{}
	}

	return refs, nil
}
```

- [ ] **Step 3: Update CreateRef to return new fields**

In `api/internal/styles/service.go`, update the `CreateRef` method INSERT + RETURNING to include the new columns:

```go
func (s *Service) CreateRef(ctx context.Context, req *CreateRefRequest) (*StyleReference, error) {
	var ref StyleReference
	err := s.db.QueryRow(ctx,
		`INSERT INTO style_references (style_id, url, label_en, label_ru, type, sort_order)
		 VALUES ($1, $2, $3, $4, $5, COALESCE((SELECT MAX(sort_order) + 1 FROM style_references WHERE style_id = $1), 0))
		 RETURNING id, style_id, url, label_en, label_ru, type, sort_order, screenshot_url, embeddable`,
		req.StyleID, req.URL, req.LabelEn, req.LabelRu, req.Type,
	).Scan(&ref.ID, &ref.StyleID, &ref.URL, &ref.LabelEn, &ref.LabelRu, &ref.Type, &ref.SortOrder, &ref.ScreenshotURL, &ref.Embeddable)
	if err != nil {
		return nil, fmt.Errorf("create ref: %w", err)
	}

	return &ref, nil
}
```

- [ ] **Step 4: Add UpdateRefScreenshot method to service**

Add a new method to update screenshot fields on a reference. This will be called by the screenshot handler.

```go
func (s *Service) UpdateRefScreenshot(ctx context.Context, refID string, screenshotURL string, embeddable bool) error {
	tag, err := s.db.Exec(ctx,
		"UPDATE style_references SET screenshot_url = $2, embeddable = $3 WHERE id = $1",
		refID, screenshotURL, embeddable,
	)
	if err != nil {
		return fmt.Errorf("update ref screenshot: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrRefNotFound
	}
	return nil
}
```

- [ ] **Step 5: Verify Go builds**

Run: `cd api && go build ./cmd/api`

Expected: Build succeeds (migration hasn't run yet but code compiles).

- [ ] **Step 6: Commit**

```bash
git add api/internal/styles/models.go api/internal/styles/service.go
git commit -m "feat: add screenshot_url and embeddable to style reference model and queries"
```

---

### Task 3: Screenshot service — chromedp + embeddability check

**Files:**
- Create: `api/internal/screenshot/service.go`
- Modify: `api/go.mod`

- [ ] **Step 1: Add chromedp dependency**

```bash
cd api && go get github.com/chromedp/chromedp
```

- [ ] **Step 2: Create screenshot service**

Create `api/internal/screenshot/service.go`:

```go
package screenshot

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/chromedp/chromedp"
)

type Service struct {
	uploadPath string
}

func NewService(uploadPath string) *Service {
	return &Service{uploadPath: uploadPath}
}

type CaptureResult struct {
	ScreenshotURL string `json:"screenshot_url"`
	Embeddable    bool   `json:"embeddable"`
}

func (s *Service) Capture(ctx context.Context, targetURL string) (*CaptureResult, error) {
	// Check embeddability via HEAD request
	embeddable := checkEmbeddable(targetURL)

	// Create screenshots directory
	screenshotDir := filepath.Join(s.uploadPath, "screenshots")
	if err := os.MkdirAll(screenshotDir, 0o755); err != nil {
		return nil, fmt.Errorf("create screenshot dir: %w", err)
	}

	// Generate filename from URL
	filename := sanitizeURL(targetURL) + ".png"
	filePath := filepath.Join(screenshotDir, filename)

	// Set up headless Chrome
	allocCtx, allocCancel := chromedp.NewExecAllocator(ctx,
		append(chromedp.DefaultExecAllocatorOptions[:],
			chromedp.Flag("headless", true),
			chromedp.Flag("no-sandbox", true),
			chromedp.Flag("disable-gpu", true),
			chromedp.WindowSize(1440, 900),
		)...,
	)
	defer allocCancel()

	taskCtx, taskCancel := chromedp.NewContext(allocCtx)
	defer taskCancel()

	// Set timeout for the capture
	taskCtx, cancel := context.WithTimeout(taskCtx, 30*time.Second)
	defer cancel()

	// Capture full page screenshot
	var buf []byte
	err := chromedp.Run(taskCtx,
		chromedp.Navigate(targetURL),
		chromedp.Sleep(2*time.Second),
		chromedp.FullScreenshot(&buf, 90),
	)
	if err != nil {
		return nil, fmt.Errorf("capture screenshot: %w", err)
	}

	// Save to disk
	if err := os.WriteFile(filePath, buf, 0o644); err != nil {
		return nil, fmt.Errorf("save screenshot: %w", err)
	}

	screenshotURL := "/uploads/screenshots/" + filename

	return &CaptureResult{
		ScreenshotURL: screenshotURL,
		Embeddable:    embeddable,
	}, nil
}

func checkEmbeddable(targetURL string) bool {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Head(targetURL)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	// Check X-Frame-Options
	xfo := strings.ToUpper(resp.Header.Get("X-Frame-Options"))
	if xfo == "DENY" || xfo == "SAMEORIGIN" {
		return false
	}

	// Check Content-Security-Policy frame-ancestors
	csp := resp.Header.Get("Content-Security-Policy")
	if strings.Contains(csp, "frame-ancestors") {
		return false
	}

	return true
}

func sanitizeURL(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil {
		return "unknown"
	}
	name := strings.ReplaceAll(u.Host, ".", "-")
	name = strings.ReplaceAll(name, ":", "-")
	if u.Path != "" && u.Path != "/" {
		path := strings.ReplaceAll(u.Path, "/", "-")
		path = strings.TrimPrefix(path, "-")
		path = strings.TrimSuffix(path, "-")
		if path != "" {
			name = name + "-" + path
		}
	}
	return name
}
```

- [ ] **Step 3: Verify Go builds**

Run: `cd api && go build ./cmd/api`

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add api/internal/screenshot/service.go api/go.mod api/go.sum
git commit -m "feat: add screenshot capture service with chromedp and embeddability check"
```

---

### Task 4: Screenshot handler + route registration

**Files:**
- Create: `api/internal/screenshot/handler.go`
- Modify: `api/cmd/api/main.go`

- [ ] **Step 1: Create screenshot handler**

Create `api/internal/screenshot/handler.go`:

```go
package screenshot

import (
	"encoding/json"
	"net/http"

	"portfolio-api/internal/response"
	"portfolio-api/internal/styles"
)

type Handler struct {
	service      *Service
	stylesService *styles.Service
}

func NewHandler(service *Service, stylesService *styles.Service) *Handler {
	return &Handler{
		service:      service,
		stylesService: stylesService,
	}
}

type CaptureRequest struct {
	URL         string `json:"url"`
	ReferenceID string `json:"reference_id"`
}

func (h *Handler) Capture(w http.ResponseWriter, r *http.Request) {
	var req CaptureRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	if req.URL == "" || req.ReferenceID == "" {
		response.BadRequest(w, "url and reference_id are required")
		return
	}

	result, err := h.service.Capture(r.Context(), req.URL)
	if err != nil {
		response.InternalError(w, "failed to capture screenshot: "+err.Error())
		return
	}

	// Update the style reference with screenshot data
	if err := h.stylesService.UpdateRefScreenshot(r.Context(), req.ReferenceID, result.ScreenshotURL, result.Embeddable); err != nil {
		response.InternalError(w, "screenshot captured but failed to update reference")
		return
	}

	response.JSON(w, http.StatusOK, result)
}
```

- [ ] **Step 2: Register screenshot handler and route in main.go**

In `api/cmd/api/main.go`, add the import:

```go
"portfolio-api/internal/screenshot"
```

After the existing handler initialization (around line 67), add:

```go
screenshotService := screenshot.NewService(cfg.Upload.Path)
screenshotHandler := screenshot.NewHandler(screenshotService, stylesService)
```

In the admin routes section (around line 170, after the Upload route), add:

```go
// Screenshot
r.Post("/screenshot", screenshotHandler.Capture)
```

- [ ] **Step 3: Verify Go builds**

Run: `cd api && go build ./cmd/api`

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add api/internal/screenshot/handler.go api/cmd/api/main.go
git commit -m "feat: add screenshot capture endpoint POST /api/admin/screenshot"
```

---

### Task 5: BrowserPreview component

**Files:**
- Create: `app/src/components/ui/browser-preview.tsx`

- [ ] **Step 1: Create the BrowserPreview component**

Create `app/src/components/ui/browser-preview.tsx`:

```tsx
"use client";

import { ExternalLink, Globe } from "lucide-react";

type BrowserPreviewProps = {
  url: string;
  label: string;
  screenshotUrl: string | null;
  embeddable: boolean;
};

export function BrowserPreview({
  url,
  label,
  screenshotUrl,
  embeddable,
}: BrowserPreviewProps) {
  const domain = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg-secondary shadow-sm">
      {/* Browser chrome bar */}
      <div className="flex items-center gap-2 border-b border-border bg-bg-tertiary px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
        </div>
        <div className="flex-1 truncate rounded bg-bg-primary px-3 py-1 text-xs text-text-muted">
          {domain}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-muted transition-colors hover:text-accent"
          title={`Open ${label}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Content area */}
      <div className="relative h-[400px] overflow-hidden bg-white">
        {embeddable ? (
          <IframePreview url={url} />
        ) : screenshotUrl ? (
          <ScreenshotPreview screenshotUrl={screenshotUrl} label={label} />
        ) : (
          <PlaceholderPreview url={url} label={label} domain={domain} />
        )}
      </div>
    </div>
  );
}

function IframePreview({ url }: { url: string }) {
  return (
    <div
      className="origin-top-left"
      style={{
        width: "1440px",
        height: "900px",
        transform: "scale(0.486)",
        transformOrigin: "top left",
      }}
    >
      <iframe
        src={url}
        title="Website preview"
        className="h-full w-full border-0"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

function ScreenshotPreview({
  screenshotUrl,
  label,
}: {
  screenshotUrl: string;
  label: string;
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div
        className="origin-top-left"
        style={{
          width: "1440px",
          transform: "scale(0.486)",
          transformOrigin: "top left",
        }}
      >
        <img
          src={screenshotUrl}
          alt={`Screenshot of ${label}`}
          className="w-full"
          loading="lazy"
        />
      </div>
    </div>
  );
}

function PlaceholderPreview({
  url,
  label,
  domain,
}: {
  url: string;
  label: string;
  domain: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-bg-tertiary p-8 text-center">
      <Globe className="h-12 w-12 text-text-muted" />
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted">{domain}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Visit Site
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
```

**Note on scale factor:** The container is ~700px wide (max-w-3xl on the result page). We render at 1440px and need to fit into ~700px, so `scale(700/1440) ≈ 0.486`. The height of 400px visible at this scale shows ~823px of the original content, which is about one viewport.

- [ ] **Step 2: Verify frontend builds**

Run: `cd app && npm run build`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/ui/browser-preview.tsx
git commit -m "feat: add BrowserPreview component with iframe/screenshot/placeholder modes"
```

---

### Task 6: Integrate BrowserPreview on quiz result page

**Files:**
- Modify: `app/src/components/quiz/quiz-result.tsx`

- [ ] **Step 1: Update style reference type and replace iframe grid**

In `app/src/components/quiz/quiz-result.tsx`, add `screenshot_url` and `embeddable` to the reference type inside `StyleData`:

```typescript
type StyleData = {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  references: {
    id: string;
    url: string;
    label_en: string;
    label_ru: string;
    type: string;
    screenshot_url: string | null;
    embeddable: boolean;
  }[];
};
```

Add the import at the top:

```typescript
import { BrowserPreview } from "@/components/ui/browser-preview";
```

Replace the style examples section (the block starting with `{style.references.length > 0 && (` through the closing `</div>` and `)}`) with:

```tsx
{style.references.length > 0 && (
  <div>
    <h2 className="mb-4 text-xl font-semibold text-text-primary">
      {t("examples")}
    </h2>
    <div className="space-y-6">
      {style.references.map((ref) => {
        const refLabel = locale === "ru" ? ref.label_ru : ref.label_en;
        return (
          <div key={ref.id}>
            <BrowserPreview
              url={ref.url}
              label={refLabel}
              screenshotUrl={ref.screenshot_url}
              embeddable={ref.embeddable}
            />
            <p className="mt-2 text-sm font-medium text-text-secondary">
              {refLabel}
            </p>
          </div>
        );
      })}
    </div>
  </div>
)}
```

- [ ] **Step 2: Verify frontend builds**

Run: `cd app && npm run build`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/quiz/quiz-result.tsx
git commit -m "feat: replace iframe grid with BrowserPreview on quiz result page"
```

---

### Task 7: Admin panel — screenshot capture and embeddable toggle

**Files:**
- Modify: `app/src/components/admin/style-editor.tsx`
- Modify: `app/src/app/admin/styles/page.tsx`

- [ ] **Step 1: Update types in admin styles page**

In `app/src/app/admin/styles/page.tsx`, add the new fields to `StyleRefData`:

```typescript
type StyleRefData = {
  id: string;
  url: string;
  label_en: string;
  label_ru: string;
  type: string;
  sort_order: number;
  screenshot_url: string | null;
  embeddable: boolean;
};
```

- [ ] **Step 2: Update types in style-editor.tsx**

In `app/src/components/admin/style-editor.tsx`, update the `StyleRefData` type:

```typescript
type StyleRefData = {
  id: string;
  url: string;
  label_en: string;
  label_ru: string;
  type: string;
  sort_order: number;
  screenshot_url: string | null;
  embeddable: boolean;
};
```

- [ ] **Step 3: Add Capture button, screenshot thumbnail, and embeddable toggle to reference rows**

In the `ReferencesEditor` component in `app/src/components/admin/style-editor.tsx`, add these imports at the top of the file:

```typescript
import { Camera, Loader2, Image as ImageIcon } from "lucide-react";
```

Replace the reference row rendering (the `.map` block inside `ReferencesEditor`) with an enhanced version that shows screenshot thumbnail, capture button, and embeddable toggle:

```tsx
{[...references]
  .sort((a, b) => a.sort_order - b.sort_order)
  .map((ref) => (
    <RefRow
      key={ref.id}
      ref_={ref}
      styleId={styleId}
      onDelete={handleDeleteRef}
      loading={loading}
    />
  ))}
```

Add a new `RefRow` component inside the same file:

```tsx
function RefRow({
  ref_,
  styleId,
  onDelete,
  loading: parentLoading,
}: {
  ref_: StyleRefData;
  styleId: string;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const router = useRouter();
  const [capturing, setCapturing] = useState(false);

  async function handleCapture() {
    setCapturing(true);
    try {
      await api("/api/admin/screenshot", {
        method: "POST",
        body: JSON.stringify({
          url: ref_.url,
          reference_id: ref_.id,
        }),
      });
      router.refresh();
    } finally {
      setCapturing(false);
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {ref_.screenshot_url ? (
        <img
          src={ref_.screenshot_url}
          alt=""
          className="h-8 w-12 rounded border border-border object-cover object-top shrink-0"
        />
      ) : (
        <div className="flex h-8 w-12 items-center justify-center rounded border border-border bg-bg-tertiary shrink-0">
          <ImageIcon className="h-3 w-3 text-text-muted" />
        </div>
      )}
      <Badge variant="outline" className="text-xs shrink-0">
        {ref_.type}
      </Badge>
      {ref_.embeddable && (
        <Badge className="text-xs shrink-0 bg-green-500/10 text-green-600">
          iframe
        </Badge>
      )}
      <a
        href={ref_.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:underline flex items-center gap-1 flex-1 truncate"
      >
        {ref_.label_en}
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCapture}
        disabled={capturing}
        title="Capture screenshot"
      >
        {capturing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Camera className="h-3 w-3" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(ref_.id)}
        disabled={parentLoading}
      >
        <Trash2 className="h-3 w-3 text-red-500" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Verify frontend builds**

Run: `cd app && npm run build`

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/admin/style-editor.tsx app/src/app/admin/styles/page.tsx
git commit -m "feat: add screenshot capture button and embeddable badge to admin style editor"
```

---

### Task 8: Install Chromium on VPS

**Files:** None — VPS commands only

- [ ] **Step 1: Install Chromium on VPS**

```bash
ssh root@62.76.228.106 "apt update && apt install -y chromium-browser && chromium-browser --version"
```

Expected: Chromium installed, version printed.

- [ ] **Step 2: Rebuild and deploy**

```bash
cd "E:/Projects/000 - Personal/002 - Portfolio Project"
git push origin master
ssh root@62.76.228.106 "cd /opt/archifex && git pull && cd deploy && docker compose -f docker-compose.prod.yml up --build -d"
```

- [ ] **Step 3: Verify screenshot endpoint**

```bash
ssh root@62.76.228.106 "
TOKEN=\$(curl -s -X POST https://archifex.space/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"zemdenwork@gmail.com\",\"password\":\"archifex2026\"}' \
  -c - | grep auth_token | awk '{print \$7}')

curl -s -X POST https://archifex.space/api/admin/screenshot \
  -H 'Content-Type: application/json' \
  -b \"auth_token=\$TOKEN\" \
  -d '{\"url\":\"https://linear.app\",\"reference_id\":\"ref-minimalist-1\"}'
"
```

Expected: JSON response with `screenshot_url` and `embeddable` fields.

- [ ] **Step 4: Verify quiz result page shows BrowserPreview**

Open `https://archifex.space/en/quiz`, complete quiz flow, check that result page shows BrowserPreview cards instead of broken iframes.

---

### Task 9: Build demo pages — Minimalist (3 pages)

**Files:**
- Create: `app/public/demos/swiss-typography.html`
- Create: `app/public/demos/product-showcase.html`
- Create: `app/public/demos/dev-portfolio.html`

Each demo is a single self-contained HTML file (HTML + CSS + JS, no external dependencies). Requirements per page:

- [ ] **Step 1: swiss-typography.html**

Minimalist design: clean grid layout, generous whitespace, system fonts (Inter or system stack), monochrome palette (black, white, grays). Content: a hero with large typography, a 3-column feature grid, a testimonial section. Interactivity: smooth scroll behavior, subtle hover transitions on cards.

- [ ] **Step 2: product-showcase.html**

Minimalist design: single product hero with large image placeholder (use CSS gradient as placeholder), minimal color palette (white + one accent), large typography. Content: hero with product, features list, CTA section. Interactivity: parallax scroll effect on hero image (pure CSS/JS, no library).

- [ ] **Step 3: dev-portfolio.html**

Minimalist design: dark background (#0a0a0f), monospace font (JetBrains Mono via Google Fonts or system monospace), terminal/code aesthetic. Content: hero with typing animation, project cards as "terminal windows", skills section. Interactivity: typing animation in hero using JS `setInterval`.

- [ ] **Step 4: Verify demos load**

Open each file in browser: `app/public/demos/swiss-typography.html`, etc.

- [ ] **Step 5: Commit**

```bash
git add app/public/demos/swiss-typography.html app/public/demos/product-showcase.html app/public/demos/dev-portfolio.html
git commit -m "feat: add 3 minimalist style demo pages"
```

---

### Task 10: Build demo pages — Bold & Modern (2 pages)

**Files:**
- Create: `app/public/demos/agency-landing.html`
- Create: `app/public/demos/saas-dashboard.html`

- [ ] **Step 1: agency-landing.html**

Bold design: oversized typography (80-120px hero text), vivid gradient backgrounds (purple → cyan or orange → pink), asymmetric layout with overlapping elements. Content: hero with bold headline, services grid, client logos row, CTA. Interactivity: scroll-triggered fade-in animations using IntersectionObserver.

- [ ] **Step 2: saas-dashboard.html**

Bold design: dark UI (#0f0f1a), neon accents (cyan #00d4ff, green #00ff88), card-heavy layout simulating a dashboard. Content: header with logo, metric cards with numbers, feature grid, pricing table. Interactivity: animated counters that count up on scroll, hover glow effects on cards.

- [ ] **Step 3: Commit**

```bash
git add app/public/demos/agency-landing.html app/public/demos/saas-dashboard.html
git commit -m "feat: add 2 bold & modern style demo pages"
```

---

### Task 11: Build demo pages — Corporate Classic (2 pages)

**Files:**
- Create: `app/public/demos/consulting-firm.html`
- Create: `app/public/demos/financial-services.html`

- [ ] **Step 1: consulting-firm.html**

Corporate design: navy (#1a2332) + gold (#c4a35a), serif headings (Georgia or Playfair Display via Google Fonts), structured layout. Content: hero with tagline, services with icons, team section, FAQ accordion, footer with contact. Interactivity: accordion FAQ sections (click to expand/collapse), smooth scroll navigation.

- [ ] **Step 2: financial-services.html**

Corporate design: professional palette (navy, white, subtle blue), sans-serif body, data-heavy feel. Content: hero with stats, service cards, chart placeholders (CSS-drawn bar charts), trust badges/partners row. Interactivity: animated counter numbers on scroll (IntersectionObserver triggers count-up), CSS bar chart animations.

- [ ] **Step 3: Commit**

```bash
git add app/public/demos/consulting-firm.html app/public/demos/financial-services.html
git commit -m "feat: add 2 corporate classic style demo pages"
```

---

### Task 12: Build demo pages — Creative & Experimental (3 pages)

**Files:**
- Create: `app/public/demos/particle-constellation.html`
- Create: `app/public/demos/fluid-art.html`
- Create: `app/public/demos/architectural-blueprint.html`

- [ ] **Step 1: particle-constellation.html**

Adapt from `E:/Projects/090 - Claude/garden/constellations.html`. Copy the file, then modify:
- Change title to "Constellation — Interactive Demo"
- Add a subtle fixed overlay with "CREATIVE & EXPERIMENTAL" label and "archifex.space" attribution in bottom-right corner
- Keep all interactivity (mouse creates constellations, particles connect)

- [ ] **Step 2: fluid-art.html**

Adapt from `E:/Projects/090 - Claude/garden/fluid.html` (or `reaction-diffusion.html` if fluid doesn't exist). Copy the file, then modify:
- Change title to "Fluid — Interactive Demo"
- Add the same overlay/attribution as particle-constellation
- Keep all interactivity (mouse interaction with fluid simulation)

Check which file exists first and use the best canvas-based interactive demo available.

- [ ] **Step 3: architectural-blueprint.html**

Build new. Blueprint/architect theme matching archifex.space itself. Dark navy background (#0c1929), cyan accent (#0891b2), grid lines, technical drawing aesthetic. Content: SVG wireframe of a website layout being "drawn", dimension annotations ("1440 × 900"), grid dots. Interactivity: SVG elements draw in with CSS stroke-dashoffset animations, hover reveals dimension labels, subtle parallax on grid.

- [ ] **Step 4: Verify all demos load**

Open all 10 files in browser to verify they render correctly.

- [ ] **Step 5: Commit**

```bash
git add app/public/demos/particle-constellation.html app/public/demos/fluid-art.html app/public/demos/architectural-blueprint.html
git commit -m "feat: add 3 creative & experimental style demo pages"
```

---

### Task 13: Seed demo pages as style references + deploy

**Files:** No file changes — API calls and VPS deployment

- [ ] **Step 1: Push all changes**

```bash
git push origin master
```

- [ ] **Step 2: Deploy to VPS**

```bash
ssh root@62.76.228.106 "cd /opt/archifex && git pull && cd deploy && docker compose -f docker-compose.prod.yml up --build -d"
```

- [ ] **Step 3: Add demo references via API**

For each style, add the demo pages as OWN_PROJECT references via the admin API. Example for Minimalist:

```bash
ssh root@62.76.228.106 "
TOKEN=\$(curl -s -X POST https://archifex.space/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"zemdenwork@gmail.com\",\"password\":\"archifex2026\"}' \
  -c - | grep auth_token | awk '{print \$7}')

# Minimalist demos
curl -s -X POST https://archifex.space/api/admin/styles/refs \
  -H 'Content-Type: application/json' \
  -b \"auth_token=\$TOKEN\" \
  -d '{\"style_id\":\"style-minimalist\",\"url\":\"https://archifex.space/demos/swiss-typography.html\",\"label_en\":\"Swiss Typography\",\"label_ru\":\"Швейцарская типографика\",\"type\":\"OWN_PROJECT\"}'

curl -s -X POST https://archifex.space/api/admin/styles/refs \
  -H 'Content-Type: application/json' \
  -b \"auth_token=\$TOKEN\" \
  -d '{\"style_id\":\"style-minimalist\",\"url\":\"https://archifex.space/demos/product-showcase.html\",\"label_en\":\"Product Showcase\",\"label_ru\":\"Витрина продукта\",\"type\":\"OWN_PROJECT\"}'

curl -s -X POST https://archifex.space/api/admin/styles/refs \
  -H 'Content-Type: application/json' \
  -b \"auth_token=\$TOKEN\" \
  -d '{\"style_id\":\"style-minimalist\",\"url\":\"https://archifex.space/demos/dev-portfolio.html\",\"label_en\":\"Developer Portfolio\",\"label_ru\":\"Портфолио разработчика\",\"type\":\"OWN_PROJECT\"}'

# Bold & Modern demos
curl -s -X POST https://archifex.space/api/admin/styles/refs \
  -H 'Content-Type: application/json' \
  -b \"auth_token=\$TOKEN\" \
  -d '{\"style_id\":\"style-bold-modern\",\"url\":\"https://archifex.space/demos/agency-landing.html\",\"label_en\":\"Agency Landing\",\"label_ru\":\"Лендинг агентства\",\"type\":\"OWN_PROJECT\"}'

curl -s -X POST https://archifex.space/api/admin/styles/refs \
  -H 'Content-Type: application/json' \
  -b \"auth_token=\$TOKEN\" \
  -d '{\"style_id\":\"style-bold-modern\",\"url\":\"https://archifex.space/demos/saas-dashboard.html\",\"label_en\":\"SaaS Dashboard\",\"label_ru\":\"SaaS панель\",\"type\":\"OWN_PROJECT\"}'

# Corporate Classic demos
curl -s -X POST https://archifex.space/api/admin/styles/refs \
  -H 'Content-Type: application/json' \
  -b \"auth_token=\$TOKEN\" \
  -d '{\"style_id\":\"style-corporate-classic\",\"url\":\"https://archifex.space/demos/consulting-firm.html\",\"label_en\":\"Consulting Firm\",\"label_ru\":\"Консалтинговая фирма\",\"type\":\"OWN_PROJECT\"}'

curl -s -X POST https://archifex.space/api/admin/styles/refs \
  -H 'Content-Type: application/json' \
  -b \"auth_token=\$TOKEN\" \
  -d '{\"style_id\":\"style-corporate-classic\",\"url\":\"https://archifex.space/demos/financial-services.html\",\"label_en\":\"Financial Services\",\"label_ru\":\"Финансовые услуги\",\"type\":\"OWN_PROJECT\"}'

# Creative & Experimental demos
curl -s -X POST https://archifex.space/api/admin/styles/refs \
  -H 'Content-Type: application/json' \
  -b \"auth_token=\$TOKEN\" \
  -d '{\"style_id\":\"style-creative-experimental\",\"url\":\"https://archifex.space/demos/particle-constellation.html\",\"label_en\":\"Particle Constellation\",\"label_ru\":\"Созвездие частиц\",\"type\":\"OWN_PROJECT\"}'

curl -s -X POST https://archifex.space/api/admin/styles/refs \
  -H 'Content-Type: application/json' \
  -b \"auth_token=\$TOKEN\" \
  -d '{\"style_id\":\"style-creative-experimental\",\"url\":\"https://archifex.space/demos/fluid-art.html\",\"label_en\":\"Fluid Art\",\"label_ru\":\"Жидкое искусство\",\"type\":\"OWN_PROJECT\"}'

curl -s -X POST https://archifex.space/api/admin/styles/refs \
  -H 'Content-Type: application/json' \
  -b \"auth_token=\$TOKEN\" \
  -d '{\"style_id\":\"style-creative-experimental\",\"url\":\"https://archifex.space/demos/architectural-blueprint.html\",\"label_en\":\"Architectural Blueprint\",\"label_ru\":\"Архитектурный чертёж\",\"type\":\"OWN_PROJECT\"}'
"
```

- [ ] **Step 4: Capture screenshots for all references**

Run screenshot capture for each reference via the admin panel, or via API calls for all existing references.

- [ ] **Step 5: Verify end-to-end**

1. Open `https://archifex.space/en/quiz` and complete the quiz
2. On the result page, verify:
   - OWN_PROJECT demos show as interactive iframes (embeddable: true)
   - EXTERNAL references show as scrollable screenshots (embeddable: false)
   - No blank boxes
3. Open admin at `https://archifex.space/admin/styles`
4. Verify screenshot thumbnails appear on reference rows
5. Click "Capture" button on a reference — screenshot updates
6. Check mobile (375px) — preview cards stack and scale appropriately
