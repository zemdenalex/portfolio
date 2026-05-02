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
  Clock,
  DollarSign,
} from "lucide-react";
import { DemoFrame } from "@/components/portfolio/demo-frame";

type StyleData = {
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

type PackageData = {
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

type QuizResultProps = {
  style: StyleData;
  pkg: PackageData;
  locale: string;
};

export function QuizResult({ style, pkg, locale }: QuizResultProps) {
  const t = useTranslations("quiz.result");

  const styleName = locale === "ru" ? style.name_ru : style.name_en;
  const styleDesc = locale === "ru" ? style.description_ru : style.description_en;
  const pkgName = locale === "ru" ? pkg.name_ru : pkg.name_en;
  const features = locale === "ru" ? pkg.features_ru : pkg.features_en;

  return (
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
      {style.references.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-text-primary">
            {t("examples")}
          </h2>
          <div className="space-y-6">
            {style.references.map((ref) => {
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
          {/* Price and delivery */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-bg-tertiary p-4">
              <DollarSign className="h-5 w-5 text-accent" />
              <div>
                <p className="text-xs text-text-muted">{t("priceRange")}</p>
                <p className="font-semibold text-text-primary">
                  {formatPrice(pkg.price_from, pkg.price_to, pkg.currency)}
                </p>
              </div>
            </div>
            {pkg.delivery_days !== null && (
              <div className="flex items-center gap-3 rounded-lg bg-bg-tertiary p-4">
                <Clock className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-xs text-text-muted">{t("delivery")}</p>
                  <p className="font-semibold text-text-primary">
                    {t("days", { count: pkg.delivery_days })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
                {t("features")}
              </h3>
              <ul className="space-y-2">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-text-secondary">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="rounded-lg bg-accent-muted p-6 text-center">
        <p className="mb-4 text-lg font-medium text-text-primary">{t("cta")}</p>
        <Button variant="outline" asChild>
          <Link href="/quiz">
            <RefreshCw className="h-4 w-4" />
            {t("startNew")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
