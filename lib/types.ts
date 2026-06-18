import type { WorkOrderInput } from "@/lib/schema";

export type WorkOrderStatus = "open" | "in_progress" | "closed";

export interface WorkOrderRow extends WorkOrderInput {
  id: string;
  status: WorkOrderStatus;
  created_at: string;
}

export interface ActivityRow {
  id: string;
  kind: "note" | "query" | "work_order";
  transcript: string | null;
  detail: unknown;
  created_at: string;
}
