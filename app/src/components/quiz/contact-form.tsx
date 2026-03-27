"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle, Loader2 } from "lucide-react";

type ContactFormProps = {
  onSubmit: (data: {
    name: string;
    email: string;
    phone: string;
    message: string;
  }) => Promise<void>;
};

export function ContactForm({ onSubmit }: ContactFormProps) {
  const t = useTranslations("quiz.contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate(): boolean {
    const newErrors: Record<string, boolean> = {};
    if (!name.trim()) newErrors.name = true;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim(), message: message.trim() });
      setSubmitted(true);
    } catch {
      // Error handled silently, button re-enables
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle className="h-16 w-16 text-accent" />
        <h3 className="text-2xl font-bold text-text-primary">{t("title")}</h3>
        <p className="text-text-secondary">{t("subtitle")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-5">
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold text-text-primary">
          {t("title")}
        </h2>
        <p className="text-text-secondary">{t("subtitle")}</p>
      </div>

      <Input
        label={t("name")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={cn(errors.name && "border-red-500")}
        required
      />

      <Input
        label={t("email")}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={cn(errors.email && "border-red-500")}
        required
      />

      <Input
        label={t("phone")}
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="quiz-message"
          className="text-sm font-medium text-text-secondary"
        >
          {t("message")}
        </label>
        <textarea
          id="quiz-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className={cn(
            "w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary",
            "placeholder:text-text-muted",
            "transition-colors duration-150",
            "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
            "resize-none",
          )}
        />
      </div>

      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="w-full"
        disabled={submitting}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  );
}
