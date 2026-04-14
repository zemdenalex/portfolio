"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/* ─── Logo catalog (matches files in /public/logos/*.svg) ─── */

type LogoMeta = {
  id: number;
  slug: string;
  name: string;
  desc: string;
};

const LOGOS: LogoMeta[] = [
  { id: 1, slug: "01-blueprint-wireframe", name: "Blueprint Wireframe", desc: "Technical drawing — dashed construction lines, apex crosshair, height dimension (H), revision/sheet numbers." },
  { id: 2, slug: "02-roman-inscription", name: "Roman Inscription", desc: "Trajan-style capitals referencing Roman monuments. Latin motto 'Qvi aedificat web' = he who builds the web." },
  { id: 3, slug: "03-pitched-roof-glyph", name: "Pitched Roof Glyph", desc: "Just a roof silhouette on a foundation line — simultaneously A and house. Minimal, suggestive." },
  { id: 4, slug: "04-skyscraper", name: "Skyscraper", desc: "Tapering tower with horizontal window bands + antenna spire. Urban, ambitious, permanent." },
  { id: 5, slug: "05-compass", name: "Compass", desc: "Drafting compass — pivot at apex, arc being drawn at base, crossbar = the drawn line." },
  { id: 6, slug: "06-isometric", name: "Isometric Block", desc: "3D prism with crossbar groove cut into the top face. Clean, architectural, solid." },
  { id: 7, slug: "07-modular-blocks", name: "Modular Blocks", desc: "Mixed-size blocks with depth + highlighted 'keystone' block in bright cyan at the crossbar." },
  { id: 8, slug: "08-constellation", name: "Truss / Constellation", desc: "Engineering truss with cross-bracing and riveted joints. A as load-bearing structure." },
  { id: 9, slug: "09-stacked-wordmark", name: "Masthead Seal", desc: "Editorial masthead: seal with A + laurel ticks + stacked ARCHI/FEX with rules + Latin motto." },
  { id: 10, slug: "10-dimension-line", name: "Architectural Drawing", desc: "[A] bracket icon + horizontal dimension line under wordmark + vertical dimension on side." },
  { id: 11, slug: "11-isometric-cubes", name: "Isometric Cubes", desc: "A built from 10 isometric unit cubes. The platonic ideal of 'built from blocks.'" },
  { id: 12, slug: "12-exploded-construction", name: "Exploded Construction", desc: "Three parts — apex / crossbar / legs — separated as if mid-assembly." },
  { id: 13, slug: "13-wireframe-isometric", name: "Wireframe Isometric", desc: "See-through 3D — every edge visible, no fills. 'We show our work.'" },
  { id: 14, slug: "14-keystone-arch", name: "Keystone Arch", desc: "Simplified arch with keystone A integrated INTO the apex. 'Keystone of your stack.'" },
  { id: 15, slug: "15-process-triptych", name: "Process (Single A)", desc: "ONE A sliced vertically: sketched / blueprint / built. Full lifecycle in one mark." },
  { id: 16, slug: "16-scaffold", name: "Scaffold", desc: "Solid A wrapped in scaffolding — thick pipes, braces, bolted joints, red safety flag." },
  { id: 17, slug: "17-roof-monogram", name: "Roof Monogram", desc: "Just roof + foundation. No doors or windows. Viewer fills in 'house.'" },
  { id: 18, slug: "18-carved-stone", name: "Carved Stone", desc: "Latin etymology: ARCHI (chief) + FEX (maker) = master builder. Like artifex, pontifex, opifex." },
  { id: 19, slug: "19-tessellation", name: "Tessellation", desc: "Triangular tiles forming an A, fading outward. Keystone tile highlighted. Modular by design." },
  { id: 20, slug: "20-af-ligature", name: "AF Ligature", desc: "A and F fused into a single typographic mark — they share the crossbar. Literary." },
  { id: 21, slug: "21-construction-crane", name: "Construction Crane", desc: "Solid A with tower crane rising from the apex. Actively building." },
  { id: 22, slug: "22-rebar", name: "Rebar Framework", desc: "Reinforcement steel before the concrete pour. Diagonals + ties + tie-wire dots." },
  { id: 23, slug: "23-bauhaus", name: "Bauhaus", desc: "Circle + triangle + rectangle + dot — Bauhaus primary shapes composing an A." },
  { id: 24, slug: "24-monolith", name: "Monolith", desc: "Thick carved A-slab with depth + etched crossbar groove. Permanent, weighty." },
  { id: 25, slug: "25-paper-fold", name: "Paper Fold", desc: "A as folded paper — mountain fold center, valley fold at crossbar. Architectural origami." },
  { id: 26, slug: "26-circuit", name: "Circuit", desc: "A drawn as PCB traces with 90° bends, solder pads, vias. Tech version of blueprint idea." },
  { id: 27, slug: "27-art-deco", name: "Art Deco", desc: "Stepped Chrysler-building silhouette — layered triangles with horizontal deco lines." },
  { id: 28, slug: "28-ribbon", name: "Ribbon", desc: "A formed by a single continuous ribbon folding back on itself. V-notched ends." },
  { id: 29, slug: "29-typographic-mark", name: "Typographic Mark", desc: "Custom serif A letterform — strong axis, serif terminals, accent crossbar." },
  { id: 30, slug: "30-letterpress", name: "Letterpress", desc: "ARCHIFEX pressed into paper — emboss gradient, corner ornaments, classical divider." },
];

