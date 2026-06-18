import { cn } from "@/lib/utils";

export type Tone = "neutral" | "healthy" | "recovery" | "severe" | "info";

const toneClass: Record<Tone, string> = {
  neutral: "bg-surface-2 border-line-2 text-ink-2",
  healthy: "bg-healthy-bg border-healthy-line text-healthy",
  recovery: "bg-recovery-bg border-recovery-line text-recovery",
  severe: "bg-severe-bg border-severe-line text-severe",
  info: "bg-info-bg border-info-line text-info",
};

const dotClass: Record<Tone, string> = {
  neutral: "bg-ink-3",
  healthy: "bg-healthy",
  recovery: "bg-recovery",
  severe: "bg-severe",
  info: "bg-info",
};

export default function Tag({
  tone = "neutral",
  children,
  dot = false,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] whitespace-nowrap rounded-full border px-[8px] py-[2px] text-[11px] font-medium leading-[1.3] tracking-[-0.005em]",
        toneClass[tone],
        className,
      )}
    >
      {dot && <span className={cn("h-[5px] w-[5px] shrink-0 rounded-full", dotClass[tone])} />}
      {children}
    </span>
  );
}
