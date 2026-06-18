import { cn } from "@/lib/utils";

type Tone = "ok" | "warn" | "err" | "idle";

const tones: Record<Tone, { wrap: string; dot: string }> = {
  ok: { wrap: "bg-healthy-bg border-healthy-line text-healthy", dot: "bg-healthy" },
  warn: { wrap: "bg-recovery-bg border-recovery-line text-recovery", dot: "bg-recovery" },
  err: { wrap: "bg-severe-bg border-severe-line text-severe", dot: "bg-severe" },
  idle: { wrap: "bg-surface-2 border-line-2 text-ink-2", dot: "bg-ink-3" },
};

export default function StatusPill({
  tone = "idle",
  label,
  live = false,
  className,
}: {
  tone?: Tone;
  label: string;
  live?: boolean;
  className?: string;
}) {
  const c = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[6px] whitespace-nowrap rounded-full border px-[8px] py-[2px] text-[11px] font-medium leading-[1.3] tracking-[-0.005em]",
        c.wrap,
        className,
      )}
    >
      <span className={cn("h-[5px] w-[5px] shrink-0 rounded-full", c.dot, live && "pulse-dot")} />
      {label}
    </span>
  );
}
