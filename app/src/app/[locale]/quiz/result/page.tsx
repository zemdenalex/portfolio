import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { serverApi } from "@/lib/api";
import { cookies } from "next/headers";
import { QuizResult } from "@/components/quiz/quiz-result";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ styleId?: string; packageId?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quiz.result" });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function QuizResultPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { styleId, packageId } = await searchParams;
  const t = await getTranslations({ locale, namespace: "quiz.result" });
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!styleId || !packageId) {
    return (
      <section className="mx-auto min-h-screen max-w-2xl px-6 py-20 text-center">
        <h1 className="mb-3 text-3xl font-bold text-text-primary">
          {t("title")}
        </h1>
        <p className="mb-8 text-text-secondary">
          {t("noResults")}
        </p>
        <Button variant="accent" asChild>
          <Link href="/quiz">
            <RefreshCw className="h-4 w-4" />
            {t("startNew")}
          </Link>
        </Button>
      </section>
    );
  }

  type StyleResponse = {
    id: string;
    name_en: string;
    name_ru: string;
    description_en: string;
    description_ru: string;
    references: {
      id: string;
      url: string;
      label_en: string;
      label_ru: string;
      type: string;
      screenshot_url: string | null;
      embeddable: boolean;
    }[];
  };

  type PackageResponse = {
    id: string;
    name_en: string;
    name_ru: string;
    description_en: string;
    description_ru: string;
    price_from: number;
    price_to: number;
    currency: string;
    features_en: string[];
    features_ru: string[];
    delivery_days: number | null;
  };

  let style: StyleResponse | null = null;
  let pkg: PackageResponse | null = null;

  try {
    [style, pkg] = await Promise.all([
      serverApi<StyleResponse>(`/api/public/styles/${styleId}`, cookieHeader),
      serverApi<PackageResponse>(`/api/public/packages/${packageId}`, cookieHeader),
    ]);
  } catch {
    // API error
  }

  if (!style || !pkg) {
    return (
      <section className="mx-auto min-h-screen max-w-2xl px-6 py-20 text-center">
        <h1 className="mb-3 text-3xl font-bold text-text-primary">
          {t("title")}
        </h1>
        <p className="mb-8 text-text-secondary">
          {t("dataNotFound")}
        </p>
        <Button variant="accent" asChild>
          <Link href="/quiz">
            <RefreshCw className="h-4 w-4" />
            {t("startNew")}
          </Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto min-h-screen max-w-4xl px-6 py-20">
      <QuizResult style={style} pkg={pkg} locale={locale} />
    </section>
  );
}
