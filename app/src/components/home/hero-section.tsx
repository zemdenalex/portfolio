"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Blueprint Wireframe (CSS animations) ────────── */

function BlueprintWireframe() {
  return (
    <div
      className="relative w-full max-w-md aspect-[4/3] animate-bp-fade-in"
      aria-hidden="true"
    >
      {/* Blueprint grid background */}
      <div className="absolute inset-0 rounded-lg blueprint-grid-fine border border-dashed border-accent/30" />

      <svg
        viewBox="0 0 400 300"
        fill="none"
        className="relative w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Nav bar */}
        <rect
          x="20" y="15" width="360" height="30"
          rx="4"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeDasharray="6 3"
          className="animate-bp-draw"
          style={{ animationDelay: "0.2s" }}
        />
        {/* Nav logo placeholder */}
        <rect
          x="30" y="22" width="40" height="16"
          rx="2"
          fill="var(--accent)"
          fillOpacity="0.15"
          className="animate-bp-fade-in"
          style={{ animationDelay: "0.35s" }}
        />
        {/* Nav links */}
        {[0, 1, 2].map((n) => (
          <rect
            key={`nav-${n}`}
            x={280 + n * 30} y="25" width="20" height="8"
            rx="1"
            fill="var(--accent)"
            fillOpacity="0.2"
            className="animate-bp-fade-in"
            style={{ animationDelay: `${0.42 + n * 0.1}s` }}
          />
        ))}

        {/* Hero block */}
        <rect
          x="20" y="60" width="360" height="80"
          rx="4"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeDasharray="6 3"
          className="animate-bp-draw"
          style={{ animationDelay: "0.5s" }}
        />
        {/* Hero text lines */}
        <rect
          x="40" y="78" width="180" height="10" rx="2"
          fill="var(--accent)" fillOpacity="0.12"
          className="animate-bp-fade-in"
          style={{ animationDelay: "0.65s" }}
        />
        <rect
          x="40" y="96" width="140" height="8" rx="2"
          fill="var(--accent)" fillOpacity="0.08"
          className="animate-bp-fade-in"
          style={{ animationDelay: "0.7s" }}
        />
        {/* Hero CTA */}
        <rect
          x="40" y="116" width="70" height="16" rx="3"
          fill="var(--accent)" fillOpacity="0.25"
          className="animate-bp-fade-in"
          style={{ animationDelay: "0.8s" }}
        />

        {/* Card grid - 3 cards */}
        {[0, 1, 2].map((n) => (
          <g key={`card-${n}`}>
            <rect
              x={20 + n * 125} y="160" width="110" height="120"
              rx="4"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeDasharray="6 3"
              className="animate-bp-draw"
              style={{ animationDelay: `${0.9 + n * 0.15}s` }}
            />
            {/* Card image placeholder */}
            <rect
              x={28 + n * 125} y="168" width="94" height="50"
              rx="2"
              fill="var(--accent)"
              fillOpacity="0.08"
              className="animate-bp-fade-in"
              style={{ animationDelay: `${1.1 + n * 0.15}s` }}
            />
            {/* Card text */}
            <rect
              x={28 + n * 125} y="226" width="70" height="8"
              rx="2"
              fill="var(--accent)"
              fillOpacity="0.12"
              className="animate-bp-fade-in"
              style={{ animationDelay: `${1.2 + n * 0.15}s` }}
            />
            <rect
              x={28 + n * 125} y="240" width="50" height="6"
              rx="2"
              fill="var(--accent)"
              fillOpacity="0.08"
              className="animate-bp-fade-in"
              style={{ animationDelay: `${1.25 + n * 0.15}s` }}
            />
          </g>
        ))}

        {/* Dimension annotation */}
        <g
          className="animate-bp-fade-in"
          style={{ animationDelay: "1.6s" }}
        >
          <line x1="385" y1="15" x2="385" y2="280" stroke="var(--accent)" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1="380" y1="15" x2="390" y2="15" stroke="var(--accent)" strokeWidth="0.5" />
          <line x1="380" y1="280" x2="390" y2="280" stroke="var(--accent)" strokeWidth="0.5" />
          <text x="392" y="150" fill="var(--accent)" fontSize="8" fontFamily="monospace" opacity="0.6">1440px</text>
        </g>
      </svg>
    </div>
  );
}

/* ─── Hero Section ─────────────────────────────────── */

export function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section
      className={cn(
        "relative min-h-[calc(100vh-4rem)] flex items-center",
        "blueprint-grid overflow-hidden bg-bg-secondary",
      )}
      aria-label="Hero"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24">
        {/* Left: copy + CTAs */}
        <div className="flex flex-col justify-center">
          <p
            className="mb-4 font-mono text-sm font-semibold uppercase tracking-[4px] text-accent animate-hero-item"
            style={{ animationDelay: "0.1s" }}
          >
            {t("label")}
          </p>

          <h1
            className="mb-6 text-4xl font-extrabold leading-tight text-text-primary md:text-5xl lg:text-6xl animate-hero-item"
            style={{ animationDelay: "0.22s" }}
          >
            {t("title")}{" "}
            <span className="text-accent">{t("titleAccent")}</span>
          </h1>

          <p
            className="mb-10 max-w-lg text-lg text-text-secondary md:text-xl animate-hero-item"
            style={{ animationDelay: "0.34s" }}
          >
            {t("subtitle")}
          </p>

          <div
            className="flex flex-wrap gap-4 animate-hero-item"
            style={{ animationDelay: "0.46s" }}
          >
            <Button variant="accent" size="lg" asChild>
              <Link href="/quiz">
                {t("ctaPrimary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/portfolio">
                {t("ctaSecondary")}
              </Link>
            </Button>
          </div>
        </div>

        {/* Right: blueprint wireframe */}
        <div className="hidden items-center justify-center lg:flex">
          <BlueprintWireframe />
        </div>
      </div>
    </section>
  );
}
