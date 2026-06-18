import { transcribeFile } from "@/lib/stt";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  try {
    const form = await request.formData();
    const file = form.get("audio") as File | null;
    if (!file) return Response.json({ error: "No audio uploaded." }, { status: 400 });
    const text = await transcribeFile(file);
    return Response.json({ text });
  } catch (error) {
    return errorResponse(error, "Failed to transcribe the audio.");
  }
}
