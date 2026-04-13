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
