import { cn } from "@/lib/utils";

export default function Fingerprint({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(0.0001, ...values.map((value) => Math.abs(value)));
  return (
    <div className={cn("flex h-5 items-end gap-px", className)} aria-hidden>
      {values.map((value, index) => {
        const height = Math.max(2, Math.round((Math.abs(value) / max) * 20));
        return (
          <span
            key={index}
            className={cn("w-[3px] shrink-0 rounded-[1px]", value >= 0 ? "bg-info/70" : "bg-recovery/70")}
            style={{ height }}
          />
        );
      })}
    </div>
  );
}
