import { transcribeFile } from "@/lib/stt";
import { extractWorkOrder } from "@/lib/extract";
import { createWorkOrder, logActivity } from "@/lib/work-orders";
import { errorResponse } from "@/lib/http";
import type { WorkOrderRow } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  try {
    const form = await request.formData();
    const file = form.get("audio") as File | null;
    const text = form.get("text") as string | null;
    if (!file && !text) return Response.json({ error: "No audio or text uploaded." }, { status: 400 });

    const transcript = file ? await transcribeFile(file) : (text ?? "");
    const workOrder = await extractWorkOrder(transcript);

    let saved: WorkOrderRow | null = null;
    try {
      saved = await createWorkOrder(workOrder);
      await logActivity("note", transcript, { workOrderId: saved.id });
    } catch {
      saved = null;
    }

    const order: WorkOrderRow =
      saved ?? {
        ...workOrder,
        id: `local-${Date.now().toString(36)}`,
        status: "open",
        created_at: new Date().toISOString(),
      };

    return Response.json({ transcript, workOrder: order, saved: Boolean(saved) });
  } catch (error) {
    return errorResponse(error, "Failed to process the note.");
  }
}
