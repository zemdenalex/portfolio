import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { serverApi } from "@/lib/api";
import { getLocalizedField } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BlockRenderer, type ContentBlock } from "@/components/portfolio/block-renderer";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PortfolioProject } from "@/components/portfolio/project-card";

export const dynamic = "force-dynamic";

type ProjectWithBlocks = PortfolioProject & {
  blocks: ContentBlock[];
};

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const project = await serverApi<PortfolioProject>(`/api/public/portfolio/${slug}`);
    const title = getLocalizedField(project, "title", locale);
    const description = getLocalizedField(project, "description", locale);
    return { title, description };
  } catch {
    return { title: "Not Found" };
  }
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const projects = await serverApi<PortfolioProject[]>("/api/public/portfolio");
    return projects.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export default async function ProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });

  let project: ProjectWithBlocks;
  try {
    project = await serverApi<ProjectWithBlocks>(`/api/public/portfolio/${slug}`);
  } catch {
    notFound();
  }

  const title = getLocalizedField(project, "title", locale);
  const description = getLocalizedField(project, "description", locale);
  const typeLabel = project.type.charAt(0) + project.type.slice(1).toLowerCase();
  const techStack = project.tech_stack ?? [];
  const blocks = project.blocks ?? [];

  return (
    <main className="min-h-screen">
      <article className="mx-auto max-w-4xl px-6 py-20">
        {/* Back link */}
        <Link
          href="/portfolio"
          className="mb-8 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("title")}
        </Link>

        {/* Project header */}
        <header className="mb-12">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="accent">{typeLabel}</Badge>
          </div>

          <h1 className="mb-4 text-4xl font-extrabold text-text-primary md:text-5xl">
            {title}
          </h1>

          <p className="mb-6 text-lg text-text-secondary leading-relaxed">
            {description}
          </p>

          {/* Tech stack */}
          {techStack.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-text-muted">
                {t("techStack")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Live URL */}
          {project.live_url && (
            <Button variant="accent" size="md" asChild>
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                {t("liveUrl")}
              </a>
            </Button>
          )}
        </header>

        {/* Content blocks */}
        {blocks.length > 0 && (
          <section>
            <BlockRenderer blocks={blocks} locale={locale} />
          </section>
        )}
      </article>
    </main>
  );
}
