import { primaryLlm, hasGroq, hasSupabase } from "@/lib/env";
import { kbStats } from "@/lib/kb/store";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const kb = await kbStats().catch(() => ({ chunks: 0, sources: 0 }));
  return Response.json({
    ok: true,
    llm: primaryLlm(),
    stt: hasGroq(),
    supabase: hasSupabase(),
    kb,
  });
}
