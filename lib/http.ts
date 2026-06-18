import { SttUnavailableError } from "@/lib/stt";
import { LlmUnavailableError } from "@/lib/llm";

export function errorResponse(error: unknown, fallbackMessage: string): Response {
  const message = error instanceof Error && error.message ? error.message : fallbackMessage;
  const unavailable = error instanceof SttUnavailableError || error instanceof LlmUnavailableError;
  return Response.json({ error: message }, { status: unavailable ? 503 : 500 });
}
