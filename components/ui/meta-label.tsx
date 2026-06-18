import { cn } from "@/lib/utils";

export default function MetaLabel({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("text-[11px] font-medium tracking-[0.04em] text-ink-3", className)}>{label}</div>
  );
}
