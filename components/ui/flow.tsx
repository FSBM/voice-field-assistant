import { Children, Fragment, type ReactNode } from "react";
import { ArrowRight, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/components/ui/tag";

const toneBadge: Record<Tone, string> = {
  neutral: "border-line-2 bg-surface-2 text-ink-2",
  healthy: "border-healthy-line bg-healthy-bg text-healthy",
  recovery: "border-recovery-line bg-recovery-bg text-recovery",
  severe: "border-severe-line bg-severe-bg text-severe",
  info: "border-info-line bg-info-bg text-info",
};

export function FlowNode({
  icon,
  title,
  caption,
  tone = "neutral",
  className,
}: {
  icon: ReactNode;
  title: string;
  caption?: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2.5 rounded-sm border border-line-1 bg-surface-1 px-2.5 py-2",
        className,
      )}
    >
      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border", toneBadge[tone])}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[12px] font-medium text-ink-1">{title}</div>
        {caption && <div className="truncate text-[10.5px] text-ink-3">{caption}</div>}
      </div>
    </div>
  );
}

export function Pipeline({ children, vertical = false }: { children: ReactNode; vertical?: boolean }) {
  const items = Children.toArray(children);
  return (
    <div className={cn("flex flex-col gap-1.5", !vertical && "md:flex-row md:items-stretch")}>
      {items.map((child, i) => (
        <Fragment key={i}>
          {child}
          {i < items.length - 1 && (
            <span className="flex shrink-0 items-center justify-center self-center text-ink-4">
              {vertical ? (
                <ArrowDown size={14} />
              ) : (
                <>
                  <ArrowDown size={14} className="md:hidden" />
                  <ArrowRight size={14} className="hidden md:block" />
                </>
              )}
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );
}
