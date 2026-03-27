"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard, type PortfolioProject } from "./project-card";

const filterKeys = [
  "all",
  "landing",
  "corporate",
  "store",
  "bot",
  "webapp",
  "api",
  "fixes",
] as const;

const filterToType: Record<string, string | null> = {
  all: null,
  landing: "LANDING",
  corporate: "CORPORATE",
  store: "STORE",
  bot: "BOT",
  webapp: "WEBAPP",
  api: "API",
  fixes: "FIXES",
};

type PortfolioGridProps = {
  projects: PortfolioProject[];
  locale: string;
};

export function PortfolioGrid({ projects, locale }: PortfolioGridProps) {
  const t = useTranslations("portfolio.filter");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredProjects = activeFilter === "all"
    ? projects
    : projects.filter((p) => p.type === filterToType[activeFilter]);

  return (
    <div>
      <Tabs
        value={activeFilter}
        onValueChange={setActiveFilter}
        className="mb-8"
      >
        <TabsList className="flex flex-wrap gap-1">
          {filterKeys.map((key) => (
            <TabsTrigger key={key} value={key}>
              {t(key)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <div key={project.id} className="animate-card-enter">
            <ProjectCard project={project} locale={locale} />
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <p className="mt-12 text-center text-text-muted">
          No projects in this category yet.
        </p>
      )}
    </div>
  );
}
