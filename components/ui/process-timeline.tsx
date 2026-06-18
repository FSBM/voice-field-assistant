"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Tag from "@/components/ui/tag";

type Phase = "idle" | "running" | "done" | "error";
type Status = "done" | "active" | "pending" | "error";

export default function ProcessTimeline({ steps, phase }: { steps: string[]; phase: Phase }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (phase !== "running") return;
    setActive(0);
    const id = setInterval(() => setActive((i) => Math.min(i + 1, steps.length - 1)), 700);
    return () => clearInterval(id);
  }, [phase, steps.length]);

  const statusOf = (i: number): Status => {
    if (phase === "done") return "done";
    if (phase === "error") return i < active ? "done" : i === active ? "error" : "pending";
    return i < active ? "done" : i === active ? "active" : "pending";
  };

  return (
    <div className="relative px-1 py-0.5">
      <span aria-hidden className="absolute bottom-[11px] left-[12px] top-[11px] w-px -translate-x-1/2 bg-line-2" />
      <ul className="flex flex-col gap-[10px]">
        {steps.map((label, i) => {
          const status = statusOf(i);
          return (
            <li key={i} className="relative flex items-center gap-3">
              <span
                className={cn(
                  "relative z-10 flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border bg-surface-1 transition-all duration-500",
                  status === "active" && "border-healthy shadow-[0_0_0_3px_rgba(110,214,139,0.14)]",
                  status === "error" && "border-severe shadow-[0_0_0_3px_rgba(240,106,91,0.14)]",
                  status === "done" && "border-line-3",
                  status === "pending" && "border-line-2 opacity-60",
                )}
              >
                <span
                  className={cn(
                    "h-[5px] w-[5px] rounded-full transition-colors duration-500",
                    status === "active" && "bg-healthy pulse-dot",
                    status === "error" && "bg-severe",
                    status === "done" && "bg-ink-2",
                    status === "pending" && "bg-ink-4",
                  )}
                />
              </span>
              <span
                className={cn(
                  "text-[12px] capitalize transition-colors duration-500",
                  status === "pending" ? "text-ink-3" : "text-ink-1",
                )}
              >
                {label}
              </span>
              <span className="ml-auto">
                {status === "done" && <Tag tone="healthy">Done</Tag>}
                {status === "active" && <Tag tone="neutral">Running</Tag>}
                {status === "error" && <Tag tone="severe">Failed</Tag>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
