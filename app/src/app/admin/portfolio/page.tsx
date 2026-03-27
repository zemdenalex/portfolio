import Link from "next/link";
import { cookies } from "next/headers";
import { serverApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import { DeleteProjectButton } from "@/components/admin/delete-project-button";

export const dynamic = "force-dynamic";

type ProjectItem = {
  id: string;
  title_en: string;
  slug: string;
  type: string;
  status: string;
  sort_order: number;
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export default async function PortfolioListPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let projects: ProjectItem[] = [];
  try {
    projects = await serverApi<ProjectItem[]>("/api/admin/portfolio", cookieHeader);
  } catch {
    // API unavailable
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Portfolio</h1>
          <p className="text-sm text-text-secondary mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="accent" asChild>
          <Link href="/admin/portfolio/new">
            <Plus className="w-4 h-4 mr-1" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Project list */}
      {projects.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-text-muted mb-4">No projects yet.</p>
          <Button variant="accent" asChild>
            <Link href="/admin/portfolio/new">
              <Plus className="w-4 h-4 mr-1" />
              Create your first project
            </Link>
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid md:grid-cols-[60px_1fr_120px_120px_100px] gap-4 px-4 py-3 bg-bg-tertiary text-xs font-medium text-text-muted uppercase tracking-wider">
            <span>Order</span>
            <span>Title</span>
            <span>Type</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Table rows */}
          {projects.map((project) => (
            <div
              key={project.id}
              className="grid grid-cols-1 md:grid-cols-[60px_1fr_120px_120px_100px] gap-2 md:gap-4 items-center px-4 py-3 border-t border-border bg-bg-secondary hover:bg-bg-tertiary transition-colors"
            >
              {/* Order */}
              <span className="text-sm text-text-muted font-mono">
                <span className="md:hidden text-xs text-text-muted mr-1">#</span>
                {project.sort_order}
              </span>

              {/* Title */}
              <div className="min-w-0">
                <Link
                  href={`/admin/portfolio/${project.id}/edit`}
                  className="text-sm font-medium text-text-primary hover:text-accent transition-colors truncate block"
                >
                  {project.title_en}
                </Link>
                <span className="text-xs text-text-muted truncate block">
                  /{project.slug}
                </span>
              </div>

              {/* Type */}
              <Badge variant="outline" className="w-fit text-xs">
                {project.type}
              </Badge>

              {/* Status */}
              <span
                className={`inline-flex items-center w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[project.status] ?? ""
                }`}
              >
                {project.status}
              </span>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/portfolio/${project.id}/edit`}>
                    <Pencil className="w-4 h-4" />
                  </Link>
                </Button>
                <DeleteProjectButton projectId={project.id} projectTitle={project.title_en} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
