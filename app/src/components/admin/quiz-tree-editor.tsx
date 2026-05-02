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
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Save,
  GitBranch,
  Target,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────

type NodeType = "QUESTION" | "RESULT";

const STYLE_SLUGS = ["bold-modern", "corporate-classic", "creative-experimental", "minimalist"] as const;
type StyleSlug = (typeof STYLE_SLUGS)[number];

const PROJECT_TYPES = ["", "LANDING", "CORPORATE", "STORE", "BOT", "WEBAPP", "API", "FIXES"] as const;

type QuizOptionData = {
  id: string;
  node_id: string;
  label_en: string;
  label_ru: string;
  next_node_id: string | null;
  sort_order: number;
  style_weights: Record<string, number> | null;
  project_type: string | null;
};

type QuizResultData = {
  id: string;
  style_id: string;
  package_id: string;
  description_en: string | null;
  description_ru: string | null;
};

type QuizNodeData = {
  id: string;
  parent_id: string | null;
  type: string;
  question_en: string | null;
  question_ru: string | null;
  sort_order: number;
  options: QuizOptionData[];
  result: QuizResultData | null;
  children: QuizNodeData[];
};

type StyleOption = { id: string; name_en: string };
type PackageOption = { id: string; name_en: string };

// ─── Main Editor ─────────────────────────────────────

