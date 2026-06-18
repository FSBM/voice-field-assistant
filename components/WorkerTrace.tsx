import { Mic } from "lucide-react";
import type { WorkOrderRow } from "@/lib/types";
import WorkOrderCard from "@/components/WorkOrderCard";
import ProcessTimeline from "@/components/ui/process-timeline";
import StatusIcon from "@/components/ui/status-icon";
import Tag, { type Tone } from "@/components/ui/tag";
import InlineCode from "@/components/ui/inline-code";

type Phase = "idle" | "running" | "done" | "error";

const KIND_LABEL: Record<string, string> = { note: "Inspection", ask: "Query", command: "Command" };
const sevTone: Record<string, Tone> = { low: "healthy", medium: "recovery", high: "severe", critical: "severe" };

export default function WorkerTrace({
  session,
  kind,
  phase,
  steps,
  transcript,
  answer,
  order,
  status,
  elapsed,
}: {
  session: string;
  kind: "note" | "ask" | "command";
  phase: Phase;
  steps: string[];
  transcript: string;
  answer: string;
  order: WorkOrderRow | null;
  status: string;
  elapsed: number | null;
}) {
  const sess = (session || "------").slice(0, 6).toLowerCase();
  const showTrace = phase !== "idle" || !!transcript || !!status;

  return (
    <div className="overflow-hidden border border-line-1 bg-surface-1" style={{ borderRadius: "var(--radius-lg)" }}>
      <div className="flex items-center justify-between gap-3 border-b border-line-1 px-4 pb-3 pt-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-2 bg-surface-2 text-ink-2">
            <Mic size={12} strokeWidth={2} />
          </span>
          <span className="text-[13px] font-medium tracking-[-0.005em] text-ink-1">Field session</span>
          <span className="text-[11px] tracking-[-0.01em] text-ink-4">run_{sess}</span>
        </div>
        <div className="flex items-center gap-2">
          {showTrace && <Tag tone="neutral">{KIND_LABEL[kind]}</Tag>}
          {elapsed !== null && <span className="text-[10.5px] tabular-nums text-ink-4">{elapsed} ms</span>}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 text-[12.5px]">
        {!showTrace && (
          <p className="py-2 text-[12px] text-ink-3">No trace yet. Tap an action to begin.</p>
        )}

        {phase !== "idle" && <ProcessTimeline steps={steps} phase={phase} />}

        {transcript && (
          <div className="rounded-sm border border-line-1 bg-inset px-3.5 py-3">
            <div className="text-[10.5px] font-medium tracking-[0.04em] text-ink-4">Heard</div>
            <div className="mt-1.5 leading-relaxed text-ink-1">{transcript}</div>
          </div>
        )}

        {order && (
          <>
            <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-2">
              <span className="text-ink-3">Extracted</span>
              {order.equipment_code && <InlineCode dot>{order.equipment_code}</InlineCode>}
              {order.fault_code && <InlineCode tone="err" dot>{order.fault_code}</InlineCode>}
              {order.location && (
                <span className="text-ink-3">
                  at <InlineCode>{order.location}</InlineCode>
                </span>
              )}
              <Tag tone={sevTone[order.severity] ?? "neutral"} dot>
                {order.severity}
              </Tag>
            </div>
            <WorkOrderCard order={order} />
          </>
        )}

        {answer && <p className="leading-relaxed text-ink-1">{answer}</p>}

        {status && (
          <div className="flex items-center gap-2 text-[12px]">
            <StatusIcon tone={phase === "error" ? "severe" : "healthy"} size={18} />
            <span className={phase === "error" ? "text-severe" : "text-ink-2"}>{status}</span>
          </div>
        )}

        {phase === "running" && (
          <div className="flex items-center gap-2 text-[11.5px] text-ink-3">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-info" />
            Processing
          </div>
        )}
      </div>
    </div>
  );
}
