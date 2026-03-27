import { Link } from "@/i18n/navigation";
import { getLocalizedField, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Globe,
  Monitor,
  ShoppingCart,
  Bot,
  AppWindow,
  Server,
  Wrench,
  Layout,
} from "lucide-react";

export type PortfolioProject = {
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

const typeIcons: Record<string, typeof Globe> = {
  LANDING: Layout,
  CORPORATE: Monitor,
  STORE: ShoppingCart,
  BOT: Bot,
  WEBAPP: AppWindow,
  API: Server,
  FIXES: Wrench,
};

const typeColors: Record<string, string> = {
  LANDING: "bg-cyan-500/20 text-cyan-400",
  CORPORATE: "bg-blue-500/20 text-blue-400",
  STORE: "bg-green-500/20 text-green-400",
  BOT: "bg-purple-500/20 text-purple-400",
  WEBAPP: "bg-orange-500/20 text-orange-400",
  API: "bg-red-500/20 text-red-400",
  FIXES: "bg-yellow-500/20 text-yellow-400",
};

const thumbnailColors: Record<string, string> = {
  LANDING: "from-cyan-500/30 to-cyan-700/30",
  CORPORATE: "from-blue-500/30 to-blue-700/30",
  STORE: "from-green-500/30 to-green-700/30",
  BOT: "from-purple-500/30 to-purple-700/30",
  WEBAPP: "from-orange-500/30 to-orange-700/30",
  API: "from-red-500/30 to-red-700/30",
  FIXES: "from-yellow-500/30 to-yellow-700/30",
};

type ProjectCardProps = {
  project: PortfolioProject;
  locale: string;
};

export function ProjectCard({ project, locale }: ProjectCardProps) {
  const title = getLocalizedField(project, "title", locale);
  const description = getLocalizedField(project, "description", locale);
  const Icon = typeIcons[project.type] ?? Globe;
  const typeLabel = project.type.charAt(0) + project.type.slice(1).toLowerCase();
  const techStack = project.tech_stack ?? [];

  return (
    <Link href={`/portfolio/${project.slug}`}>
      <Card
        className={cn(
          "group overflow-hidden transition-all duration-200",
          "hover:border-accent hover:shadow-md hover:shadow-shadow-lg",
        )}
      >
        {/* Thumbnail placeholder */}
        <div
          className={cn(
            "relative flex h-48 items-center justify-center",
            "bg-gradient-to-br",
            thumbnailColors[project.type] ?? "from-gray-500/30 to-gray-700/30",
          )}
        >
          <Icon className="h-12 w-12 text-text-muted opacity-60 transition-transform duration-200 group-hover:scale-110" />
          <div className="absolute left-3 top-3">
            <Badge
              variant="accent"
              className={cn(typeColors[project.type])}
            >
              {typeLabel}
            </Badge>
          </div>
        </div>

        <CardContent className="p-5">
          <h3 className="mb-1.5 text-lg font-semibold text-text-primary line-clamp-1">
            {title}
          </h3>
          <p className="mb-3 text-sm text-text-secondary line-clamp-2">
            {description}
          </p>

          {/* Tech stack badges */}
          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {techStack.slice(0, 4).map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
              {techStack.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{techStack.length - 4}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