/* ─── API ─── */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type ApiResponse<T> = { data: T; error?: { code: string; message: string } };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `API error: ${res.status}`);
  }
  return json.data;
}

/* ─── Types ─── */

type Rating = { logo_id: number; score: number; is_favorite: boolean; updated_at: string };
type Session = { id: string; label: string | null; created_at: string; last_seen_at: string };
type SessionData = { session: Session; ratings: Rating[]; favorites: number[]; comparisons: number };
type LogoStat = {
  logo_id: number;
  avg_score: number | null;
  rating_count: number;
  favorite_count: number;
  wins: number;
  losses: number;
};
type AggregateStats = {
  logos: LogoStat[];
  total_sessions: number;
  total_ratings: number;
  total_comparisons: number;
};

const SESSION_KEY = "archifex-rating-session-id";

/* ─── Page ─── */

export default function LogoRatingPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [label, setLabel] = useState<string>("");
  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const [comparisons, setComparisons] = useState(0);
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [tab, setTab] = useState<"rate" | "compare" | "results">("rate");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [viewMode, setViewMode] = useState<"single" | "grid">("single");
  const [pair, setPair] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);

  /* --- Session bootstrap --- */

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const existing = localStorage.getItem(SESSION_KEY);
      const dismissed = localStorage.getItem("archifex-rating-intro-dismissed");
      if (!existing && !dismissed) setShowIntro(true);
      try {
        if (existing) {
          const data = await api<SessionData>(`/api/public/logos/sessions/${existing}`).catch(() => null);
          if (data) {
            if (cancelled) return;
            setSessionId(data.session.id);
            setLabel(data.session.label ?? "");
            setRatings(
              Object.fromEntries(data.ratings.map((r) => [r.logo_id, r])),
            );
            setComparisons(data.comparisons);
            setLoading(false);
            return;
          }
        }
        // Create new session
        const sess = await api<Session>(`/api/public/logos/sessions`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        if (cancelled) return;
        localStorage.setItem(SESSION_KEY, sess.id);
        setSessionId(sess.id);
        setLabel(sess.label ?? "");
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to start session");
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  /* --- Actions --- */

  const rate = useCallback(
    async (logoId: number, score: number) => {
      if (!sessionId) return;
      // Optimistic
      const existing = ratings[logoId];
      setRatings((prev) => ({
        ...prev,
        [logoId]: {
          logo_id: logoId,
          score,
          is_favorite: existing?.is_favorite ?? false,
          updated_at: new Date().toISOString(),
        },
      }));
      try {
        await api(`/api/public/logos/sessions/${sessionId}/rate`, {
          method: "POST",
          body: JSON.stringify({ logo_id: logoId, score }),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save rating");
      }
    },
    [sessionId, ratings],
  );

  const toggleFavorite = useCallback(
    async (logoId: number) => {
      if (!sessionId) return;
      const existing = ratings[logoId];
      const newFav = !(existing?.is_favorite ?? false);
      setRatings((prev) => ({
        ...prev,
        [logoId]: {
          logo_id: logoId,
          score: existing?.score ?? 0,
          is_favorite: newFav,
          updated_at: new Date().toISOString(),
        },
      }));
      try {
        await api(`/api/public/logos/sessions/${sessionId}/favorite`, {
          method: "POST",
          body: JSON.stringify({ logo_id: logoId, is_favorite: newFav }),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update favorite");
      }
    },
    [sessionId, ratings],
  );

  const saveLabel = useCallback(
    async (newLabel: string) => {
      if (!sessionId) return;
      setLabel(newLabel);
      try {
        await api(`/api/public/logos/sessions/${sessionId}`, {
          method: "PUT",
          body: JSON.stringify({ label: newLabel.trim() || null }),
        });
      } catch {
        // silent
      }
    },
    [sessionId],
  );

  const recordComparison = useCallback(
    async (winnerId: number, loserId: number) => {
      if (!sessionId) return;
      setComparisons((c) => c + 1);
      try {
        await api(`/api/public/logos/sessions/${sessionId}/compare`, {
          method: "POST",
          body: JSON.stringify({ winner_logo_id: winnerId, loser_logo_id: loserId }),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save comparison");
      }
    },
    [sessionId],
  );

  const loadStats = useCallback(async () => {
    try {
      const s = await api<AggregateStats>(`/api/public/logos/stats`);
      setStats(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stats");
    }
  }, []);

  useEffect(() => {
    if (tab === "results") loadStats();
  }, [tab, loadStats]);

  /* --- Derived --- */

  const ratedCount = Object.keys(ratings).length;
  const favCount = Object.values(ratings).filter((r) => r.is_favorite).length;
  const currentLogo = LOGOS[currentIdx];

  /* --- Pair generation for compare --- */

  const newPair = useCallback(() => {
    // weighted toward logos with fewer local ratings
    const ids = LOGOS.map((l) => l.id);
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    let a = shuffled[0];
    let b = shuffled[1];
    if (a === b) b = shuffled[2];
    setPair([a, b]);
  }, []);

  useEffect(() => {
    if (tab === "compare" && !pair) newPair();
  }, [tab, pair, newPair]);

  /* --- Keyboard shortcuts --- */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (loading) return;
      const isInput =
        (e.target as HTMLElement)?.tagName === "INPUT" ||
        (e.target as HTMLElement)?.tagName === "TEXTAREA";
      if (isInput) return;

      if (tab === "rate" && viewMode === "single" && currentLogo) {
        if (e.key >= "0" && e.key <= "9") {
          rate(currentLogo.id, parseInt(e.key, 10));
          e.preventDefault();
        } else if (e.key === "q" || e.key === "Q") {
          rate(currentLogo.id, 10);
        } else if (e.key === "f" || e.key === "F") {
          toggleFavorite(currentLogo.id);
        } else if (e.key === "ArrowLeft") {
          setCurrentIdx((i) => Math.max(0, i - 1));
        } else if (e.key === "ArrowRight") {
          setCurrentIdx((i) => Math.min(LOGOS.length - 1, i + 1));
        }
      } else if (tab === "compare" && pair) {
        if (e.key === "ArrowLeft") {
          recordComparison(pair[0], pair[1]);
          newPair();
        } else if (e.key === "ArrowRight") {
          recordComparison(pair[1], pair[0]);
          newPair();
        } else if (e.key === " ") {
          newPair();
          e.preventDefault();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, viewMode, currentLogo, pair, loading, rate, toggleFavorite, recordComparison, newPair]);

  /* --- Render --- */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary text-text-secondary">
        <p className="font-mono text-sm">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg-primary/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <a href="/" className="font-mono text-base font-bold tracking-widest text-accent">
              Archifex
            </a>
            <span className="text-sm text-text-muted">· Logo Rating</span>
          </div>

          <div className="flex rounded-md bg-bg-secondary p-1">
            {(["rate", "compare", "results"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded px-3 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  tab === t
                    ? "bg-bg-primary text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-text-muted">
              {ratedCount} / 30 rated
            </span>
            <input
              type="text"
              placeholder="Your name (optional)"
              value={label}
              onChange={(e) => saveLabel(e.target.value)}
              className="w-32 rounded border border-border bg-bg-secondary px-2 py-1 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-center text-sm text-red-500">
          {error} <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {showIntro && (
        <div className="border-b border-accent/30 bg-accent/10 px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="mb-1 text-base font-bold text-text-primary">
                Help us pick a logo for Archifex
              </h2>
              <p className="text-sm text-text-secondary">
                30 variants across six themes (blueprint, isometric, blocks, house, latin,
                process). Rate each from 0-10, compare head-to-head, see aggregate results.
                Put your name in the top-right so we can tell ratings apart.
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.setItem("archifex-rating-intro-dismissed", "1");
                setShowIntro(false);
              }}
              className="rounded border border-border bg-bg-primary px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* RATE */}
      {tab === "rate" && (
        <RateSection
          viewMode={viewMode}
          setViewMode={setViewMode}
          currentIdx={currentIdx}
          setCurrentIdx={setCurrentIdx}
          ratings={ratings}
          onRate={rate}
          onToggleFav={toggleFavorite}
        />
      )}

      {/* COMPARE */}
      {tab === "compare" && (
        <CompareSection
          pair={pair}
          comparisons={comparisons}
          onPick={(winnerId, loserId) => {
            recordComparison(winnerId, loserId);
            newPair();
          }}
          onSkip={newPair}
        />
      )}

      {/* RESULTS */}
      {tab === "results" && (
        <ResultsSection
          stats={stats}
          myRatings={ratings}
          myFavorites={Object.values(ratings).filter((r) => r.is_favorite).map((r) => r.logo_id)}
          myComparisons={comparisons}
          myRatedCount={ratedCount}
          myFavCount={favCount}
          onReload={loadStats}
        />
      )}
    </main>
  );
}

/* ─── Rate Section ─── */

function RateSection({
  viewMode,
  setViewMode,
  currentIdx,
  setCurrentIdx,
  ratings,
  onRate,
  onToggleFav,
}: {
  viewMode: "single" | "grid";
  setViewMode: (m: "single" | "grid") => void;
  currentIdx: number;
  setCurrentIdx: (i: number | ((prev: number) => number)) => void;
  ratings: Record<number, Rating>;
  onRate: (id: number, score: number) => void;
  onToggleFav: (id: number) => void;
}) {
  const current = LOGOS[currentIdx];
  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">Rate each logo 0-10.</span>
          <span className="ml-2 text-text-muted">
            Use number keys · Q=10 · F=favorite · ← → navigate
          </span>
        </p>
        <div className="flex rounded-md bg-bg-secondary p-1 text-xs">
          <button
            onClick={() => setViewMode("single")}
            className={`rounded px-3 py-1 font-semibold ${
              viewMode === "single" ? "bg-bg-primary shadow-sm" : "text-text-muted"
            }`}
          >
            One at a time
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded px-3 py-1 font-semibold ${
              viewMode === "grid" ? "bg-bg-primary shadow-sm" : "text-text-muted"
            }`}
          >
            All at once
          </button>
        </div>
      </div>

      {viewMode === "single" ? (
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-xl border border-border bg-bg-secondary">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="font-mono text-sm text-text-muted">
                {currentIdx + 1} of {LOGOS.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentIdx((i: number) => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  className="rounded border border-border bg-bg-primary px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setCurrentIdx((i: number) => Math.min(LOGOS.length - 1, i + 1))}
                  disabled={currentIdx === LOGOS.length - 1}
                  className="rounded border border-border bg-bg-primary px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 border-b border-border">
              <div className="flex min-h-[200px] items-center justify-center bg-white p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/logos/${current.slug}.svg`} alt="" className="max-h-[140px]" />
              </div>
              <div className="flex min-h-[200px] items-center justify-center bg-[#0c1929] p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/logos/${current.slug}.svg`} alt="" className="max-h-[140px]" style={{ color: "#e8f0f5" }} />
              </div>
            </div>
            <div className="border-b border-border px-5 py-4">
              <h3 className="mb-1 text-lg font-bold">
                <span className="mr-2 font-mono text-accent">
                  {String(current.id).padStart(2, "0")}
                </span>
                {current.name}
              </h3>
              <p className="text-sm text-text-secondary">{current.desc}</p>
            </div>
            <RatingRow
              logoId={current.id}
              rating={ratings[current.id]}
              onRate={onRate}
              onToggleFav={onToggleFav}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {LOGOS.map((logo) => (
            <div
              key={logo.id}
              className="overflow-hidden rounded-lg border border-border bg-bg-secondary"
            >
              <div className="grid grid-cols-2 border-b border-border">
                <div className="flex min-h-[90px] items-center justify-center bg-white p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/logos/${logo.slug}.svg`} alt="" className="max-h-[58px]" />
                </div>
                <div className="flex min-h-[90px] items-center justify-center bg-[#0c1929] p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/logos/${logo.slug}.svg`} alt="" className="max-h-[58px]" />
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <div>
                  <h4 className="text-sm font-bold">{logo.name}</h4>
                  <span className="font-mono text-[10px] text-accent">
                    {String(logo.id).padStart(2, "0")}
                  </span>
                </div>
                <button
                  onClick={() => onToggleFav(logo.id)}
                  className={`rounded border px-2 py-1 text-xs font-semibold ${
                    ratings[logo.id]?.is_favorite
                      ? "border-amber-500/50 bg-amber-500/20 text-amber-600"
                      : "border-border bg-bg-primary text-text-muted"
                  }`}
                >
                  {ratings[logo.id]?.is_favorite ? "★" : "☆"}
                </button>
              </div>
              <RatingRow
                logoId={logo.id}
                rating={ratings[logo.id]}
                onRate={onRate}
                onToggleFav={onToggleFav}
                compact
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RatingRow({
  logoId,
  rating,
  onRate,
  onToggleFav,
  compact = false,
}: {
  logoId: number;
  rating?: Rating;
  onRate: (id: number, score: number) => void;
  onToggleFav: (id: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "px-4 py-2.5" : "px-5 py-4"}`}>
      {!compact && <span className="mr-1 text-xs font-semibold text-text-muted">Score:</span>}
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: 11 }, (_, i) => {
          const selected = rating?.score === i;
          const tone =
            i === 0 ? "red" : i <= 4 ? "amber" : i >= 7 ? "green" : "accent";
          return (
            <button
              key={i}
              onClick={() => onRate(logoId, i)}
              className={`font-mono font-bold transition-all ${
                compact ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-sm"
              } rounded border ${
                selected
                  ? tone === "red"
                    ? "border-red-500 bg-red-500 text-white scale-105"
                    : tone === "amber"
                      ? "border-amber-500 bg-amber-500 text-white scale-105"
                      : tone === "green"
                        ? "border-emerald-500 bg-emerald-500 text-white scale-105"
                        : "border-accent bg-accent text-white scale-105"
                  : "border-border bg-bg-primary text-text-primary hover:border-accent/50 hover:bg-bg-tertiary"
              }`}
            >
              {i}
            </button>
          );
        })}
      </div>
      {!compact && (
        <button
          onClick={() => onToggleFav(logoId)}
          className={`ml-auto rounded border px-3 py-1.5 text-xs font-semibold ${
            rating?.is_favorite
              ? "border-amber-500/50 bg-amber-500/20 text-amber-600"
              : "border-border bg-bg-primary text-text-muted"
          }`}
        >
          {rating?.is_favorite ? "★ Favorite" : "☆ Favorite"}
        </button>
      )}
    </div>
  );
}

/* ─── Compare Section ─── */

function CompareSection({
  pair,
  comparisons,
  onPick,
  onSkip,
}: {
  pair: [number, number] | null;
  comparisons: number;
  onPick: (winnerId: number, loserId: number) => void;
  onSkip: () => void;
}) {
  if (!pair) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12 text-center text-text-muted sm:px-6">
        Loading pair…
      </section>
    );
  }
  const [aId, bId] = pair;
  const a = LOGOS.find((l) => l.id === aId);
  const b = LOGOS.find((l) => l.id === bId);
  if (!a || !b) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <p className="mb-5 text-center text-sm text-text-secondary">
        Click the logo you prefer. ← left · → right · space skip
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[a, b].map((logo, idx) => (
          <button
            key={logo.id}
            onClick={() => onPick(logo.id, idx === 0 ? bId : aId)}
            className="group overflow-hidden rounded-xl border-2 border-border bg-bg-secondary text-left transition-all hover:-translate-y-1 hover:border-accent"
          >
            <div className="grid grid-cols-2 border-b border-border">
              <div className="flex min-h-[180px] items-center justify-center bg-white p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/logos/${logo.slug}.svg`} alt="" className="max-h-[100px]" />
              </div>
              <div className="flex min-h-[180px] items-center justify-center bg-[#0c1929] p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/logos/${logo.slug}.svg`} alt="" className="max-h-[100px]" />
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <h3 className="text-base font-bold">{logo.name}</h3>
              <span className="font-mono text-xs text-accent">
                #{String(logo.id).padStart(2, "0")}
              </span>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={onSkip}
          className="rounded-md border border-border bg-bg-primary px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary"
        >
          Skip (space)
        </button>
      </div>
      <p className="mt-4 text-center font-mono text-xs text-text-muted">
        {comparisons} comparisons made in this session
      </p>
    </section>
  );
}

/* ─── Results Section ─── */

function ResultsSection({
  stats,
  myRatings,
  myFavorites,
  myComparisons,
  myRatedCount,
  myFavCount,
  onReload,
}: {
  stats: AggregateStats | null;
  myRatings: Record<number, Rating>;
  myFavorites: number[];
  myComparisons: number;
  myRatedCount: number;
  myFavCount: number;
  onReload: () => void;
}) {
  const [view, setView] = useState<"global" | "mine">("global");

  const topByAvg = useMemo(() => {
    if (!stats) return [];
    return [...stats.logos]
      .filter((s) => (s.avg_score ?? 0) > 0 && s.rating_count > 0)
      .sort((a, b) => {
        const diff = (b.avg_score ?? 0) - (a.avg_score ?? 0);
        if (diff !== 0) return diff;
        return b.rating_count - a.rating_count;
      })
      .slice(0, 10);
  }, [stats]);

  const topByFavs = useMemo(() => {
    if (!stats) return [];
    return [...stats.logos]
      .filter((s) => s.favorite_count > 0)
      .sort((a, b) => b.favorite_count - a.favorite_count)
      .slice(0, 10);
  }, [stats]);

  const topByH2H = useMemo(() => {
    if (!stats) return [];
    return [...stats.logos]
      .filter((s) => s.wins + s.losses > 0)
      .map((s) => ({ ...s, rate: s.wins / (s.wins + s.losses), plays: s.wins + s.losses }))
      .sort((a, b) => b.rate - a.rate || b.plays - a.plays)
      .slice(0, 10);
  }, [stats]);

  const myTopRated = useMemo(() => {
    return LOGOS.map((l) => ({ ...l, score: myRatings[l.id]?.score }))
      .filter((l): l is LogoMeta & { score: number } => l.score !== undefined)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [myRatings]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex rounded-md bg-bg-secondary p-1 text-sm">
          <button
            onClick={() => setView("global")}
            className={`rounded px-3 py-1.5 font-semibold ${
              view === "global" ? "bg-bg-primary shadow-sm" : "text-text-muted"
            }`}
          >
            Everyone's results
          </button>
          <button
            onClick={() => setView("mine")}
            className={`rounded px-3 py-1.5 font-semibold ${
              view === "mine" ? "bg-bg-primary shadow-sm" : "text-text-muted"
            }`}
          >
            Just mine
          </button>
        </div>
        <button
          onClick={onReload}
          className="rounded-md border border-border bg-bg-primary px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
        >
          ↻ Refresh
        </button>
      </div>

      {view === "global" ? (
        <>
          {/* Global stats grid */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Sessions" value={stats?.total_sessions ?? "—"} />
            <StatCard label="Ratings" value={stats?.total_ratings ?? "—"} />
            <StatCard label="Comparisons" value={stats?.total_comparisons ?? "—"} />
            <StatCard
              label="Avg score"
              value={
                stats && stats.total_ratings > 0
                  ? (
                      stats.logos.reduce(
                        (sum, l) => sum + (l.avg_score ?? 0) * l.rating_count,
                        0,
                      ) / stats.total_ratings
                    ).toFixed(2)
                  : "—"
              }
            />
          </div>

          <Leaderboard
            title="🏆 Top 10 by average score (all voters)"
            rows={topByAvg.map((s) => ({
              logo: LOGOS.find((l) => l.id === s.logo_id)!,
              primary: `${s.avg_score?.toFixed(2) ?? "—"}/10`,
              secondary: `${s.rating_count} rating${s.rating_count === 1 ? "" : "s"}`,
            }))}
          />

          <Leaderboard
            title="⭐ Most favorited"
            rows={topByFavs.map((s) => ({
              logo: LOGOS.find((l) => l.id === s.logo_id)!,
              primary: `${s.favorite_count} ★`,
              secondary: `avg ${s.avg_score?.toFixed(1) ?? "—"}/10`,
            }))}
          />

          <Leaderboard
            title="⚔️ Head-to-head win rate"
            rows={topByH2H.map((s) => ({
              logo: LOGOS.find((l) => l.id === s.logo_id)!,
              primary: `${Math.round(s.rate * 100)}%`,
              secondary: `${s.wins}/${s.plays} wins`,
            }))}
          />
        </>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="You rated" value={`${myRatedCount}/30`} />
            <StatCard label="Your avg" value={myRatedCount ? (Object.values(myRatings).reduce((s, r) => s + r.score, 0) / myRatedCount).toFixed(2) : "—"} />
            <StatCard label="Your favorites" value={myFavCount} />
            <StatCard label="Your comparisons" value={myComparisons} />
          </div>

          <Leaderboard
            title="Your top 10"
            rows={myTopRated.map((l) => ({
              logo: l,
              primary: `${l.score}/10`,
              secondary: myRatings[l.id]?.is_favorite ? "★ favorite" : "",
            }))}
          />

          {myFavorites.length > 0 && (
            <Leaderboard
              title="Your favorites"
              rows={myFavorites.map((id) => {
                const l = LOGOS.find((x) => x.id === id)!;
                return {
                  logo: l,
                  primary: myRatings[id]?.score !== undefined ? `${myRatings[id].score}/10` : "—",
                  secondary: "★ favorite",
                };
              })}
            />
          )}
        </>
      )}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
        {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold text-text-primary">{value}</div>
    </div>
  );
}

function Leaderboard({
  title,
  rows,
}: {
  title: string;
  rows: { logo: LogoMeta; primary: string; secondary: string }[];
}) {
  if (rows.length === 0) {
    return (
      <div className="mb-5 rounded-lg border border-border bg-bg-secondary">
        <h2 className="border-b border-border px-5 py-3 text-base font-bold">{title}</h2>
        <p className="px-5 py-6 text-center text-sm text-text-muted">No data yet.</p>
      </div>
    );
  }
  return (
    <div className="mb-5 overflow-hidden rounded-lg border border-border bg-bg-secondary">
      <h2 className="border-b border-border px-5 py-3 text-base font-bold">{title}</h2>
      {rows.map((row, idx) => (
        <div
          key={row.logo.id}
          className="grid grid-cols-[40px_1fr_auto] items-center gap-3 border-b border-border px-5 py-2.5 last:border-b-0"
        >
          <span
            className={`font-mono text-lg font-bold ${
              idx === 0
                ? "text-amber-500"
                : idx === 1
                  ? "text-slate-400"
                  : idx === 2
                    ? "text-amber-700"
                    : "text-text-muted"
            }`}
          >
            #{idx + 1}
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded bg-white px-2 py-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/logos/${row.logo.slug}.svg`} alt="" className="h-8 w-auto" />
            </div>
            <div>
              <div className="text-sm font-semibold">{row.logo.name}</div>
              <div className="font-mono text-[10px] text-text-muted">
                {String(row.logo.id).padStart(2, "0")} · {row.secondary}
              </div>
            </div>
          </div>
          <span className="rounded bg-accent px-2.5 py-1 font-mono text-sm font-bold text-white">
            {row.primary}
          </span>
        </div>
      ))}
    </div>
  );
}
