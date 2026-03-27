import { HeroSection } from "@/components/home/hero-section";
import { PortfolioPreview } from "@/components/home/portfolio-preview";
import { QuizCTA } from "@/components/home/quiz-cta";

type Props = {
  params: Promise<{ locale: string }>;
};

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
