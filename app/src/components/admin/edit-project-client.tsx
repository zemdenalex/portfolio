"use client";

import { type ComponentProps } from "react";
import { ProjectForm } from "@/components/admin/project-form";
import { BlockEditor } from "@/components/admin/block-editor";

type BlockType = "TEXT" | "GALLERY" | "EMBED" | "CODE" | "METRICS" | "TESTIMONIAL";

interface ProjectData {
  id: string;
  titleEn: string;
  titleRu: string;
  descriptionEn: string;
  descriptionRu: string;
  type: string;
  status: string;
  slug: string;
  techStack: string[];
  thumbnailUrl: string;
  liveUrl: string;
  featured: boolean;
}

interface BlockData {
  id: string;
  type: BlockType;
  order: number;
  content: Record<string, unknown>;
}

interface EditProjectClientProps {
  project: ProjectData;
  blocks: BlockData[];
}

export function EditProjectClient({ project, blocks }: EditProjectClientProps) {
  return (
    <div className="space-y-10">
      {/* Project form */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Project Details
        </h2>
        <ProjectForm
          initialData={project}
          submitLabel="Save Changes"
        />
      </section>

      {/* Separator */}
      <hr className="border-border" />

      {/* Block editor */}
      <section>
        <BlockEditor projectId={project.id} initialBlocks={blocks as unknown as ComponentProps<typeof BlockEditor>["initialBlocks"]} />
      </section>
    </div>
  );
}
