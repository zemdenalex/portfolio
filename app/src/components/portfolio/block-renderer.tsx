import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

/** Content block from Go API (snake_case fields) */
export type ContentBlock = {
  id: string;
  project_id: string;
  type: string;
  content: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type BlockContent = Record<string, unknown>;

function getField(content: BlockContent, field: string, locale: string): string {
  // snake_case (Go API): text_en, text_ru
  const snakeKey = `${field}_${locale}`;
  if (content[snakeKey] != null) return content[snakeKey] as string;

  // camelCase fallback: textEn, textRu
  const camelKey = `${field}${locale === "ru" ? "Ru" : "En"}`;
  if (content[camelKey] != null) return content[camelKey] as string;

  // plain field fallback
  return (content[field] as string) ?? "";
}

function getStringArray(content: BlockContent, field: string, locale: string): string[] {
  const snakeKey = `${field}_${locale}`;
  const camelKey = `${field}${locale === "ru" ? "Ru" : "En"}`;
  const value = content[snakeKey] ?? content[camelKey] ?? content[field];
  if (Array.isArray(value)) return value as string[];
  return [];
}

/* ─── Text Block ─────────────────────────────────── */

function TextBlock({ content, locale }: { content: BlockContent; locale: string }) {
  const text = getField(content, "text", locale);
  return (
    <div className="prose max-w-none text-text-secondary">
      <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}

/* ─── Gallery Block ──────────────────────────────── */

function GalleryBlock({ content }: { content: BlockContent }) {
  const images = (content.images as string[]) ?? [];
  const columns = (content.columns as number) ?? 3;

  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-2 lg:grid-cols-4",
      )}
    >
      {images.length > 0
        ? images.map((src, i) => (
            <div
              key={i}
              className="aspect-video overflow-hidden rounded-lg border border-border bg-bg-tertiary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Gallery image ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))
        : Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className="aspect-video rounded-lg border border-border bg-bg-tertiary"
            >
              <div className="flex h-full items-center justify-center text-text-muted text-sm">
                Placeholder
              </div>
            </div>
          ))}
    </div>
  );
}

/* ─── Embed Block ────────────────────────────────── */

function EmbedBlock({ content }: { content: BlockContent }) {
  const url = content.url as string | undefined;
  if (!url) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
      <iframe
        src={url}
        title="Embedded content"
        className="absolute inset-0 h-full w-full"
        loading="lazy"
        allowFullScreen
      />
    </div>
  );
}

/* ─── Code Block ─────────────────────────────────── */

function CodeBlock({ content }: { content: BlockContent }) {
  const code = content.code as string | undefined;
  const language = (content.language as string) ?? "text";

  if (!code) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-bg-tertiary">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <Badge variant="outline" className="text-xs font-mono">
          {language}
        </Badge>
      </div>
      <pre className="overflow-x-auto p-4">
        <code className="text-sm font-mono text-text-primary">{code}</code>
      </pre>
    </div>
  );
}

/* ─── Metrics Block ──────────────────────────────── */

type MetricItem = {
  label_en?: string;
  label_ru?: string;
  labelEn?: string;
  labelRu?: string;
  label?: string;
  value: string;
};

function MetricsBlock({ content, locale }: { content: BlockContent; locale: string }) {
  const metrics = (content.metrics as MetricItem[]) ?? [];

  if (metrics.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, i) => {
        const label =
          (locale === "ru"
            ? (metric.label_ru ?? metric.labelRu)
            : (metric.label_en ?? metric.labelEn)) ??
          metric.label ??
          "";
        return (
          <Card key={i}>
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold text-accent">{metric.value}</p>
              <p className="mt-1 text-sm text-text-secondary">{label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ─── Testimonial Block ──────────────────────────── */

function TestimonialBlock({
  content,
  locale,
}: {
  content: BlockContent;
  locale: string;
}) {
  // Editor saves as "quote", renderer also checks "text" for flexibility
  const text = getField(content, "quote", locale) || getField(content, "text", locale);
  const author = getField(content, "author", locale);
  const role = getField(content, "role", locale);

  return (
    <Card className="border-l-4 border-l-accent">
      <CardContent className="p-6">
        <Quote className="mb-3 h-6 w-6 text-accent opacity-50" />
        <blockquote className="mb-4 text-lg italic text-text-primary leading-relaxed">
          &ldquo;{text}&rdquo;
        </blockquote>
        {(author || role) && (
          <div className="text-sm text-text-secondary">
            {author && <span className="font-medium text-text-primary">{author}</span>}
            {author && role && <span> &mdash; </span>}
            {role && <span>{role}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Main Renderer ──────────────────────────────── */

type BlockRendererProps = {
  blocks: ContentBlock[];
  locale: string;
};

export function BlockRenderer({ blocks, locale }: BlockRendererProps) {
  const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="flex flex-col gap-8">
      {sorted.map((block) => {
        const content = block.content as BlockContent;

        switch (block.type) {
          case "TEXT":
            return <TextBlock key={block.id} content={content} locale={locale} />;
          case "GALLERY":
            return <GalleryBlock key={block.id} content={content} />;
          case "EMBED":
            return <EmbedBlock key={block.id} content={content} />;
          case "CODE":
            return <CodeBlock key={block.id} content={content} />;
          case "METRICS":
            return <MetricsBlock key={block.id} content={content} locale={locale} />;
          case "TESTIMONIAL":
            return (
              <TestimonialBlock key={block.id} content={content} locale={locale} />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
