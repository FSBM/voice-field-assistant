"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import Panel from "@/components/ui/panel";
import StatCard from "@/components/ui/stat-card";
import StatusPill from "@/components/ui/status-pill";
import MetaLabel from "@/components/ui/meta-label";
import Tag from "@/components/ui/tag";
import AddKnowledge from "@/components/kb/AddKnowledge";
import RetrievalTester from "@/components/kb/RetrievalTester";
import EmbeddingMap, { buildSourceColors } from "@/components/kb/EmbeddingMap";
import Fingerprint from "@/components/kb/Fingerprint";

interface Point {
  id: string;
  source: string;
  chunkIndex: number;
  heading: string;
  text: string;
  charCount: number;
  tokensApprox: number;
  origin: "seed" | "added";
  x: number;
  y: number;
  fingerprint: number[];
}

interface Chunking {
  strategy: string;
  maxChars: number;
  minChars: number;
  overlapChars: number;
  embeddingModel: string;
  dimensions: number;
  rationale: string[];
}

interface KbData {
  stats: { chunks: number; sources: number; seedChunks: number; addedChunks: number; dimensions: number; model: string; persistence: string };
  chunking: Chunking;
  points: Point[];
  edges: { a: number; b: number; score: number }[];
  sources: { source: string; origin: string; count: number }[];
}

