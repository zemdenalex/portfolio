import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(from: number, to: number, currency: string): string {
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return `${fmt.format(from)} – ${fmt.format(to)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Get a localized field from a Go API response (snake_case).
 * E.g. getLocalizedField(item, "title", "en") -> item.title_en
 */
export function getLocalizedField<T extends Record<string, unknown>>(
  item: T,
  field: string,
  locale: string,
): string {
  // snake_case: title_en, title_ru (Go API format)
  const snakeKey = `${field}_${locale}` as keyof T;
  if (item[snakeKey] != null) return item[snakeKey] as string;

  // camelCase fallback: titleEn, titleRu (legacy format)
  const camelKey = `${field}${locale === "ru" ? "Ru" : "En"}` as keyof T;
  if (item[camelKey] != null) return item[camelKey] as string;

  return "";
}
