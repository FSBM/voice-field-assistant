import { generateText } from "ai";
import { withModelFallback } from "@/lib/llm";
import { hasAnyLlm } from "@/lib/env";
import { ANSWER_SYSTEM } from "@/lib/prompts";
import { embed } from "@/lib/embeddings";
import { searchScored, lexicalSearch, type ScoredChunk } from "@/lib/kb/store";

export interface RagMatch {
  source: string;
  heading: string;
  chunkIndex: number;
  score: number;
}

export interface RagAnswer {
  answer: string;
  sources: string[];
  matches: RagMatch[];
  degraded: boolean;
}

function cleanForSpeech(text: string): string {
  return text
    .replace(/^#.*$/gm, "")
    .replace(/[#*`>|]/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

function topChunkAnswer(scored: ScoredChunk[]): string {
  if (scored.length === 0) return "I do not have any information on that in the knowledge base yet.";
  const text = cleanForSpeech(scored[0].chunk.text);
  return text.length > 420 ? `${text.slice(0, 420).trim()}...` : text;
}

export async function answerQuestion(question: string): Promise<RagAnswer> {
  let scored: ScoredChunk[];
  try {
    const queryVector = await embed(question, "RETRIEVAL_QUERY");
    scored = await searchScored(queryVector, 6);
  } catch {
    scored = await lexicalSearch(question, 6);
  }
  const sources = Array.from(new Set(scored.map((item) => item.chunk.source)));
  const matches: RagMatch[] = scored.map((item) => ({
    source: item.chunk.source,
    heading: item.chunk.heading,
    chunkIndex: item.chunk.chunkIndex,
    score: Number(item.score.toFixed(4)),
  }));

  if (!hasAnyLlm()) {
    return { answer: topChunkAnswer(scored), sources, matches, degraded: true };
  }

  const context = scored.map((item) => item.chunk.text).join("\n\n");
  try {
    const { text } = await withModelFallback("answer", (model) =>
      generateText({
        model,
        system: ANSWER_SYSTEM,
        prompt: `Context from the knowledge base:\n${context}\n\nQuestion: ${question}`,
      }),
    );
    return { answer: text.trim(), sources, matches, degraded: false };
  } catch {
    return { answer: topChunkAnswer(scored), sources, matches, degraded: true };
  }
}