export default function KnowledgePage() {
  const [data, setData] = useState<KbData | null>(null);
  const [loading, setLoading] = useState(true);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/knowledge", { cache: "no-store" });
      const next = await res.json().catch(() => null);
      if (next?.stats) setData(next as KbData);
    } catch {
      return;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const colors = useMemo(
    () => buildSourceColors((data?.sources ?? []).map((entry) => entry.source)),
    [data?.sources],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Point[]>();
    for (const point of data?.points ?? []) {
      const list = map.get(point.source) ?? [];
      list.push(point);
      map.set(point.source, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.chunkIndex - b.chunkIndex);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data?.points]);

  async function removeSource(source: string) {
    try {
      await fetch(`/api/knowledge?source=${encodeURIComponent(source)}`, { method: "DELETE" });
    } catch {
      return;
    }
    setHighlight(new Set());
    refresh();
  }

  const stats = data?.stats;
  const chunking = data?.chunking;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-3 border-b border-line-1 bg-canvas/90 px-4 backdrop-blur md:px-5">
        <span className="text-[13.5px] font-medium tracking-[-0.005em] text-ink-1">Knowledge base</span>
        <span className="text-ink-4">/</span>
        <span className="text-[12px] font-[450] text-ink-3">Retrieval</span>
        <div className="flex-1" />
        {stats && (
          <StatusPill
            tone={stats.persistence === "supabase" ? "ok" : "warn"}
            label={stats.persistence === "supabase" ? "persisted" : "in-memory"}
          />
        )}
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-3 transition-colors hover:text-ink-1"
        >
          <RefreshCw size={12} strokeWidth={2} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 md:px-6">
        <p className="max-w-2xl text-[12.5px] leading-relaxed text-ink-2">
          The assistant answers questions from this knowledge base. Documents are split into chunks,
          each embedded into a {stats?.dimensions ?? 384}-dimensional vector, and retrieved by cosine
          similarity. Add your own knowledge below by typing, uploading a Markdown file, or speaking it.
        </p>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line-1 bg-line-1 lg:grid-cols-4">
          <StatCard className="bg-surface-1" label="Sources" value={stats?.sources ?? 0} suffix="docs" />
          <StatCard className="bg-surface-1" label="Chunks" value={stats?.chunks ?? 0} suffix="embedded" />
          <StatCard className="bg-surface-1" label="Added by you" value={stats?.addedChunks ?? 0} accent={stats?.addedChunks ? "text-info" : "text-ink-1"} live={Boolean(stats?.addedChunks)} />
          <StatCard className="bg-surface-1" label="Dimensions" value={stats?.dimensions ?? 384} suffix="per vector" />
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel meta="Add knowledge" sub="Type it, upload a Markdown file, or speak it">
            <AddKnowledge onAdded={refresh} />
          </Panel>

          <Panel meta="Embedding map" sub="Every chunk projected to 2D by meaning">
            <EmbeddingMap
              points={(data?.points ?? []).map((point) => ({
                id: point.id,
                x: point.x,
                y: point.y,
                source: point.source,
                origin: point.origin,
                heading: point.heading,
                chunkIndex: point.chunkIndex,
              }))}
              edges={data?.edges ?? []}
              colors={colors}
              highlight={highlight}
            />
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
              {(data?.sources ?? []).map((entry) => (
                <span key={entry.source} className="inline-flex items-center gap-1.5 text-[11px] text-ink-3">
                  <span className="h-2 w-2 rounded-full" style={{ background: colors[entry.source] ?? "#8fa0b3" }} />
                  <span className="max-w-[140px] truncate">{entry.source}</span>
                  <span className="text-ink-4">{entry.count}</span>
                </span>
              ))}
            </div>
          </Panel>
        </section>

        <Panel meta="Test retrieval" sub="See which chunks answer a question, with similarity scores">
          <RetrievalTester colors={colors} onHighlight={(ids) => setHighlight(new Set(ids))} />
        </Panel>

        {chunking && (
          <Panel meta="Chunking strategy" sub={chunking.strategy}>
            <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line-1 bg-line-1 sm:grid-cols-4">
              <div className="bg-surface-1 px-3 py-2.5">
                <div className="text-[11px] text-ink-3">Max chunk</div>
                <div className="mt-1 text-[15px] font-medium tabular-nums text-ink-1">{chunking.maxChars}<span className="text-[11px] text-ink-4"> chars</span></div>
              </div>
              <div className="bg-surface-1 px-3 py-2.5">
                <div className="text-[11px] text-ink-3">Overlap</div>
                <div className="mt-1 text-[15px] font-medium tabular-nums text-ink-1">{chunking.overlapChars}<span className="text-[11px] text-ink-4"> chars</span></div>
              </div>
              <div className="bg-surface-1 px-3 py-2.5">
                <div className="text-[11px] text-ink-3">Min chunk</div>
                <div className="mt-1 text-[15px] font-medium tabular-nums text-ink-1">{chunking.minChars}<span className="text-[11px] text-ink-4"> chars</span></div>
              </div>
              <div className="bg-surface-1 px-3 py-2.5">
                <div className="text-[11px] text-ink-3">Model</div>
                <div className="mt-1 truncate text-[12.5px] font-medium text-ink-1">MiniLM-L6</div>
              </div>
            </div>
            <ol className="flex flex-col gap-2">
              {chunking.rationale.map((reason, index) => (
                <li key={index} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-2">
                  <span className="mt-px text-[11px] tabular-nums text-ink-4">{index + 1}</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ol>
          </Panel>
        )}

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <MetaLabel label="Embedded chunks" />
            <span className="text-[11px] tabular-nums text-ink-4">{stats?.chunks ?? 0} total</span>
          </div>

          {grouped.map(([source, chunks]) => {
            const origin = chunks[0]?.origin ?? "seed";
            return (
              <div key={source} className="overflow-hidden rounded-lg border border-line-1 bg-surface-1">
                <div className="flex items-center gap-2.5 border-b border-line-1 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colors[source] ?? "#8fa0b3" }} />
                  <span className="truncate text-[12.5px] font-medium text-ink-1">{source}</span>
                  <Tag tone={origin === "added" ? "info" : "neutral"}>{origin === "added" ? "added" : "seed"}</Tag>
                  <span className="ml-auto text-[11px] tabular-nums text-ink-4">{chunks.length} chunks</span>
                  {origin === "added" && (
                    <button
                      onClick={() => removeSource(source)}
                      className="text-ink-4 transition-colors hover:text-severe"
                      title="Remove this source"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  )}
                </div>
                <ul className="divide-y divide-line-1">
                  {chunks.map((chunk) => (
                    <li key={chunk.id} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-[4px] border border-chip-line bg-chip-bg px-1.5 py-px text-[11px] font-medium tabular-nums text-[color:var(--color-chip-ink)]">
                          #{chunk.chunkIndex}
                        </span>
                        <span className="truncate text-[12px] font-medium text-ink-1">{chunk.heading || "section"}</span>
                        <span className="ml-auto shrink-0 text-[10.5px] tabular-nums text-ink-4">
                          {chunk.charCount} chars · ~{chunk.tokensApprox} tok
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <Fingerprint values={chunk.fingerprint} />
                        <span className="text-[10px] text-ink-4">embedding fingerprint (first 24 of {stats?.dimensions ?? 384})</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[11.5px] leading-relaxed text-ink-3">
                        {chunk.text.length > 320 ? `${chunk.text.slice(0, 320).trim()}...` : chunk.text}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
