import { getSupabaseAdmin } from "@/lib/supabase-server";
import { broadcastWorkOrdersChanged } from "@/lib/realtime";
import type { WorkOrderInput } from "@/lib/schema";
import type { WorkOrderRow, WorkOrderStatus } from "@/lib/types";

export async function createWorkOrder(input: WorkOrderInput): Promise<WorkOrderRow> {
  const { data, error } = await getSupabaseAdmin()
    .from("work_orders")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const row = data as WorkOrderRow;
  await broadcastWorkOrdersChanged({ id: row.id, action: "create" });
  return row;
}

export async function listWorkOrders(): Promise<WorkOrderRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("work_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkOrderRow[];
}

export async function findWorkOrder(search: string): Promise<WorkOrderRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("work_orders")
    .select("*")
    .or(`equipment_code.ilike.%${search}%,fault_code.ilike.%${search}%`)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return data && data.length > 0 ? (data[0] as WorkOrderRow) : null;
}

export async function updateWorkOrder(
  id: string,
  patch: Partial<WorkOrderRow>
): Promise<WorkOrderRow> {
  const { data, error } = await getSupabaseAdmin()
    .from("work_orders")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const row = data as WorkOrderRow;
  await broadcastWorkOrdersChanged({ id: row.id, action: "update" });
  return row;
}

export async function setStatus(id: string, status: WorkOrderStatus): Promise<WorkOrderRow> {
  return updateWorkOrder(id, { status });
}

export async function logActivity(
  kind: "note" | "query" | "work_order",
  transcript: string,
  detail: unknown
): Promise<void> {
  try {
    await getSupabaseAdmin().from("activity_log").insert({ kind, transcript, detail });
    await broadcastWorkOrdersChanged({ kind });
  } catch {
    return;
  }
}
