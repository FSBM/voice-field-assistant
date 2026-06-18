import seedVectors from "@/lib/kb/vectors.json";
import { embed } from "@/lib/embeddings";
import { chunkDocument, CHUNKING } from "@/lib/kb/chunk";
import { hasSupabase } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export interface KbChunk {
  id: string;
  source: string;
  chunkIndex: number;
  heading: string;
  text: string;
  charCount: number;
  tokensApprox: number;
  origin: "seed" | "added";
  embedding: number[];
  createdAt?: string;
}

export interface ScoredChunk {
  chunk: KbChunk;
  score: number;
}

interface SeedRecord {
  id: string;
  source: string;
  text: string;
  embedding: number[];
  chunkIndex?: number;
  heading?: string;
  charCount?: number;
  tokensApprox?: number;
}

const seedChunks: KbChunk[] = (seedVectors as SeedRecord[]).map((record, index) => ({
  id: record.id,
  source: record.source,
  chunkIndex: record.chunkIndex ?? index,
  heading: record.heading ?? "",
  text: record.text,
  charCount: record.charCount ?? record.text.length,
  tokensApprox: record.tokensApprox ?? Math.ceil(record.text.length / 4),
  origin: "seed",
  embedding: record.embedding,
}));

const memoryChunks: KbChunk[] = [];
let supabaseCache: KbChunk[] | null = null;
let supabaseCacheAt = 0;
let idCounter = 0;

function nextId(source: string, chunkIndex: number): string {
  idCounter += 1;
  return `${source}#${chunkIndex}-${Date.now().toString(36)}${idCounter.toString(36)}`;
}

function rowToChunk(row: Record<string, unknown>): KbChunk {
  return {
    id: String(row.id),
    source: String(row.source),
    chunkIndex: Number(row.chunk_index ?? 0),
    heading: String(row.heading ?? ""),
    text: String(row.text ?? ""),
    charCount: Number(row.char_count ?? 0),
    tokensApprox: Number(row.tokens_approx ?? 0),
    origin: "added",
    embedding: (row.embedding as number[]) ?? [],
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

async function loadAddedChunks(): Promise<KbChunk[]> {
  if (!hasSupabase()) return [...memoryChunks];
  const now = Date.now();
  if (supabaseCache && now - supabaseCacheAt < 4000) return supabaseCache;
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("kb_chunks")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    supabaseCache = (data ?? []).map(rowToChunk);
    supabaseCacheAt = now;
    return supabaseCache;
  } catch {
    return [...memoryChunks];
  }
}

async function persist(chunks: KbChunk[]): Promise<void> {
  if (!hasSupabase()) {
    memoryChunks.push(...chunks);
    return;
  }
  const rows = chunks.map((chunk) => ({
    id: chunk.id,
    source: chunk.source,
    chunk_index: chunk.chunkIndex,
    heading: chunk.heading,
    text: chunk.text,
    char_count: chunk.charCount,
    tokens_approx: chunk.tokensApprox,
    embedding: chunk.embedding,
  }));
  try {
    const { error } = await getSupabaseAdmin().from("kb_chunks").insert(rows);
    if (error) throw new Error(error.message);
    supabaseCache = null;
  } catch {
    memoryChunks.push(...chunks);
  }
}

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

export async function getAllChunks(): Promise<KbChunk[]> {
  const added = await loadAddedChunks();
  return [...seedChunks, ...added];
}

export async function searchScored(queryVector: number[], topK = 6): Promise<ScoredChunk[]> {
  const all = await getAllChunks();
  return all
    .map((chunk) => ({ chunk, score: cosine(queryVector, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export async function searchKnowledge(queryVector: number[], topK = 6): Promise<KbChunk[]> {
  const scored = await searchScored(queryVector, topK);
  return scored.map((item) => item.chunk);
}

export async function lexicalSearch(query: string, topK = 6): Promise<ScoredChunk[]> {
  const terms = query.toLowerCase().match(/[a-z0-9-]+/g) ?? [];
  if (terms.length === 0) return [];
  const all = await getAllChunks();
  return all
    .map((chunk) => {
      const haystack = `${chunk.heading} ${chunk.text}`.toLowerCase();
      let hits = 0;
      for (const term of terms) if (haystack.includes(term)) hits += 1;
      return { chunk, score: hits / terms.length };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export async function addDocument(source: string, content: string): Promise<KbChunk[]> {
  const records = chunkDocument(source, content);
  if (records.length === 0) return [];

  const added: KbChunk[] = [];
  for (const record of records) {
    const embedding = await embed(record.text);
    added.push({
      ...record,
      id: nextId(source, record.chunkIndex),
      origin: "added",
      embedding,
      createdAt: new Date().toISOString(),
    });
  }
  await persist(added);
  return added;
}

export async function removeSource(source: string): Promise<number> {
  const before = memoryChunks.length;
  for (let i = memoryChunks.length - 1; i >= 0; i--) {
    if (memoryChunks[i].source === source) memoryChunks.splice(i, 1);
  }
  let removed = before - memoryChunks.length;

  if (hasSupabase()) {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("kb_chunks")
        .delete()
        .eq("source", source)
        .select("id");
      if (!error) {
        supabaseCache = null;
        removed += data?.length ?? 0;
      }
    } catch {
      return removed;
    }
  }
  return removed;
}

export async function kbStats() {
  const all = await getAllChunks();
  const sources = new Set(all.map((chunk) => chunk.source));
  return {
    chunks: all.length,
    sources: sources.size,
    seedChunks: all.filter((chunk) => chunk.origin === "seed").length,
    addedChunks: all.filter((chunk) => chunk.origin === "added").length,
    dimensions: CHUNKING.dimensions,
    model: CHUNKING.embeddingModel,
    persistence: hasSupabase() ? "supabase" : "memory",
  };
}
