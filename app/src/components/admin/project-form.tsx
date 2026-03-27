"use client";

import { useState, useCallback, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugify } from "@/lib/utils";
import { X } from "lucide-react";

const PROJECT_TYPES = [
  { value: "LANDING", label: "Landing" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "STORE", label: "Store" },
  { value: "BOT", label: "Bot" },
  { value: "WEBAPP", label: "Web App" },
  { value: "API", label: "API" },
  { value: "FIXES", label: "Fixes" },
] as const;

const PROJECT_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

interface ProjectFormData {
  id?: string;
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

interface ProjectFormProps {
  initialData?: ProjectFormData;
  submitLabel: string;
}

export function ProjectForm({ initialData, submitLabel }: ProjectFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [titleEn, setTitleEn] = useState(initialData?.titleEn ?? "");
  const [titleRu, setTitleRu] = useState(initialData?.titleRu ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initialData?.descriptionEn ?? "");
  const [descriptionRu, setDescriptionRu] = useState(initialData?.descriptionRu ?? "");
  const [type, setType] = useState(initialData?.type ?? "LANDING");
  const [status, setStatus] = useState(initialData?.status ?? "DRAFT");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugManual, setSlugManual] = useState(!!initialData?.slug);
  const [techStack, setTechStack] = useState<string[]>(initialData?.techStack ?? []);
  const [techInput, setTechInput] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnailUrl ?? "");
  const [liveUrl, setLiveUrl] = useState(initialData?.liveUrl ?? "");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);

  const handleTitleEnChange = useCallback(
    (value: string) => {
      setTitleEn(value);
      if (!slugManual) {
        setSlug(slugify(value));
      }
    },
    [slugManual],
  );

  const handleSlugChange = useCallback((value: string) => {
    setSlugManual(true);
    setSlug(value);
  }, []);

  const handleTechKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const value = techInput.trim();
        if (value && !techStack.includes(value)) {
          setTechStack((prev) => [...prev, value]);
          setTechInput("");
        }
      }
    },
    [techInput, techStack],
  );

  const removeTech = useCallback((tag: string) => {
    setTechStack((prev) => prev.filter((t) => t !== tag));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title_en: titleEn,
        title_ru: titleRu,
        description_en: descriptionEn,
        description_ru: descriptionRu,
        type,
        status,
        slug,
        tech_stack: techStack,
        thumbnail_url: thumbnailUrl,
        live_url: liveUrl,
        featured,
      };

      if (initialData?.id) {
        // Update existing
        await api(`/api/admin/portfolio/${initialData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        const result = await api<{ id: string }>("/api/admin/portfolio", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (result?.id) {
          router.push(`/admin/portfolio/${result.id}/edit`);
          return;
        }
      }

      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Title (EN)"
          value={titleEn}
          onChange={(e) => handleTitleEnChange(e.target.value)}
          required
        />
        <Input
          label="Title (RU)"
          value={titleRu}
          onChange={(e) => setTitleRu(e.target.value)}
          required
        />
      </div>

      {/* Slug */}
      <Input
        label="Slug"
        value={slug}
        onChange={(e) => handleSlugChange(e.target.value)}
        required
        placeholder="auto-generated-from-title"
      />

      {/* Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="descriptionEn"
            className="text-sm font-medium text-text-secondary"
          >
            Description (EN)
          </label>
          <textarea
            id="descriptionEn"
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            required
            rows={4}
            className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="descriptionRu"
            className="text-sm font-medium text-text-secondary"
          >
            Description (RU)
          </label>
          <textarea
            id="descriptionRu"
            value={descriptionRu}
            onChange={(e) => setDescriptionRu(e.target.value)}
            required
            rows={4}
            className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          />
        </div>
      </div>

      {/* Type + Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">
          Tech Stack
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {techStack.map((tag) => (
            <Badge key={tag} variant="accent" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTech(tag)}
                className="hover:text-white/80"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          value={techInput}
          onChange={(e) => setTechInput(e.target.value)}
          onKeyDown={handleTechKeyDown}
          placeholder="Type tech and press Enter"
        />
      </div>

      {/* URLs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Thumbnail URL"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://..."
        />
        <Input
          label="Live URL"
          value={liveUrl}
          onChange={(e) => setLiveUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      {/* Featured */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
        />
        <span className="text-sm text-text-primary">Featured project</span>
      </label>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" variant="accent" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/portfolio")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
