"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Tag from "@/components/ui/tag";
import { cn } from "@/lib/utils";

interface Result {
  id: string;
  source: string;
  heading: string;
  chunkIndex: number;
  text: string;
  origin: string;
  score: number;
}

function snippet(text: string): string {
  const clean = text.replace(/^#.*$/gm, "").replace(/[#*`>]/g, "").replace(/\s+/g, " ").trim();
  return clean.length > 150 ? `${clean.slice(0, 150)}...` : clean;
}

export default function RetrievalTester({
  colors,
  onHighlight,
}: {
  colors: Record<string, string>;
  onHighlight: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [answer, setAnswer] = useState<{ text: string; degraded: boolean } | null>(null);
  const [busy, setBusy] = useState<null | "search" | "answer">(null);
  const [error, setError] = useState<string | null>(null);

  async function runSearch() {
    if (!query.trim() || busy) return;
    setBusy("search");
    setAnswer(null);
    setError(null);
    try {
      const res = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.results) {
        setResults(data.results as Result[]);
        onHighlight((data.results as Result[]).slice(0, 4).map((result) => result.id));
      } else {
        setResults([]);
        onHighlight([]);
      }
    } catch {
      setError("Search failed. Please check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function runAnswer() {
    if (!query.trim() || busy) return;
    setBusy("answer");
    setError(null);
    try {
      const form = new FormData();
      form.append("text", query);
      const res = await fetch("/api/ask", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.answer) {
        setAnswer({ text: data.answer, degraded: Boolean(data.degraded) });
        if (Array.isArray(data.matches)) {
          setResults(
            data.matches.map((match: { source: string; heading: string; chunkIndex: number; score: number }) => ({
              id: `${match.source}#${match.chunkIndex}`,
              source: match.source,
              heading: match.heading,
              chunkIndex: match.chunkIndex,
              text: "",
              origin: "seed",
              score: match.score,
            })),
          );
        }
      } else {
        setAnswer({ text: data?.error ?? "Could not answer that.", degraded: true });
      }
    } catch {
      setError("Could not reach the assistant. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-sm border border-line-1 bg-inset px-2.5">
          <Search className="h-[14px] w-[14px] shrink-0 text-ink-4" strokeWidth={2} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && runSearch()}
            placeholder="Ask the manuals, e.g. torque spec for AHU-12 fan bolts"
            className="w-full bg-transparent py-2 text-[12.5px] text-ink-1 placeholder:text-ink-4 focus:outline-none"
          />
        </div>
        <Button size="sm" variant="ghost" onClick={runSearch} disabled={busy !== null}>
          {busy === "search" ? "Searching..." : "Retrieve"}
        </Button>
        <Button size="sm" onClick={runAnswer} disabled={busy !== null}>
          {busy === "answer" ? "Answering..." : "Answer"}
        </Button>
      </div>

      {error && <p className="text-[11.5px] text-severe">{error}</p>}

      {answer && (
        <div className="rounded-sm border border-line-1 bg-inset p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-[11px] font-medium tracking-[0.04em] text-ink-3">Grounded answer</span>
            {answer.degraded && <Tag tone="recovery" dot>retrieval-only fallback</Tag>}
          </div>
          <p className="text-[12.5px] leading-relaxed text-ink-1">{answer.text}</p>
        </div>
      )}

      {results && results.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {results.map((result, rank) => {
            const width = Math.max(2, Math.min(100, Math.round(result.score * 100)));
            return (
              <li key={result.id} className="rounded-sm border border-line-1 bg-surface-1 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] tabular-nums text-ink-4">#{rank + 1}</span>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colors[result.source] ?? "#8fa0b3" }} />
                  <span className="truncate text-[12px] font-medium text-ink-1">{result.heading || result.source}</span>
                  <span className="ml-auto text-[11px] tabular-nums text-ink-3">{(result.score * 100).toFixed(1)}%</span>
                </div>
                <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-inset">
                  <span className={cn("block h-full rounded-full", result.score >= 0.45 ? "bg-healthy" : result.score >= 0.3 ? "bg-recovery" : "bg-ink-4")} style={{ width: `${width}%` }} />
                </div>
                <div className="mt-1.5 truncate text-[11px] text-ink-3">
                  {result.source} · #{result.chunkIndex}
                  {result.text ? ` · ${snippet(result.text)}` : ""}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {results && results.length === 0 && <p className="text-[12px] text-ink-3">No matches found.</p>}
    </div>
  );
}
