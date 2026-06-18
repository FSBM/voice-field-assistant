import { transcribeFile } from "@/lib/stt";
import { errorResponse } from "@/lib/http";
import { hasSupabase } from "@/lib/env";
import { CHUNKING } from "@/lib/kb/chunk";
import { project2D } from "@/lib/kb/projection";
import { getAllChunks, addDocument, removeSource } from "@/lib/kb/store";

export const runtime = "nodejs";
export const maxDuration = 60;

function cosine(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let product = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    product += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const score = product / (Math.sqrt(normA * normB) || 1);
  return Number.isFinite(score) ? score : 0;
}

function nearestNeighbourEdges(vectors: number[][], perNode = 2, threshold = 0.4) {
  const edges: { a: number; b: number; score: number }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < vectors.length; i++) {
    const scored = [];
    for (let j = 0; j < vectors.length; j++) {
      if (i === j) continue;
      scored.push({ j, score: cosine(vectors[i], vectors[j]) });
    }
    scored.sort((x, y) => y.score - x.score);
    for (const { j, score } of scored.slice(0, perNode)) {
      if (score < threshold) continue;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a: Math.min(i, j), b: Math.max(i, j), score: Number(score.toFixed(3)) });
    }
  }
  return edges;
}

export async function GET(): Promise<Response> {
  try {
    const chunks = await getAllChunks();
    const embeddings = chunks.map((chunk) => chunk.embedding);
    const coords = project2D(embeddings);
    const edges = nearestNeighbourEdges(embeddings);

    const points = chunks.map((chunk, index) => ({
      id: chunk.id,
      source: chunk.source,
      chunkIndex: chunk.chunkIndex,
      heading: chunk.heading,
      text: chunk.text,
      charCount: chunk.charCount,
      tokensApprox: chunk.tokensApprox,
      origin: chunk.origin,
      x: coords[index]?.x ?? 0.5,
      y: coords[index]?.y ?? 0.5,
      fingerprint: chunk.embedding.slice(0, 24),
    }));

    const sourceMap = new Map<string, { source: string; origin: string; count: number }>();
    for (const chunk of chunks) {
      const entry = sourceMap.get(chunk.source) ?? { source: chunk.source, origin: chunk.origin, count: 0 };
      entry.count += 1;
      sourceMap.set(chunk.source, entry);
    }

    const stats = {
      chunks: chunks.length,
      sources: sourceMap.size,
      seedChunks: chunks.filter((chunk) => chunk.origin === "seed").length,
      addedChunks: chunks.filter((chunk) => chunk.origin === "added").length,
      dimensions: CHUNKING.dimensions,
      model: CHUNKING.embeddingModel,
      persistence: hasSupabase() ? "supabase" : "memory",
    };

    return Response.json({ stats, chunking: CHUNKING, points, edges, sources: [...sourceMap.values()] });
  } catch (error) {
    return errorResponse(error, "Failed to load the knowledge base.");
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let source = "";
    let content = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file") as File | null;
      const audio = form.get("audio") as File | null;
      const text = form.get("text") as string | null;
      source = ((form.get("source") as string | null) ?? "").trim();

      if (file) {
        content = await file.text();
        if (!source) source = file.name;
      } else if (audio) {
        content = await transcribeFile(audio);
        if (!source) source = `voice-note-${Date.now().toString(36)}`;
      } else if (text) {
        content = text;
      }
    } else {
      const body = (await request.json().catch(() => ({}))) as { text?: string; source?: string };
      content = body.text ?? "";
      source = (body.source ?? "").trim();
    }

    content = content.trim();
    if (!content) return Response.json({ error: "No knowledge text provided." }, { status: 400 });
    if (!source) source = `note-${Date.now().toString(36)}`;

    const added = await addDocument(source, content);
    return Response.json({
      source,
      count: added.length,
      added: added.map((chunk) => ({
        id: chunk.id,
        chunkIndex: chunk.chunkIndex,
        heading: chunk.heading,
        charCount: chunk.charCount,
        tokensApprox: chunk.tokensApprox,
      })),
    });
  } catch (error) {
    return errorResponse(error, "Failed to add knowledge.");
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const source = new URL(request.url).searchParams.get("source");
    if (!source) return Response.json({ error: "No source given." }, { status: 400 });
    const removed = await removeSource(source);
    return Response.json({ removed });
  } catch (error) {
    return errorResponse(error, "Failed to remove the source.");
  }
}
