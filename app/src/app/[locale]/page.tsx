import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { PortfolioPreview } from "@/components/home/portfolio-preview";
import { QuizCTA } from "@/components/home/quiz-cta";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isRu = locale === "ru";
  return {
    title: isRu ? "Archifex — Веб-студия" : "Archifex — Web Architecture Studio",
    description: isRu
      ? "Проектируем и строим современные сайты, приложения и Telegram-боты. От идеи до производства."
      : "We design and build modern websites, applications, and Telegram bots. From blueprint to production.",
    openGraph: {
      type: "website",
      title: isRu ? "Archifex — Веб-студия" : "Archifex — Web Architecture Studio",
      description: isRu
        ? "Проектируем и строим современные сайты, приложения и Telegram-боты."
        : "We design and build modern websites, applications, and Telegram bots.",
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <HeroSection />
      <PortfolioPreview locale={locale} />
      <QuizCTA />
    </>
  );
}
