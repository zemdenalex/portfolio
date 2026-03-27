import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuizCTA() {
  const t = useTranslations("cta");

  return (
    <section
      className={cn(
        "relative py-20 sm:py-28",
        "blueprint-grid",
      )}
      aria-labelledby="quiz-cta-heading"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2
          id="quiz-cta-heading"
          className="mb-4 text-3xl font-bold text-text-primary md:text-4xl"
        >
          {t("title")}
        </h2>
        <p className="mb-8 text-lg text-text-secondary">
          {t("subtitle")}
        </p>
        <Button variant="accent" size="lg" asChild>
          <Link href="/quiz">
            {t("button")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