export function QuizTreeEditor({
  nodes,
  styles,
  packages,
}: {
  nodes: QuizNodeData[];
  styles: StyleOption[];
  packages: PackageOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAddRoot() {
    setLoading(true);
    try {
      await api("/api/admin/quiz/nodes", {
        method: "POST",
        body: JSON.stringify({ parent_id: null, type: "QUESTION", question_en: "New question", question_ru: "" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const roots = nodes.filter((n) => n.parent_id === null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {nodes.length} node{nodes.length !== 1 ? "s" : ""} total
        </p>
        <Button onClick={handleAddRoot} disabled={loading} size="sm">
          <Plus className="h-4 w-4" />
          Add Root Node
        </Button>
      </div>

      {roots.length === 0 && (
        <p className="text-text-muted text-sm py-8 text-center">
          No quiz nodes yet. Add a root node to start building.
        </p>
      )}

      <div className="space-y-2">
        {roots.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            allNodes={nodes}
            styles={styles}
            packages={packages}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Tree Node ───────────────────────────────────────

function TreeNode({
  node,
  allNodes,
  styles,
  packages,
  depth,
}: {
  node: QuizNodeData;
  allNodes: QuizNodeData[];
  styles: StyleOption[];
  packages: PackageOption[];
  depth: number;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(depth < 2);
  const [editing, setEditing] = useState(false);
  const [questionEn, setQuestionEn] = useState(node.question_en ?? "");
  const [questionRu, setQuestionRu] = useState(node.question_ru ?? "");
  const [loading, setLoading] = useState(false);

  const children = allNodes.filter((n) => n.parent_id === node.id);
  const hasChildren = children.length > 0 || node.options.length > 0;

  async function handleSave() {
    setLoading(true);
    try {
      await api(`/api/admin/quiz/nodes/${node.id}`, {
        method: "PUT",
        body: JSON.stringify({ question_en: questionEn, question_ru: questionRu }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this node and all its children?")) return;
    setLoading(true);
    try {
      await api(`/api/admin/quiz/nodes/${node.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleAddChild(type: NodeType) {
    setLoading(true);
    try {
      await api("/api/admin/quiz/nodes", {
        method: "POST",
        body: JSON.stringify({
          parent_id: node.id,
          type,
          question_en: type === "QUESTION" ? "New question" : "",
          question_ru: "",
        }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      className="border-l-2"
      style={{ marginLeft: depth * 24, borderLeftColor: node.type === "RESULT" ? "var(--accent)" : "var(--border)" }}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}

          <Badge variant={node.type === "RESULT" ? "accent" : "default"}>
            {node.type === "RESULT" ? (
              <span className="flex items-center gap-1"><Target className="h-3 w-3" /> RESULT</span>
            ) : (
              <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> QUESTION</span>
            )}
          </Badge>

          {!editing ? (
            <CardTitle
              className="text-sm cursor-pointer hover:text-accent transition-colors flex-1"
              onClick={() => setEditing(true)}
            >
              {node.question_en || "(no question text)"}
            </CardTitle>
          ) : (
            <div className="flex-1 flex gap-2">
              <Input
                value={questionEn}
                onChange={(e) => setQuestionEn(e.target.value)}
                placeholder="Question (EN)"
                className="text-sm h-8"
              />
              <Input
                value={questionRu}
                onChange={(e) => setQuestionRu(e.target.value)}
                placeholder="Question (RU)"
                className="text-sm h-8"
              />
              <Button size="sm" onClick={handleSave} disabled={loading}>
                <Save className="h-3 w-3" />
              </Button>
            </div>
          )}

          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-4 pt-0 space-y-3">
          {node.type === "QUESTION" && (
            <OptionsEditor
              nodeId={node.id}
              options={node.options}
              allNodes={allNodes}
            />
          )}

          {node.type === "RESULT" && (
            <ResultEditor
              nodeId={node.id}
              result={node.result}
              styles={styles}
              packages={packages}
            />
          )}

          {children.length > 0 && (
            <div className="space-y-2 mt-2">
              {children.map((child) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  allNodes={allNodes}
                  styles={styles}
                  packages={packages}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => handleAddChild("QUESTION")} disabled={loading}>
              <Plus className="h-3 w-3" /> Question Child
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAddChild("RESULT")} disabled={loading}>
              <Plus className="h-3 w-3" /> Result Child
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Options Editor ──────────────────────────────────

function OptionsEditor({
  nodeId,
  options,
  allNodes,
}: {
  nodeId: string;
  options: QuizOptionData[];
  allNodes: QuizNodeData[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newLabelEn, setNewLabelEn] = useState("");
  const [newLabelRu, setNewLabelRu] = useState("");

  async function handleAddOption() {
    if (!newLabelEn.trim()) return;
    setLoading(true);
    try {
      await api(`/api/admin/quiz/nodes/${nodeId}/options`, {
        method: "POST",
        body: JSON.stringify({
          label_en: newLabelEn,
          label_ru: newLabelRu,
          sort_order: options.length,
        }),
      });
      setNewLabelEn("");
      setNewLabelRu("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2 pl-6 border-l border-border-light">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Options</p>
      {[...options]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((opt) => (
          <OptionRow key={opt.id} option={opt} allNodes={allNodes} />
        ))}
      <div className="flex gap-2 items-end">
        <Input
          value={newLabelEn}
          onChange={(e) => setNewLabelEn(e.target.value)}
          placeholder="Label EN"
          className="text-sm h-8"
        />
        <Input
          value={newLabelRu}
          onChange={(e) => setNewLabelRu(e.target.value)}
          placeholder="Label RU"
          className="text-sm h-8"
        />
        <Button size="sm" onClick={handleAddOption} disabled={loading || !newLabelEn.trim()}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Single Option Row ───────────────────────────────

function OptionRow({
  option,
  allNodes,
}: {
  option: QuizOptionData;
  allNodes: QuizNodeData[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [labelEn, setLabelEn] = useState(option.label_en);
  const [labelRu, setLabelRu] = useState(option.label_ru);
  const [weights, setWeights] = useState<Record<string, number>>(
    (option.style_weights as Record<string, number> | null) ?? {}
  );
  const [projectType, setProjectType] = useState<string>(option.project_type ?? "");

  async function handleSave() {
    setLoading(true);
    try {
      await api(`/api/admin/quiz/options/${option.id}`, {
        method: "PUT",
        body: JSON.stringify({
          label_en: labelEn,
          label_ru: labelRu,
          style_weights: weights,
          project_type: projectType || null,
        }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await api(`/api/admin/quiz/options/${option.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkNode(nextNodeId: string) {
    setLoading(true);
    try {
      await api(`/api/admin/quiz/options/${option.id}`, {
        method: "PUT",
        body: JSON.stringify({
          next_node_id: nextNodeId === "__none__" ? null : nextNodeId,
        }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function handleWeightChange(slug: StyleSlug, raw: string) {
    const val = parseInt(raw, 10);
    const clamped = isNaN(val) ? 0 : Math.min(3, Math.max(0, val));
    setWeights((prev) => ({ ...prev, [slug]: clamped }));
  }

  const linkedNode = option.next_node_id
    ? allNodes.find((n) => n.id === option.next_node_id)
    : null;

  return (
    <div className="text-sm border border-border rounded p-2 space-y-2">
      {/* Top row: label display / edit + link selector + delete */}
      <div className="flex items-center gap-2">
        {!editing ? (
          <>
            <span
              className="flex-1 cursor-pointer hover:text-accent transition-colors"
              onClick={() => setEditing(true)}
            >
              {option.label_en}
              {option.label_ru && (
                <span className="text-text-muted ml-1">/ {option.label_ru}</span>
              )}
            </span>
            <Select
              value={option.next_node_id ?? "__none__"}
              onValueChange={handleLinkNode}
            >
              <SelectTrigger className="h-7 w-48 text-xs">
                <SelectValue placeholder="Link to node..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No link</SelectItem>
                {allNodes
                  .filter((n) => n.id !== option.node_id)
                  .map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.question_en || n.id.slice(0, 8)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {linkedNode && (
              <Badge variant="outline" className="text-xs">
                {linkedNode.question_en?.slice(0, 20) || "linked"}
              </Badge>
            )}
          </>
        ) : (
          <>
            <Input
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
              className="h-7 text-xs flex-1"
            />
            <Input
              value={labelRu}
              onChange={(e) => setLabelRu(e.target.value)}
              className="h-7 text-xs flex-1"
            />
          </>
        )}
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading}>
          <Trash2 className="h-3 w-3 text-red-500" />
        </Button>
      </div>

      {/* Style weights + project type — always visible */}
      <div className="pl-1 space-y-2">
        <div>
          <p className="text-xs font-medium text-text-secondary mb-1">Style weights (0–3)</p>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_SLUGS.map((slug) => (
              <label key={slug} className="flex flex-col gap-0.5">
                <span className="text-xs text-text-secondary">{slug}</span>
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={weights[slug] ?? 0}
                  onChange={(e) => {
                    handleWeightChange(slug, e.target.value);
                    if (!editing) setEditing(true);
                  }}
                  className="w-full px-2 py-1 border border-border rounded text-sm bg-bg-primary"
                />
              </label>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-text-secondary">Project type (optional)</span>
          <select
            value={projectType}
            onChange={(e) => {
              setProjectType(e.target.value);
              if (!editing) setEditing(true);
            }}
            className="w-full px-2 py-1 border border-border rounded text-sm bg-bg-primary"
          >
            {PROJECT_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {pt === "" ? "— none —" : pt}
              </option>
            ))}
          </select>
        </label>

        {editing && (
          <Button size="sm" onClick={handleSave} disabled={loading}>
            <Save className="h-3 w-3 mr-1" /> Save
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Result Editor ───────────────────────────────────

function ResultEditor({
  nodeId,
  result,
  styles,
  packages,
}: {
  nodeId: string;
  result: QuizResultData | null;
  styles: StyleOption[];
  packages: PackageOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [styleId, setStyleId] = useState(result?.style_id ?? "");
  const [packageId, setPackageId] = useState(result?.package_id ?? "");
  const [descEn, setDescEn] = useState(result?.description_en ?? "");
  const [descRu, setDescRu] = useState(result?.description_ru ?? "");

  async function handleSave() {
    if (!styleId || !packageId) return;
    setLoading(true);
    try {
      await api(`/api/admin/quiz/nodes/${nodeId}/result`, {
        method: "PUT",
        body: JSON.stringify({
          style_id: styleId,
          package_id: packageId,
          description_en: descEn,
          description_ru: descRu,
        }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 pl-6 border-l border-accent/30">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
        Result Mapping
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Style</label>
          <Select value={styleId} onValueChange={setStyleId}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select style..." />
            </SelectTrigger>
            <SelectContent>
              {styles.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Package</label>
          <Select value={packageId} onValueChange={setPackageId}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select package..." />
            </SelectTrigger>
            <SelectContent>
              {packages.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Description (EN)"
          value={descEn}
          onChange={(e) => setDescEn(e.target.value)}
          className="text-sm h-8"
        />
        <Input
          label="Description (RU)"
          value={descRu}
          onChange={(e) => setDescRu(e.target.value)}
          className="text-sm h-8"
        />
      </div>
      <Button size="sm" onClick={handleSave} disabled={loading || !styleId || !packageId}>
        <Save className="h-3 w-3" /> Save Result
      </Button>
    </div>
  );
}
