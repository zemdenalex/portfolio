import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { serverApi } from "@/lib/api";
import { EditProjectClient } from "@/components/admin/edit-project-client";

export const dynamic = "force-dynamic";

type BlockType = "TEXT" | "GALLERY" | "EMBED" | "CODE" | "METRICS" | "TESTIMONIAL";

type ProjectResponse = {
  id: string;
  title_en: string;
  title_ru: string;
  description_en: string;
  description_ru: string;
  type: string;
  status: string;
  slug: string;
  tech_stack: string[];
  thumbnail_url: string;
  live_url: string;
  featured: boolean;
  blocks: {
    id: string;
    type: BlockType;
    sort_order: number;
    content: Record<string, unknown>;
  }[];
};

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let project: ProjectResponse | null = null;
  try {
    project = await serverApi<ProjectResponse>(`/api/admin/portfolio/${id}`, cookieHeader);
  } catch {
    notFound();
  }

  if (!project) {
    notFound();
  }

  const projectData = {
    id: project.id,
    titleEn: project.title_en,
    titleRu: project.title_ru,
    descriptionEn: project.description_en,
    descriptionRu: project.description_ru,
    type: project.type,
    status: project.status,
    slug: project.slug,
    techStack: project.tech_stack ?? [],
    thumbnailUrl: project.thumbnail_url ?? "",
    liveUrl: project.live_url ?? "",
    featured: project.featured,
  };

  const blocksData = (project.blocks ?? []).map((block) => ({
    id: block.id,
    type: block.type,
    order: block.sort_order,
    content: block.content,
  }));

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/portfolio"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-accent transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to portfolio
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">
          Edit: {project.title_en}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Update project details and manage content blocks.
        </p>
      </div>

      <EditProjectClient project={projectData} blocks={blocksData} />
    </div>
  );
}
