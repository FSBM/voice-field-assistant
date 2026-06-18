export type LlmProvider = "groq" | "gemini" | "none";

export function hasGroq(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

export function hasGemini(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export function hasAnyLlm(): boolean {
  return hasGroq() || hasGemini();
}

export function primaryLlm(): LlmProvider {
  if (hasGroq()) return "groq";
  if (hasGemini()) return "gemini";
  return "none";
}

export function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}
