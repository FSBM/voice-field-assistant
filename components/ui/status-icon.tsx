import { Check, AlertTriangle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/components/ui/tag";

const map: Record<Tone, { wrap: string; Icon: typeof Check }> = {
  healthy: { wrap: "border-healthy-line bg-healthy-bg text-healthy", Icon: Check },
  info: { wrap: "border-info-line bg-info-bg text-info", Icon: Check },
  recovery: { wrap: "border-recovery-line bg-recovery-bg text-recovery", Icon: AlertTriangle },
  severe: { wrap: "border-severe-line bg-severe-bg text-severe", Icon: AlertTriangle },
  neutral: { wrap: "border-line-2 bg-surface-2 text-ink-3", Icon: Minus },
};

export default function StatusIcon({ tone = "neutral", size = 24 }: { tone?: Tone; size?: number }) {
  const m = map[tone] ?? map.neutral;
  const Icon = m.Icon;
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-full border", m.wrap)}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.44)} strokeWidth={2} />
    </span>
  );
}
