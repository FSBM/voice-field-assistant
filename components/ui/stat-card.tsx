import { cn } from "@/lib/utils";

export default function StatCard({
  label,
  value,
  accent = "text-ink-1",
  suffix,
  live = false,
  className,
}: {
  label: string;
  value: number | string;
  accent?: string;
  suffix?: string;
  live?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 px-4 py-3.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] leading-none text-ink-3">{label}</span>
        {live && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-severe" />}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("text-[26px] font-medium leading-none tracking-[-0.028em] tabular-nums", accent)}>
          {value}
        </span>
        {suffix && <span className="text-[11px] text-ink-3">{suffix}</span>}
      </div>
    </div>
  );
}
