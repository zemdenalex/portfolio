"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

interface DemoFrameProps {
  src: string;
  title: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

export function DemoFrame({
  src,
  title,
  naturalWidth = 1280,
  naturalHeight = 720,
}: DemoFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [tapped, setTapped] = useState(false);

  const domain = (() => {
    try {
      return new URL(src).hostname;
    } catch {
      return src;
    }
  })();

  useEffect(() => {
    function compute() {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      setScale(Math.min(1, w / naturalWidth));
    }

    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [naturalWidth]);

  const isMobile = scale < 1;
  const scaledHeight = naturalHeight * scale;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-lg border border-border bg-bg-secondary shadow-sm"
    >
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
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-muted transition-colors hover:text-accent"
          title={`Open ${title}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Content area */}
      <div
        style={{ height: `${scaledHeight}px` }}
        className="relative overflow-hidden"
      >
        {/* Scaled iframe wrapper */}
        <div
          style={{
            width: `${naturalWidth}px`,
            height: `${naturalHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <iframe
            src={src}
            title={title}
            sandbox="allow-scripts allow-same-origin"
            style={{
              width: `${naturalWidth}px`,
              height: `${naturalHeight}px`,
              border: 0,
              display: "block",
              background: "var(--bg-primary, #fff)",
              overflow: "hidden",
            }}
            scrolling="no"
          />
        </div>

        {/* Mobile "Tap to interact" overlay — shown until first tap */}
        {isMobile && !tapped && (
          <button
            type="button"
            onClick={() => setTapped(true)}
            className="absolute inset-0 flex items-center justify-center bg-bg-primary/50 text-sm font-medium text-text-primary backdrop-blur-sm transition-opacity"
          >
            Tap to interact
          </button>
        )}
      </div>
    </div>
  );
}
