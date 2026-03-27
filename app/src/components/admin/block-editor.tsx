"use client";

import { useState, useCallback, useRef } from "react";
import {
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Type,
  Image,
  Code,
  BarChart3,
  Quote,
  ExternalLink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type BlockType = "TEXT" | "GALLERY" | "EMBED" | "CODE" | "METRICS" | "TESTIMONIAL";

// ─── Types ────────────────────────────────────────

interface TextContent {
  textEn: string;
  textRu: string;
}

interface GalleryContent {
  images: string[];
}

interface EmbedContent {
  url: string;
  titleEn: string;
  titleRu: string;
}

interface CodeContent {
  code: string;
  language: string;
  captionEn: string;
  captionRu: string;
}

interface MetricItem {
  value: string;
  labelEn: string;
  labelRu: string;
}

interface MetricsContent {
  metrics: MetricItem[];
}

interface TestimonialContent {
  quoteEn: string;
  quoteRu: string;
  author: string;
  role: string;
  avatar: string;
}

type BlockContent =
  | TextContent
  | GalleryContent
  | EmbedContent
  | CodeContent
  | MetricsContent
  | TestimonialContent;

interface Block {
  id: string;
  type: BlockType;
  order: number;
  content: BlockContent;
}

interface BlockEditorProps {
  projectId: string;
  initialBlocks: Block[];
}

// ─── Block type config ────────────────────────────

const BLOCK_TYPES: { type: BlockType; label: string; icon: typeof Type; defaultContent: BlockContent }[] = [
  { type: "TEXT", label: "Text", icon: Type, defaultContent: { textEn: "", textRu: "" } },
  { type: "GALLERY", label: "Gallery", icon: Image, defaultContent: { images: [] } },
  { type: "EMBED", label: "Embed", icon: ExternalLink, defaultContent: { url: "", titleEn: "", titleRu: "" } },
  { type: "CODE", label: "Code", icon: Code, defaultContent: { code: "", language: "", captionEn: "", captionRu: "" } },
  { type: "METRICS", label: "Metrics", icon: BarChart3, defaultContent: { metrics: [] } },
  { type: "TESTIMONIAL", label: "Testimonial", icon: Quote, defaultContent: { quoteEn: "", quoteRu: "", author: "", role: "", avatar: "" } },
];

function getBlockIcon(type: BlockType) {
  const config = BLOCK_TYPES.find((b) => b.type === type);
  return config?.icon ?? Type;
}

// ─── Default content factory ──────────────────────

function getDefaultContent(type: BlockType): BlockContent {
  const config = BLOCK_TYPES.find((b) => b.type === type);
  return config?.defaultContent ?? { textEn: "", textRu: "" };
}

// ─── Helper: swap two items in an array ───────────

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

// ─── Block Item ──────────────────────────────────

interface BlockItemProps {
  block: Block;
  index: number;
  total: number;
  onRemove: (id: string) => void;
  onContentChange: (id: string, content: BlockContent) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

function BlockItem({ block, index, total, onRemove, onContentChange, onMoveUp, onMoveDown }: BlockItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const Icon = getBlockIcon(block.type);

  return (
    <>
      <div
        className="border border-border rounded-lg bg-bg-secondary p-4"
      >
        {/* Block header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onMoveUp(index)}
              className="text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={() => onMoveDown(index)}
              className="text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <Badge variant="accent" className="gap-1">
            <Icon className="w-3 h-3" />
            {block.type}
          </Badge>
          <div className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            className="text-text-muted hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Block content editor */}
        <BlockContentEditor
          type={block.type}
          content={block.content}
          onChange={(content) => onContentChange(block.id, content)}
        />
      </div>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete block</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {block.type.toLowerCase()} block? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                onRemove(block.id);
                setConfirmDelete(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Block Content Editors ────────────────────────

interface BlockContentEditorProps {
  type: BlockType;
  content: BlockContent;
  onChange: (content: BlockContent) => void;
}

function BlockContentEditor({ type, content, onChange }: BlockContentEditorProps) {
  switch (type) {
    case "TEXT":
      return <TextBlockEditor content={content as TextContent} onChange={onChange} />;
    case "GALLERY":
      return <GalleryBlockEditor content={content as GalleryContent} onChange={onChange} />;
    case "EMBED":
      return <EmbedBlockEditor content={content as EmbedContent} onChange={onChange} />;
    case "CODE":
      return <CodeBlockEditor content={content as CodeContent} onChange={onChange} />;
    case "METRICS":
      return <MetricsBlockEditor content={content as MetricsContent} onChange={onChange} />;
    case "TESTIMONIAL":
      return <TestimonialBlockEditor content={content as TestimonialContent} onChange={onChange} />;
    default:
      return <p className="text-sm text-text-muted">Unknown block type</p>;
  }
}

const textareaClasses =
  "w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-y";

function TextBlockEditor({ content, onChange }: { content: TextContent; onChange: (c: BlockContent) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const debouncedChange = useCallback(
    (field: keyof TextContent, value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange({ ...content, [field]: value });
      }, 500);
    },
    [content, onChange],
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-text-muted">Text (EN)</label>
        <textarea
          defaultValue={content.textEn}
          onBlur={(e) => onChange({ ...content, textEn: e.target.value })}
          onChange={(e) => debouncedChange("textEn", e.target.value)}
          rows={4}
          className={textareaClasses}
          placeholder="English text..."
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-text-muted">Text (RU)</label>
        <textarea
          defaultValue={content.textRu}
          onBlur={(e) => onChange({ ...content, textRu: e.target.value })}
          onChange={(e) => debouncedChange("textRu", e.target.value)}
          rows={4}
          className={textareaClasses}
          placeholder="Russian text..."
        />
      </div>
    </div>
  );
}

function GalleryBlockEditor({ content, onChange }: { content: GalleryContent; onChange: (c: BlockContent) => void }) {
  const [newUrl, setNewUrl] = useState("");

  function addImage() {
    const url = newUrl.trim();
    if (!url) return;
    onChange({ images: [...content.images, url] });
    setNewUrl("");
  }

  function removeImage(index: number) {
    const updated = content.images.filter((_, i) => i !== index);
    onChange({ images: updated });
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-text-muted">Image URLs</label>
      {content.images.map((url, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="flex-1 text-sm text-text-secondary truncate">{url}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(i)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="https://image-url.com/..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addImage();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={addImage}>
          Add
        </Button>
      </div>
    </div>
  );
}

function EmbedBlockEditor({ content, onChange }: { content: EmbedContent; onChange: (c: BlockContent) => void }) {
  return (
    <div className="space-y-3">
      <Input
        label="URL"
        defaultValue={content.url}
        onBlur={(e) => onChange({ ...content, url: e.target.value })}
        placeholder="https://..."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="Title (EN)"
          defaultValue={content.titleEn}
          onBlur={(e) => onChange({ ...content, titleEn: e.target.value })}
        />
        <Input
          label="Title (RU)"
          defaultValue={content.titleRu}
          onBlur={(e) => onChange({ ...content, titleRu: e.target.value })}
        />
      </div>
    </div>
  );
}

function CodeBlockEditor({ content, onChange }: { content: CodeContent; onChange: (c: BlockContent) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-text-muted">Code</label>
        <textarea
          defaultValue={content.code}
          onBlur={(e) => onChange({ ...content, code: e.target.value })}
          rows={6}
          className={cn(textareaClasses, "font-mono text-xs")}
          placeholder="// your code here..."
        />
      </div>
      <Input
        label="Language"
        defaultValue={content.language}
        onBlur={(e) => onChange({ ...content, language: e.target.value })}
        placeholder="typescript, python, go..."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="Caption (EN)"
          defaultValue={content.captionEn}
          onBlur={(e) => onChange({ ...content, captionEn: e.target.value })}
        />
        <Input
          label="Caption (RU)"
          defaultValue={content.captionRu}
          onBlur={(e) => onChange({ ...content, captionRu: e.target.value })}
        />
      </div>
    </div>
  );
}

function MetricsBlockEditor({ content, onChange }: { content: MetricsContent; onChange: (c: BlockContent) => void }) {
  function addMetric() {
    onChange({
      metrics: [...content.metrics, { value: "", labelEn: "", labelRu: "" }],
    });
  }

  function removeMetric(index: number) {
    onChange({
      metrics: content.metrics.filter((_, i) => i !== index),
    });
  }

  function updateMetric(index: number, field: keyof MetricItem, value: string) {
    const updated = content.metrics.map((m, i) =>
      i === index ? { ...m, [field]: value } : m,
    );
    onChange({ metrics: updated });
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-text-muted">Metrics</label>
      {content.metrics.map((metric, i) => (
        <div key={i} className="flex items-start gap-2 p-3 border border-border-light rounded-md bg-bg-primary">
          <div className="flex-1 grid grid-cols-3 gap-2">
            <Input
              placeholder="Value"
              defaultValue={metric.value}
              onBlur={(e) => updateMetric(i, "value", e.target.value)}
            />
            <Input
              placeholder="Label EN"
              defaultValue={metric.labelEn}
              onBlur={(e) => updateMetric(i, "labelEn", e.target.value)}
            />
            <Input
              placeholder="Label RU"
              defaultValue={metric.labelRu}
              onBlur={(e) => updateMetric(i, "labelRu", e.target.value)}
            />
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => removeMetric(i)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addMetric}>
        <Plus className="w-4 h-4 mr-1" />
        Add Metric
      </Button>
    </div>
  );
}

function TestimonialBlockEditor({ content, onChange }: { content: TestimonialContent; onChange: (c: BlockContent) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">Quote (EN)</label>
          <textarea
            defaultValue={content.quoteEn}
            onBlur={(e) => onChange({ ...content, quoteEn: e.target.value })}
            rows={3}
            className={textareaClasses}
            placeholder="English quote..."
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">Quote (RU)</label>
          <textarea
            defaultValue={content.quoteRu}
            onBlur={(e) => onChange({ ...content, quoteRu: e.target.value })}
            rows={3}
            className={textareaClasses}
            placeholder="Russian quote..."
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          label="Author"
          defaultValue={content.author}
          onBlur={(e) => onChange({ ...content, author: e.target.value })}
          placeholder="John Doe"
        />
        <Input
          label="Role"
          defaultValue={content.role}
          onBlur={(e) => onChange({ ...content, role: e.target.value })}
          placeholder="CEO at Company"
        />
        <Input
          label="Avatar URL"
          defaultValue={content.avatar}
          onBlur={(e) => onChange({ ...content, avatar: e.target.value })}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}

// ─── Block Editor ─────────────────────────────────

export function BlockEditor({ projectId, initialBlocks }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const handleMove = useCallback(
    async (fromIndex: number, toIndex: number) => {
      const reordered = arrayMove(blocks, fromIndex, toIndex);
      setBlocks(reordered);
      await api(`/api/admin/portfolio/${projectId}/blocks/reorder`, {
        method: "PUT",
        body: JSON.stringify({ block_ids: reordered.map((b) => b.id) }),
      });
    },
    [blocks, projectId],
  );

  const handleAddBlock = useCallback(
    async (type: BlockType) => {
      setShowTypePicker(false);
      const defaultContent = getDefaultContent(type);
      const result = await api<{ id: string }>(`/api/admin/portfolio/${projectId}/blocks`, {
        method: "POST",
        body: JSON.stringify({ type, content: defaultContent }),
      });
      const newBlock: Block = {
        id: result.id,
        type,
        order: blocks.length,
        content: defaultContent,
      };
      setBlocks((prev) => [...prev, newBlock]);
    },
    [projectId, blocks.length],
  );

  const handleRemoveBlock = useCallback(
    async (id: string) => {
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      await api(`/api/admin/portfolio/${projectId}/blocks/${id}`, {
        method: "DELETE",
      });
    },
    [projectId],
  );

  const handleContentChange = useCallback(
    async (id: string, content: BlockContent) => {
      setBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, content } : b)),
      );
      await api(`/api/admin/portfolio/${projectId}/blocks/${id}`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });
    },
    [projectId],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          Content Blocks
        </h2>
        <Button
          type="button"
          variant="accent"
          size="sm"
          onClick={() => setShowTypePicker(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Block
        </Button>
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-text-muted text-sm">
            No content blocks yet. Click &quot;Add Block&quot; to start building.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {blocks.map((block, index) => (
          <BlockItem
            key={block.id}
            block={block}
            index={index}
            total={blocks.length}
            onRemove={handleRemoveBlock}
            onContentChange={handleContentChange}
            onMoveUp={(i) => handleMove(i, i - 1)}
            onMoveDown={(i) => handleMove(i, i + 1)}
          />
        ))}
      </div>

      {/* Add Block Type Picker */}
      <Dialog open={showTypePicker} onOpenChange={setShowTypePicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Content Block</DialogTitle>
            <DialogDescription>
              Choose the type of content block to add.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {BLOCK_TYPES.map((bt) => {
              const Icon = bt.icon;
              return (
                <button
                  key={bt.type}
                  type="button"
                  onClick={() => handleAddBlock(bt.type)}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border bg-bg-primary hover:bg-bg-secondary hover:border-accent transition-colors text-left"
                >
                  <Icon className="w-5 h-5 text-accent shrink-0" />
                  <span className="text-sm font-medium text-text-primary">
                    {bt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
