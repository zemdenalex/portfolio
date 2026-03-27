import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-bg-secondary">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <p className="text-sm text-text-muted">
          {t("copyright", { year })}
        </p>
        <p className="text-sm text-text-muted">
          {t("builtWith")}
        </p>
      </div>
    </footer>
  );
}
