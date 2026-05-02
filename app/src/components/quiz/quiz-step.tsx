"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type QuizOption = {
  id: string;
  label_en: string;
  label_ru: string;
  sort_order: number;
};

type QuizStepProps = {
  question: string;
  options: QuizOption[];
  locale: string;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
};

export function QuizStep({
  question,
  options,
  locale,
  selectedOptionId,
  onSelect,
}: QuizStepProps) {
  const sorted = [...options].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <h2 className="mb-8 text-center text-2xl font-bold text-text-primary md:text-3xl">
        {question}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((option, index) => {
          const label = locale === "ru" ? option.label_ru : option.label_en;
          const isSelected = selectedOptionId === option.id;

          return (
            <div
              key={option.id}
              className="animate-fade-slide-up"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <button
                type="button"
                onClick={() => onSelect(option.id)}
                className="w-full text-left h-full"
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all duration-150 h-full min-h-[80px]",
                    "hover:border-accent hover:shadow-md",
                    isSelected
                      ? "border-accent bg-accent-muted shadow-md"
                      : "border-border",
                  )}
                >
                  <CardContent className="p-5 flex flex-col justify-end h-full">
                    <p
                      className={cn(
                        "font-medium",
                        isSelected ? "text-accent" : "text-text-primary",
                      )}
                    >
                      {label}
                    </p>
                  </CardContent>
                </Card>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
