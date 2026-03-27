"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const locales = ["en", "ru"] as const;

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(locale: string) {
    if (locale === currentLocale) return;
    router.replace(pathname, { locale });
  }

  return (
    <div className="flex items-center gap-0.5 text-sm font-medium">
      {locales.map((locale, i) => (
        <span key={locale} className="flex items-center">
          {i > 0 && <span className="mx-1 text-text-muted">|</span>}
          <button
            onClick={() => switchLocale(locale)}
            className={cn(
              "rounded px-1.5 py-0.5 uppercase transition-colors duration-150",
              locale === currentLocale
                ? "text-accent"
                : "text-text-muted hover:text-text-primary",
            )}
            aria-label={`Switch to ${locale === "en" ? "English" : "Russian"}`}
          >
            {locale}
          </button>
        </span>
      ))}
    </div>
  );
}
