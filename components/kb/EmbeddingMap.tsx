"use client";

import { useState } from "react";

export const SOURCE_PALETTE = [
  "#6c9bf5",
  "#6ed68b",
  "#ecc556",
  "#f06a5b",
  "#b98cf5",
  "#5fd0c8",
  "#f0a35b",
  "#8fa0b3",
];

export function buildSourceColors(sources: string[]): Record<string, string> {
  const colors: Record<string, string> = {};
  [...sources].sort().forEach((source, index) => {
    colors[source] = SOURCE_PALETTE[index % SOURCE_PALETTE.length];
  });
  return colors;
}

export interface MapPoint {
  id: string;
  x: number;
  y: number;
  source: string;
  origin: string;
  heading: string;
  chunkIndex: number;
}

const PAD = 7;
const place = (value: number) => PAD + value * (100 - 2 * PAD);

export interface MapEdge {
  a: number;
  b: number;
  score: number;
}

export default function EmbeddingMap({
  points,
  edges = [],
  colors,
  highlight,
}: {
  points: MapPoint[];
  edges?: MapEdge[];
  colors: Record<string, string>;
  highlight: Set<string>;
}) {
  const [hovered, setHovered] = useState<MapPoint | null>(null);
  const dimming = highlight.size > 0;

  return (
    <div>
      <div className="relative overflow-hidden rounded-md border border-line-1 bg-inset">
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="aspect-[5/4] w-full">
          {edges.map((edge) => {
            const from = points[edge.a];
            const to = points[edge.b];
            if (!from || !to) return null;
            const lit = highlight.has(from.id) || highlight.has(to.id);
            const base = 0.08 + edge.score * 0.22;
            return (
              <line
                key={`${edge.a}-${edge.b}`}
                x1={place(from.x)}
                y1={place(1 - from.y)}
                x2={place(to.x)}
                y2={place(1 - to.y)}
                stroke="#ffffff"
                strokeWidth={lit ? 0.5 : 0.3}
                strokeOpacity={dimming && !lit ? 0.04 : base}
              />
            );
          })}
          {points.map((point) => {
            const isHot = highlight.has(point.id);
            const cx = place(point.x);
            const cy = place(1 - point.y);
            return (
              <circle
                key={point.id}
                cx={cx}
                cy={cy}
                r={isHot ? 2.6 : 1.7}
                fill={colors[point.source] ?? "#8fa0b3"}
                stroke={isHot ? "#ffffff" : "transparent"}
                strokeWidth={isHot ? 0.7 : 0}
                opacity={dimming && !isHot ? 0.22 : point.origin === "added" ? 1 : 0.92}
                onMouseEnter={() => setHovered(point)}
                onMouseLeave={() => setHovered((current) => (current?.id === point.id ? null : current))}
                style={{ cursor: "pointer", transition: "opacity 0.15s ease" }}
              />
            );
          })}
        </svg>
      </div>
      <div className="mt-2 h-4 truncate text-[11px] text-ink-3">
        {hovered ? (
          <span>
            <span className="text-ink-2">{hovered.source}</span>
            <span className="text-ink-4"> · #{hovered.chunkIndex} · </span>
            {hovered.heading || "section"}
          </span>
        ) : (
          <span className="text-ink-4">Each dot is a chunk, placed by meaning (PCA to 2D). Lines link the nearest neighbours. Hover to inspect.</span>
        )}
      </div>
    </div>
  );
}
