import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("activity_log")
      .select("id, kind, transcript, detail, created_at")
      .order("created_at", { ascending: false })
      .limit(15);
    if (error) throw new Error(error.message);
    return Response.json({ activity: data ?? [] });
  } catch {
    return Response.json({ activity: [] });
  }
}
