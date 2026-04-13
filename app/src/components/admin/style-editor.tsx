"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Palette,
  Camera,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────

type RefType = "OWN_PROJECT" | "DEMO" | "EXTERNAL";

type StyleRefData = {
  id: string;
  url: string;
  label_en: string;
  label_ru: string;
  type: string;
  sort_order: number;
  screenshot_url: string | null;
  embeddable: boolean;
};

type StyleData = {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  references: StyleRefData[];
};

// ─── Styles List ─────────────────────────────────────

export function StylesList({ styles }: { styles: StyleData[] }) {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {styles.length} style{styles.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={() => setShowNew(!showNew)} size="sm">
          <Plus className="h-4 w-4" />
          {showNew ? "Cancel" : "Add Style"}
        </Button>
      </div>

      {showNew && (
        <NewStyleForm
          onDone={() => setShowNew(false)}
        />
      )}

      {styles.length === 0 && !showNew && (
        <p className="text-text-muted text-sm py-8 text-center">
          No styles yet. Add one to get started.
        </p>
      )}

      {styles.map((style) => (
        <StyleCard key={style.id} style={style} />
      ))}
    </div>
  );
}

// ─── New Style Form ──────────────────────────────────

function NewStyleForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descRu, setDescRu] = useState("");

  async function handleSubmit() {
    if (!slug.trim() || !nameEn.trim()) return;
    setLoading(true);
    try {
      await api("/api/admin/styles", {
        method: "POST",
        body: JSON.stringify({
          slug,
          name_en: nameEn,
          name_ru: nameRu,
          description_en: descEn,
          description_ru: descRu,
        }),
      });
      onDone();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">New Style</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="minimalist" />
          <Input label="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Minimalist" />
          <Input label="Name (RU)" value={nameRu} onChange={(e) => setNameRu(e.target.value)} placeholder="" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Description (EN)" value={descEn} onChange={(e) => setDescEn(e.target.value)} />
          <Input label="Description (RU)" value={descRu} onChange={(e) => setDescRu(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSubmit} disabled={loading || !slug.trim() || !nameEn.trim()}>
            <Save className="h-3 w-3" /> Create
          </Button>
          <Button variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Style Card ──────────────────────────────────────

function StyleCard({ style }: { style: StyleData }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [slug, setSlug] = useState(style.slug);
  const [nameEn, setNameEn] = useState(style.name_en);
  const [nameRu, setNameRu] = useState(style.name_ru);
  const [descEn, setDescEn] = useState(style.description_en);
  const [descRu, setDescRu] = useState(style.description_ru);

  async function handleSave() {
    setLoading(true);
    try {
      await api(`/api/admin/styles/${style.id}`, {
        method: "PUT",
        body: JSON.stringify({
          slug,
          name_en: nameEn,
          name_ru: nameRu,
          description_en: descEn,
          description_ru: descRu,
        }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete style "${style.name_en}"?`)) return;
    setLoading(true);
    try {
      await api(`/api/admin/styles/${style.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <Palette className="h-4 w-4 text-accent" />
          <CardTitle className="text-sm flex-1">
            {style.name_en}
            {style.name_ru && <span className="text-text-muted ml-2">/ {style.name_ru}</span>}
          </CardTitle>
          <Badge variant="outline">{style.slug}</Badge>
          <Badge>{style.references.length} ref{style.references.length !== 1 ? "s" : ""}</Badge>
          <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
            {editing ? "Cancel" : "Edit"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </CardHeader>

      {(expanded || editing) && (
        <CardContent className="p-4 pt-2 space-y-4">
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                <Input label="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
                <Input label="Name (RU)" value={nameRu} onChange={(e) => setNameRu(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Description (EN)" value={descEn} onChange={(e) => setDescEn(e.target.value)} />
                <Input label="Description (RU)" value={descRu} onChange={(e) => setDescRu(e.target.value)} />
              </div>
              <Button size="sm" onClick={handleSave} disabled={loading}>
                <Save className="h-3 w-3" /> Save
              </Button>
            </div>
          )}

          {!editing && expanded && (
            <div className="text-sm text-text-secondary">
              <p>{style.description_en}</p>
              {style.description_ru && (
                <p className="text-text-muted">{style.description_ru}</p>
              )}
            </div>
          )}

          <ReferencesEditor
            styleId={style.id}
            references={style.references}
          />
        </CardContent>
      )}
    </Card>
  );
}

// ─── Ref Row ────────────────────────────────────────

function RefRow({
  ref_,
  styleId,
  onDelete,
  loading: parentLoading,
}: {
  ref_: StyleRefData;
  styleId: string;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const router = useRouter();
  const [capturing, setCapturing] = useState(false);

  async function handleCapture() {
    setCapturing(true);
    try {
      await api("/api/admin/screenshot", {
        method: "POST",
        body: JSON.stringify({
          url: ref_.url,
          reference_id: ref_.id,
        }),
      });
      router.refresh();
    } finally {
      setCapturing(false);
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {ref_.screenshot_url ? (
        <img
          src={ref_.screenshot_url}
          alt=""
          className="h-8 w-12 rounded border border-border object-cover object-top shrink-0"
        />
      ) : (
        <div className="flex h-8 w-12 items-center justify-center rounded border border-border bg-bg-tertiary shrink-0">
          <ImageIcon className="h-3 w-3 text-text-muted" />
        </div>
      )}
      <Badge variant="outline" className="text-xs shrink-0">
        {ref_.type}
      </Badge>
      {ref_.embeddable && (
        <Badge className="text-xs shrink-0 bg-green-500/10 text-green-600">
          iframe
        </Badge>
      )}
      <a
        href={ref_.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:underline flex items-center gap-1 flex-1 truncate"
      >
        {ref_.label_en}
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCapture}
        disabled={capturing}
        title="Capture screenshot"
      >
        {capturing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Camera className="h-3 w-3" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(ref_.id)}
        disabled={parentLoading}
      >
        <Trash2 className="h-3 w-3 text-red-500" />
      </Button>
    </div>
  );
}

// ─── References Editor ───────────────────────────────

const REF_TYPES: RefType[] = ["OWN_PROJECT", "DEMO", "EXTERNAL"];

function ReferencesEditor({
  styleId,
  references,
}: {
  styleId: string;
  references: StyleRefData[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [labelRu, setLabelRu] = useState("");
  const [refType, setRefType] = useState<RefType>("EXTERNAL");

  async function handleAdd() {
    if (!url.trim() || !labelEn.trim()) return;
    setLoading(true);
    try {
      await api(`/api/admin/styles/${styleId}/references`, {
        method: "POST",
        body: JSON.stringify({
          url,
          label_en: labelEn,
          label_ru: labelRu,
          type: refType,
          sort_order: references.length,
        }),
      });
      setUrl("");
      setLabelEn("");
      setLabelRu("");
      setShowAdd(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRef(id: string) {
    setLoading(true);
    try {
      await api(`/api/admin/styles/${styleId}/references/${id}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
          References
        </p>
        <Button variant="ghost" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {[...references]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((ref) => (
          <RefRow
            key={ref.id}
            ref_={ref}
            styleId={styleId}
            onDelete={handleDeleteRef}
            loading={loading}
          />
        ))}

      {showAdd && (
        <div className="space-y-2 p-3 rounded-md bg-bg-tertiary">
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="text-sm h-8"
            />
            <Select value={refType} onValueChange={(v) => setRefType(v as RefType)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REF_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
              placeholder="Label EN"
              className="text-sm h-8"
            />
            <Input
              value={labelRu}
              onChange={(e) => setLabelRu(e.target.value)}
              placeholder="Label RU"
              className="text-sm h-8"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={loading || !url.trim() || !labelEn.trim()}
            >
              <Plus className="h-3 w-3" /> Add Reference
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
