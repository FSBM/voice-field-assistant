import { embed } from "@/lib/embeddings";
import { searchScored } from "@/lib/kb/store";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => ({}))) as { query?: string };
    const query = (body.query ?? "").trim();
    if (!query) return Response.json({ error: "No query provided." }, { status: 400 });

    const vector = await embed(query);
    const scored = await searchScored(vector, 8);

    const results = scored.map((item) => ({
      id: item.chunk.id,
      source: item.chunk.source,
      heading: item.chunk.heading,
      chunkIndex: item.chunk.chunkIndex,
      text: item.chunk.text,
      origin: item.chunk.origin,
      score: Number(item.score.toFixed(4)),
    }));

    return Response.json({ query, results });
  } catch (error) {
    return errorResponse(error, "Search failed.");
  }
}
