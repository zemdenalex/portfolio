"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { QuizStep } from "./quiz-step";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

type QuizOption = {
  id: string;
  label_en: string;
  label_ru: string;
  next_node_id: string | null;
  sort_order: number;
};

type QuizNodeData = {
  id: string;
  type: "QUESTION" | "RESULT";
  question_en: string | null;
  question_ru: string | null;
  options: QuizOption[];
  result: {
    style_id: string;
    package_id: string;
  } | null;
};

type QuizAnswer = {
  nodeId: string;
  optionId: string;
  label: string;
};

type QuizWizardProps = {
  initialNode: QuizNodeData;
  locale: string;
  estimatedSteps: number;
};

export function QuizWizard({ initialNode, locale, estimatedSteps }: QuizWizardProps) {
  const t = useTranslations("quiz");
  const router = useRouter();
  const [currentNode, setCurrentNode] = useState<QuizNodeData>(initialNode);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [history, setHistory] = useState<QuizNodeData[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [transitioning, setTransitioning] = useState(false);

  const currentStep = answers.length + 1;
  const totalSteps = Math.max(estimatedSteps, currentStep);
  const progress = Math.min(Math.round((currentStep / totalSteps) * 100), 100);

  const fetchNode = useCallback(async (nodeId: string): Promise<QuizNodeData | null> => {
    try {
      return await api<QuizNodeData>(`/api/public/quiz/node/${nodeId}`);
    } catch {
      return null;
    }
  }, []);

  function triggerTransition(dir: "forward" | "back", callback: () => void) {
    setDirection(dir);
    setTransitioning(true);
    setTimeout(() => {
      callback();
      setTransitioning(false);
    }, 200);
  }

  async function handleOptionSelect(optionId: string) {
    setSelectedOptionId(optionId);

    const option = currentNode.options.find((o) => o.id === optionId);
    if (!option) return;

    const label = locale === "ru" ? option.label_ru : option.label_en;
    const answer: QuizAnswer = {
      nodeId: currentNode.id,
      optionId,
      label,
    };

    const nextOptionIds = [...selectedOptionIds, optionId];

    // Terminal option — no next node, navigate to result with collected IDs
    if (!option.next_node_id) {
      setSelectedOptionIds(nextOptionIds);
      router.push(`/quiz/result?ids=${nextOptionIds.join(",")}`);
      return;
    }

    setLoading(true);
    const nextNode = await fetchNode(option.next_node_id);
    setLoading(false);

    if (!nextNode) return;

    triggerTransition("forward", () => {
      setHistory((prev) => [...prev, currentNode]);
      setAnswers((prev) => [...prev, answer]);
      setSelectedOptionIds(nextOptionIds);
      setSelectedOptionId(null);
      setCurrentNode(nextNode);
    });
  }

  function handleBack() {
    if (history.length === 0) return;

    triggerTransition("back", () => {
      const previousNode = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setAnswers((prev) => prev.slice(0, -1));
      setSelectedOptionIds((prev) => prev.slice(0, -1));
      setCurrentNode(previousNode);
      setSelectedOptionId(null);
    });
  }

  const question =
    locale === "ru"
      ? currentNode.question_ru
      : currentNode.question_en;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm text-text-secondary">
          <span>
            {t("step", { current: currentStep, total: totalSteps })}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-bg-tertiary">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Back button */}
      {answers.length > 0 && (
        <button
          type="button"
          onClick={handleBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </button>
      )}

      {/* Step content with CSS transition */}
      <div
        className={cn(
          "transition-all duration-200 ease-in-out",
          transitioning && direction === "forward" && "translate-x-[-40px] opacity-0",
          transitioning && direction === "back" && "translate-x-[40px] opacity-0",
          !transitioning && "translate-x-0 opacity-100",
        )}
      >
        <QuizStep
          question={question ?? ""}
          options={currentNode.options}
          locale={locale}
          selectedOptionId={selectedOptionId}
          onSelect={handleOptionSelect}
        />
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="mt-8 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}
    </div>
  );
}
