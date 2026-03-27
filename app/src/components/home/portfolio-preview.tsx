import { serverApi } from "@/lib/api";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getLocalizedField } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PortfolioProject = {
  id: string;
  slug: string;
  type: string;
  status: string;
  featured: boolean;
  title_en: string;
  title_ru: string;
  description_en: string;
  description_ru: string;
  tech_stack: string[];
  thumbnail_url: string | null;
  live_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type PortfolioPreviewProps = {
  locale: string;
};

export async function PortfolioPreview({ locale }: PortfolioPreviewProps) {
  let projects: PortfolioProject[] = [];
  try {
    projects = await serverApi<PortfolioProject[]>("/api/public/portfolio?featured=true");
  } catch {
    // API unavailable — render empty state
  }

  return (
    <section className="py-20 sm:py-28" aria-labelledby="portfolio-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2
            id="portfolio-heading"
            className="mb-3 text-3xl font-bold text-text-primary md:text-4xl"
          >
            {locale === "ru" ? "Портфолио" : "Portfolio"}
          </h2>
          <p className="mx-auto max-w-2xl text-text-secondary">
            {locale === "ru"
              ? "Избранные проекты и кейсы"
              : "Selected projects and case studies"}
          </p>
        </div>

        {/* Project grid */}
        {projects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/portfolio/${project.slug}`}
                className="group block"
              >
                <Card className={cn(
                  "h-full transition-all duration-200",
                  "hover:border-accent/50 hover:shadow-md hover:shadow-shadow",
                )}>
                  {/* Thumbnail placeholder */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-bg-tertiary">
                    {project.thumbnail_url ? (
                      <img
                        src={project.thumbnail_url}
                        alt={getLocalizedField(project, "title", locale)}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center blueprint-grid-fine">
                        <span className="font-mono text-sm text-text-muted">
                          {project.slug}
                        </span>
                      </div>
                    )}
                    {/* Type badge overlay */}
                    <Badge
                      variant="accent"
                      className="absolute left-3 top-3"
                    >
                      {project.type}
                    </Badge>
                  </div>

                  <CardHeader>
                    <CardTitle className="group-hover:text-accent transition-colors duration-150">
                      {getLocalizedField(project, "title", locale)}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className="mb-4 line-clamp-2 text-sm text-text-secondary">
                      {getLocalizedField(project, "description", locale)}
                    </p>
                    {/* Tech stack badges */}
                    {project.tech_stack && project.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {project.tech_stack.slice(0, 3).map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                        {project.tech_stack.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.tech_stack.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-text-muted">
            {locale === "ru"
              ? "Проекты скоро появятся"
              : "Projects coming soon"}
          </p>
        )}

        {/* View all link */}
        <div className="mt-12 flex justify-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/portfolio">
              {locale === "ru" ? "Все проекты" : "View Portfolio"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
