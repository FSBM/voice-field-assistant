import { transcribeFile } from "@/lib/stt";
import { answerQuestion } from "@/lib/rag";
import { logActivity } from "@/lib/work-orders";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  try {
    const form = await request.formData();
    const file = form.get("audio") as File | null;
    const text = form.get("text") as string | null;

    const question = file ? await transcribeFile(file) : (text ?? "");
    if (!question) return Response.json({ error: "No question provided." }, { status: 400 });

    const result = await answerQuestion(question);
    await logActivity("query", question, { answer: result.answer, sources: result.sources });

    return Response.json({ question, ...result });
  } catch (error) {
    return errorResponse(error, "Failed to answer the question.");
  }
}
