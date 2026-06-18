import { transcribeFile } from "@/lib/stt";
import { runCommand } from "@/lib/agent";
import { logActivity } from "@/lib/work-orders";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  try {
    const form = await request.formData();
    const file = form.get("audio") as File | null;
    const text = form.get("text") as string | null;

    const command = file ? await transcribeFile(file) : (text ?? "");
    if (!command) return Response.json({ error: "No command provided." }, { status: 400 });

    const reply = await runCommand(command);
    await logActivity("work_order", command, { reply });

    return Response.json({ command, reply });
  } catch (error) {
    return errorResponse(error, "Failed to run the command.");
  }
}
