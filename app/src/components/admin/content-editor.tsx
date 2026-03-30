"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, FileText } from "lucide-react";

// ─── Types ───────────────────────────────────────────

type ContentEntry = {
  id: string;
  key: string;
  value_en: string;
  value_ru: string;
};

// ─── Content Editor ──────────────────────────────────

export function ContentEditor({ entries }: { entries: ContentEntry[] }) {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {entries.length} entr{entries.length !== 1 ? "ies" : "y"}
        </p>
        <Button onClick={() => setShowNew(!showNew)} size="sm">
          <Plus className="h-4 w-4" />
          {showNew ? "Cancel" : "Add Entry"}
        </Button>
      </div>

      {showNew && <NewEntryForm onDone={() => setShowNew(false)} />}

      {entries.length === 0 && !showNew && (
        <p className="text-text-muted text-sm py-8 text-center">
          No content entries yet. Add one to get started.
        </p>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <ContentRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

// ─── Content Row ─────────────────────────────────────

function ContentRow({ entry }: { entry: ContentEntry }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [valueEn, setValueEn] = useState(entry.value_en);
  const [valueRu, setValueRu] = useState(entry.value_ru);
  const [dirty, setDirty] = useState(false);

  function handleChangeEn(val: string) {
    setValueEn(val);
    setDirty(val !== entry.value_en || valueRu !== entry.value_ru);
  }

  function handleChangeRu(val: string) {
    setValueRu(val);
    setDirty(valueEn !== entry.value_en || val !== entry.value_ru);
  }

  const [error, setError] = useState(false);

  async function handleSave() {
    setLoading(true);
    setError(false);
    try {
      await api(`/api/admin/content/${entry.key}`, {
        method: "PUT",
        body: JSON.stringify({ value_en: valueEn, value_ru: valueRu }),
      });
      setDirty(false);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 pt-2 shrink-0 w-48">
            <FileText className="h-4 w-4 text-text-muted shrink-0" />
            <Badge variant="outline" className="text-xs font-mono truncate">
              {entry.key}
            </Badge>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            <Input
              value={valueEn}
              onChange={(e) => handleChangeEn(e.target.value)}
              placeholder="Value (EN)"
              className="text-sm"
            />
            <Input
              value={valueRu}
              onChange={(e) => handleChangeRu(e.target.value)}
              placeholder="Value (RU)"
              className="text-sm"
            />
          </div>
          <div className="flex flex-col items-center gap-1 mt-1">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading || !dirty}
              variant={dirty ? "accent" : "outline"}
            >
              <Save className="h-3 w-3" />
            </Button>
            {error && <span className="text-xs text-red-500">Error</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── New Entry Form ──────────────────────────────────

function NewEntryForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState("");
  const [valueEn, setValueEn] = useState("");
  const [valueRu, setValueRu] = useState("");

  async function handleSubmit() {
    if (!key.trim()) return;
    setLoading(true);
    try {
      await api("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({ key, value_en: valueEn, value_ru: valueRu }),
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
        <CardTitle className="text-sm">New Content Entry</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex items-end gap-3">
          <Input
            label="Key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="hero.title"
            className="font-mono text-sm"
          />
          <Input
            label="Value (EN)"
            value={valueEn}
            onChange={(e) => setValueEn(e.target.value)}
          />
          <Input
            label="Value (RU)"
            value={valueRu}
            onChange={(e) => setValueRu(e.target.value)}
          />
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={loading || !key.trim()}
            >
              <Save className="h-3 w-3" /> Create
            </Button>
            <Button variant="ghost" size="sm" onClick={onDone}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
