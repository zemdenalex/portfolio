"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { postQuizResult, type QuizResultData } from "@/lib/api";
import { QuizResult } from "@/components/quiz/quiz-result";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function QuizResultPage() {
  const searchParams = useSearchParams();
  const { locale } = useParams<{ locale: string }>();
  const idsCsv = searchParams.get("ids") ?? "";
  const ids = idsCsv ? idsCsv.split(",").filter(Boolean) : [];
  const [data, setData] = useState<QuizResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length === 0) {
      setError("No quiz answers provided.");
      return;
    }
    postQuizResult(ids)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  // idsCsv is the stable dependency — ids array changes identity each render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsCsv]);

  if (error) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl px-6 py-20 text-center">
        <p className="mb-8 text-text-secondary">{error}</p>
        <Button variant="accent" asChild>
          <Link href="/quiz">
            <RefreshCw className="h-4 w-4" />
            Take the quiz
          </Link>
        </Button>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </main>
    );
  }

  return <QuizResult result={data} locale={locale} />;
}
