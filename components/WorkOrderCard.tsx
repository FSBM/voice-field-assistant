import type { WorkOrderRow } from "@/lib/types";
import Tag, { type Tone } from "@/components/ui/tag";

const severityTone: Record<string, Tone> = {
  low: "healthy",
  medium: "recovery",
  high: "severe",
  critical: "severe",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10.5px] font-medium tracking-[0.02em] text-ink-4">{label}</dt>
      <dd className="mt-0.5 text-[12px] text-ink-2">
        {value || <span className="text-ink-4">not set</span>}
      </dd>
    </div>
  );
}

export default function WorkOrderCard({ order }: { order: WorkOrderRow }) {
  const tone = severityTone[order.severity] ?? "neutral";
  return (
    <div className="overflow-hidden rounded-sm border border-line-1 bg-inset p-3.5 text-[12.5px]">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium tracking-[-0.01em] text-ink-1">
          {order.equipment_code || "Unspecified"}
        </span>
        <Tag tone={tone} dot>
          {order.severity}
        </Tag>
      </div>

      <p className="mt-2.5 leading-relaxed text-ink-2">{order.inspection_result || "No summary recorded."}</p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line-1 pt-3">
        <Field label="Fault" value={order.fault_code} />
        <Field label="Location" value={order.location} />
        <Field label="Action" value={order.action_taken} />
        <Field label="Status" value={order.status} />
      </dl>

      {order.parts_required.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-line-1 pt-3 text-[11.5px] text-ink-3">
          {order.parts_required.map((part, index) => (
            <li key={index} className="flex justify-between gap-3">
              <span className="text-ink-2">{part.name}</span>
              <span className="tabular-nums text-ink-3">
                {part.quantity} × · {part.part_number || "no pn"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
