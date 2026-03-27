"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/components/admin/project-form";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/portfolio"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-accent transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to portfolio
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">New Project</h1>
        <p className="text-sm text-text-secondary mt-1">
          Create a new portfolio project.
        </p>
      </div>

      <ProjectForm submitLabel="Create Project" />
    </div>
  );
}
