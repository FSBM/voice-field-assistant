import { cn } from "@/lib/utils";

export default function Panel({
  meta,
  sub,
  headerRight,
  children,
  className,
  bodyClassName,
}: {
  meta?: React.ReactNode;
  sub?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn("overflow-hidden border border-line-1 bg-surface-1", className)}
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      {(meta || headerRight) && (
        <div className="flex items-center justify-between gap-3 border-b border-line-1 px-4 pb-3 pt-3.5">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium tracking-[-0.005em] text-ink-1">{meta}</div>
            {sub && <div className="mt-[3px] truncate text-[11px] text-ink-3">{sub}</div>}
          </div>
          {headerRight && <div className="flex shrink-0 items-center gap-1.5">{headerRight}</div>}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </div>
  );
}
