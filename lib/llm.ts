import type { LanguageModel } from "ai";
import { models } from "@/lib/ai";
import { hasGroq, hasGemini } from "@/lib/env";

export type LlmJob = "extract" | "agent" | "answer";

export class LlmUnavailableError extends Error {
  constructor(message = "No language model is configured.") {
    super(message);
    this.name = "LlmUnavailableError";
  }
}

function modelChain(job: LlmJob): LanguageModel[] {
  const chain: LanguageModel[] = [];
  if (hasGroq()) chain.push(models[job]);
  if (hasGemini()) chain.push(models.fallback);
  return chain;
}

export function isRetryable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as Record<string, unknown>;
  const cause = (e.cause ?? {}) as Record<string, unknown>;
  const code = (e.statusCode ?? e.status ?? cause.statusCode) as number | undefined;
  if (typeof code === "number" && (code === 408 || code === 409 || code === 429 || code >= 500)) {
    return true;
  }
  const message = String(e.message ?? "").toLowerCase();
  return /rate.?limit|quota|overload|too many requests|timed? ?out|temporarily|capacity|econn|fetch failed|service unavailable/.test(
    message,
  );
}

export async function withModelFallback<T>(
  job: LlmJob,
  run: (model: LanguageModel) => Promise<T>,
): Promise<T> {
  const chain = modelChain(job);
  if (chain.length === 0) throw new LlmUnavailableError();

  let lastError: unknown;
  for (let i = 0; i < chain.length; i++) {
    try {
      return await run(chain[i]);
    } catch (error) {
      lastError = error;
      const hasFallbackLeft = i < chain.length - 1;
      if (hasFallbackLeft && isRetryable(error)) continue;
      throw error;
    }
  }
  throw lastError as Error;
}
