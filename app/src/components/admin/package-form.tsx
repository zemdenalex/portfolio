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
  Package,
  X,
  Power,
  PowerOff,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────

type PackageData = {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  project_type: string;
  description_en: string;
  description_ru: string;
  price_from: number;
  price_to: number;
  currency: string;
  features_en: string[];
  features_ru: string[];
  delivery_days: number | null;
  sort_order: number;
  active: boolean;
};

const PROJECT_TYPES = [
  "LANDING",
  "CORPORATE",
  "STORE",
  "BOT",
  "WEBAPP",
  "API",
  "FIXES",
];

const CURRENCIES = ["RUB", "USD", "EUR"];

// ─── Packages List ───────────────────────────────────

export function PackagesList({ packages }: { packages: PackageData[] }) {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {packages.length} package{packages.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={() => setShowNew(!showNew)} size="sm">
          <Plus className="h-4 w-4" />
          {showNew ? "Cancel" : "Add Package"}
        </Button>
      </div>

      {showNew && <PackageForm onDone={() => setShowNew(false)} />}

      {packages.length === 0 && !showNew && (
        <p className="text-text-muted text-sm py-8 text-center">
          No packages yet. Add one to get started.
        </p>
      )}

      {[...packages]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
    </div>
  );
}

// ─── Package Card ────────────────────────────────────

function PackageCard({ pkg }: { pkg: PackageData }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete package "${pkg.name_en}"?`)) return;
    setLoading(true);
    try {
      await api(`/api/admin/packages/${pkg.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive() {
    setLoading(true);
    try {
      await api(`/api/admin/packages/${pkg.id}/toggle-active`, {
        method: "PUT",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={!pkg.active ? "opacity-60" : ""}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          <Package className="h-4 w-4 text-accent" />
          <CardTitle className="text-sm flex-1">
            {pkg.name_en}
            {pkg.name_ru && (
              <span className="text-text-muted ml-2">/ {pkg.name_ru}</span>
            )}
          </CardTitle>
          <Badge variant="outline">{pkg.project_type}</Badge>
          <Badge variant={pkg.active ? "accent" : "default"}>
            {pkg.active ? "Active" : "Inactive"}
          </Badge>
          <span className="text-sm font-medium text-text-secondary">
            {formatPrice(pkg.price_from, pkg.price_to, pkg.currency)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleActive}
            disabled={loading}
            title={pkg.active ? "Deactivate" : "Activate"}
          >
            {pkg.active ? (
              <Power className="h-3 w-3 text-green-500" />
            ) : (
              <PowerOff className="h-3 w-3 text-text-muted" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(!editing);
              setExpanded(true);
            }}
          >
            {editing ? "Cancel" : "Edit"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </CardHeader>

      {expanded && !editing && (
        <CardContent className="p-4 pt-2 space-y-2">
          <p className="text-sm text-text-secondary">{pkg.description_en}</p>
          {pkg.delivery_days && (
            <p className="text-xs text-text-muted">
              Delivery: ~{pkg.delivery_days} days
            </p>
          )}
          {pkg.features_en.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
                Features (EN)
              </p>
              <ul className="text-sm text-text-secondary list-disc pl-4 space-y-0.5">
                {pkg.features_en.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}

      {editing && (
        <CardContent className="p-4 pt-2">
          <PackageForm
            existing={pkg}
            onDone={() => setEditing(false)}
          />
        </CardContent>
      )}
    </Card>
  );
}

// ─── Package Form ────────────────────────────────────

function PackageForm({
  existing,
  onDone,
}: {
  existing?: PackageData;
  onDone: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [nameEn, setNameEn] = useState(existing?.name_en ?? "");
  const [nameRu, setNameRu] = useState(existing?.name_ru ?? "");
  const [projectType, setProjectType] = useState(
    existing?.project_type ?? "LANDING",
  );
  const [descEn, setDescEn] = useState(existing?.description_en ?? "");
  const [descRu, setDescRu] = useState(existing?.description_ru ?? "");
  const [priceFrom, setPriceFrom] = useState(
    existing?.price_from?.toString() ?? "",
  );
  const [priceTo, setPriceTo] = useState(
    existing?.price_to?.toString() ?? "",
  );
  const [currency, setCurrency] = useState(
    existing?.currency ?? "RUB",
  );
  const [featuresEn, setFeaturesEn] = useState<string[]>(
    existing?.features_en ?? [],
  );
  const [featuresRu, setFeaturesRu] = useState<string[]>(
    existing?.features_ru ?? [],
  );
  const [deliveryDays, setDeliveryDays] = useState(
    existing?.delivery_days?.toString() ?? "",
  );
  const [active, setActive] = useState(existing?.active ?? true);

  const [newFeatureEn, setNewFeatureEn] = useState("");
  const [newFeatureRu, setNewFeatureRu] = useState("");

  function addFeature() {
    if (!newFeatureEn.trim()) return;
    setFeaturesEn([...featuresEn, newFeatureEn.trim()]);
    setFeaturesRu([...featuresRu, newFeatureRu.trim()]);
    setNewFeatureEn("");
    setNewFeatureRu("");
  }

  function removeFeature(index: number) {
    setFeaturesEn(featuresEn.filter((_, i) => i !== index));
    setFeaturesRu(featuresRu.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!slug.trim() || !nameEn.trim()) return;

    const data = {
      slug,
      name_en: nameEn,
      name_ru: nameRu,
      project_type: projectType,
      description_en: descEn,
      description_ru: descRu,
      price_from: parseInt(priceFrom, 10) || 0,
      price_to: parseInt(priceTo, 10) || 0,
      currency,
      features_en: featuresEn,
      features_ru: featuresRu,
      delivery_days: deliveryDays ? parseInt(deliveryDays, 10) : null,
      active,
    };

    setLoading(true);
    try {
      if (existing) {
        await api(`/api/admin/packages/${existing.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      } else {
        await api("/api/admin/packages", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
      onDone();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="basic-landing"
        />
        <Input
          label="Name (EN)"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="Basic Landing"
        />
        <Input
          label="Name (RU)"
          value={nameRu}
          onChange={(e) => setNameRu(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">
            Project Type
          </label>
          <Select
            value={projectType}
            onValueChange={setProjectType}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">
            Currency
          </label>
          <Select
            value={currency}
            onValueChange={setCurrency}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
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
        />
        <Input
          label="Description (RU)"
          value={descRu}
          onChange={(e) => setDescRu(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Price From"
          type="number"
          value={priceFrom}
          onChange={(e) => setPriceFrom(e.target.value)}
        />
        <Input
          label="Price To"
          type="number"
          value={priceTo}
          onChange={(e) => setPriceTo(e.target.value)}
        />
        <Input
          label="Delivery Days"
          type="number"
          value={deliveryDays}
          onChange={(e) => setDeliveryDays(e.target.value)}
        />
      </div>

      {/* Features */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
          Features
        </p>
        {featuresEn.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="flex-1">{f}</span>
            <span className="text-text-muted flex-1">
              {featuresRu[i] || ""}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFeature(i)}
            >
              <X className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2 items-end">
          <Input
            value={newFeatureEn}
            onChange={(e) => setNewFeatureEn(e.target.value)}
            placeholder="Feature EN"
            className="text-sm h-8"
          />
          <Input
            value={newFeatureRu}
            onChange={(e) => setNewFeatureRu(e.target.value)}
            placeholder="Feature RU"
            className="text-sm h-8"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={addFeature}
            disabled={!newFeatureEn.trim()}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Active Toggle */}
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="rounded border-border accent-accent"
        />
        Active
      </label>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={loading || !slug.trim() || !nameEn.trim()}
        >
          <Save className="h-3 w-3" /> {existing ? "Save" : "Create"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
