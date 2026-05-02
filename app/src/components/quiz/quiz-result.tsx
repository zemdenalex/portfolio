"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  CheckCircle,
  RefreshCw,
  Package,
  DollarSign,
} from "lucide-react";
import { DemoFrame } from "@/components/portfolio/demo-frame";
import { ContactForm } from "./contact-form";
import { api, type QuizResultData } from "@/lib/api";

type QuizResultProps = {
  result: QuizResultData;
  locale: string;
};

export function QuizResult({ result, locale }: QuizResultProps) {
  const t = useTranslations("quiz.result");

  const { style, references, package: pkg } = result;

  const styleName = locale === "ru" ? style.name_ru : style.name_en;
  const styleDesc = locale === "ru" ? style.description_ru : style.description_en;
  const pkgName = pkg ? (locale === "ru" ? pkg.name_ru : pkg.name_en) : null;

  async function handleContactSubmit(data: {
    name: string;
    email: string;
    phone: string;
    message: string;
  }) {
    await api("/api/public/leads", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        style_id: style.id,
        package_id: pkg?.id ?? null,
      }),
    });
  }

  return (
    <section className="mx-auto min-h-screen max-w-4xl px-6 py-20">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Success banner */}
        <div className="rounded-lg border border-accent bg-accent-muted p-6 text-center">
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-accent" />
          <h1 className="mb-2 text-3xl font-bold text-text-primary">{t("title")}</h1>
          <p className="text-text-secondary">{t("subtitle")}</p>
        </div>

        {/* Style recommendation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{styleName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary leading-relaxed">{styleDesc}</p>
          </CardContent>
        </Card>

        {/* Style examples */}
        {references.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-text-primary">
              {t("examples")}
            </h2>
            <div className="space-y-6">
              {references.map((ref) => {
                const refLabel = locale === "ru" ? ref.label_ru : ref.label_en;
                return (
                  <div key={ref.id}>
                    <DemoFrame src={ref.url} title={refLabel} />
                    <p className="mt-2 text-sm font-medium text-text-secondary">
                      {refLabel}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Package card */}
        {pkg && (
          <Card className="border-accent">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-accent" />
                <CardTitle>{t("package")}</CardTitle>
              </div>
              <Badge variant="accent" className="w-fit text-sm">
                {pkgName}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg bg-bg-tertiary p-4">
                  <DollarSign className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-xs text-text-muted">{t("priceRange")}</p>
                    <p className="font-semibold text-text-primary">
                      {formatPrice(pkg.price_from, pkg.price_to, "RUB")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lead capture form */}
        <div className="rounded-lg border border-border bg-bg-secondary p-8">
          <ContactForm onSubmit={handleContactSubmit} />
        </div>

        {/* Start over CTA */}
        <div className="rounded-lg bg-accent-muted p-6 text-center">
          <Button variant="outline" asChild>
            <Link href="/quiz">
              <RefreshCw className="h-4 w-4" />
              {t("startNew")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
