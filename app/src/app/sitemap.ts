import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:8090";

type ProjectSlug = {
  slug: string;
  updated_at: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let projects: ProjectSlug[] = [];
  try {
    const res = await fetch(`${API_URL}/api/public/portfolio/slugs`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      projects = json.data ?? [];
    }
  } catch {
    // API unavailable — return static pages only
  }

  const locales = ["en", "ru"];

  // Static pages
  const staticPages = ["", "/portfolio", "/quiz"];
  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap((path) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
  );

  // Dynamic project pages
  const projectEntries: MetadataRoute.Sitemap = projects.flatMap((project) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}/portfolio/${project.slug}`,
      lastModified: new Date(project.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  );

  return [...staticEntries, ...projectEntries];
}
