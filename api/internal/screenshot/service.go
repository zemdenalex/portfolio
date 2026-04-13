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
	embeddable := checkEmbeddable(targetURL)

	screenshotDir := filepath.Join(s.uploadPath, "screenshots")
	if err := os.MkdirAll(screenshotDir, 0o755); err != nil {
		return nil, fmt.Errorf("create screenshot dir: %w", err)
	}

	filename := sanitizeURL(targetURL) + ".png"
	filePath := filepath.Join(screenshotDir, filename)

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

	taskCtx, cancel := context.WithTimeout(taskCtx, 30*time.Second)
	defer cancel()

	var buf []byte
	err := chromedp.Run(taskCtx,
		chromedp.Navigate(targetURL),
		chromedp.Sleep(2*time.Second),
		chromedp.FullScreenshot(&buf, 90),
	)
	if err != nil {
		return nil, fmt.Errorf("capture screenshot: %w", err)
	}

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

	xfo := strings.ToUpper(resp.Header.Get("X-Frame-Options"))
	if xfo == "DENY" || xfo == "SAMEORIGIN" {
		return false
	}

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
