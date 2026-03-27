"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";

const navLinks = [
  { href: "/", key: "home" },
  { href: "/portfolio", key: "portfolio" },
  { href: "/quiz", key: "quiz" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-bg-primary/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="font-mono text-xl font-bold tracking-widest text-accent"
          aria-label="Home"
        >
          DZ
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="text-sm font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        {/* Desktop controls */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <div className="h-4 w-px bg-border" />
          <ThemeToggle />
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-md text-text-secondary md:hidden",
            "transition-colors duration-150 hover:bg-bg-secondary hover:text-text-primary",
          )}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-bg-primary md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3" aria-label="Mobile">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-secondary hover:text-text-primary"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 border-t border-border-light px-4 py-3">
            <LanguageSwitcher />
            <div className="h-4 w-px bg-border" />
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
