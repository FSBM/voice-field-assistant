import { cn } from "@/lib/utils";
import type { Tone } from "@/components/ui/tag";

const fillClass: Record<Tone, string> = {
  neutral: "bg-ink-3",
  healthy: "bg-healthy",
  recovery: "bg-recovery",
  severe: "bg-severe",
  info: "bg-info",
};

export type WaterfallRow = { label: string; value: number; tone: Tone };

export default function Waterfall({ rows }: { rows: WaterfallRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[68px_1fr_28px] items-center gap-3">
          <span className="truncate text-[11px] capitalize text-ink-2">{r.label}</span>
          <div className="relative h-[10px] overflow-hidden rounded-[3px] bg-inset">
            <span
              className={cn("bar-grow absolute left-0 top-0 h-full rounded-[3px]", fillClass[r.tone])}
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
          <span className="text-right text-[10.5px] tabular-nums text-ink-3">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
