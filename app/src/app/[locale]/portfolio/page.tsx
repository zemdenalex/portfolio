import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { serverApi } from "@/lib/api";
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import type { PortfolioProject } from "@/components/portfolio/project-card";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function PortfolioPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });

  let projects: PortfolioProject[] = [];
  try {
    projects = await serverApi<PortfolioProject[]>("/api/public/portfolio");
  } catch {
    // API unavailable
  }

  return (
    <section className="mx-auto min-h-screen max-w-6xl px-6 py-20">
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-4xl font-extrabold text-text-primary">
          {t("title")}
        </h1>
        <p className="text-lg text-text-secondary">{t("subtitle")}</p>
      </div>

      <PortfolioGrid projects={projects} locale={locale} />
    </section>
  );
}
