import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { serverApi } from "@/lib/api";
import { cookies } from "next/headers";
import { QuizWizard } from "@/components/quiz/quiz-wizard";

export const dynamic = "force-dynamic";

type QuizRootResponse = {
  node: {
    id: string;
    type: "QUESTION" | "RESULT";
    question_en: string | null;
    question_ru: string | null;
    options: {
      id: string;
      label_en: string;
      label_ru: string;
      next_node_id: string | null;
      sort_order: number;
    }[];
    result: {
      style_id: string;
      package_id: string;
    } | null;
  } | null;
  estimated_steps: number;
};

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quiz" });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function QuizPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quiz" });
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let rootData: QuizRootResponse | null = null;
  try {
    rootData = await serverApi<QuizRootResponse>("/api/public/quiz/root", cookieHeader);
  } catch {
    // API unavailable
  }

  if (!rootData?.node) {
    return (
      <section className="mx-auto min-h-screen max-w-2xl px-6 py-20 text-center">
        <h1 className="mb-3 text-4xl font-extrabold text-text-primary">
          {t("title")}
        </h1>
        <p className="text-text-secondary">{t("subtitle")}</p>
        <p className="mt-8 text-text-muted">
          {t("setupMessage")}
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto min-h-screen max-w-4xl px-6 py-20">
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-4xl font-extrabold text-text-primary">
          {t("title")}
        </h1>
        <p className="text-lg text-text-secondary">{t("subtitle")}</p>
      </div>

      <QuizWizard
        initialNode={rootData.node}
        locale={locale}
        estimatedSteps={rootData.estimated_steps}
      />
    </section>
  );
}
