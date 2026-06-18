import Groq from "groq-sdk";
import { STT_MODEL } from "@/lib/ai";
import { STT_DOMAIN_PROMPT } from "@/lib/prompts";
import { hasGroq } from "@/lib/env";

export class SttUnavailableError extends Error {
  constructor(message = "Speech-to-text needs a Groq API key. You can type your text instead.") {
    super(message);
    this.name = "SttUnavailableError";
  }
}

let client: Groq | null = null;

function getClient(): Groq {
  client ??= new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

export async function transcribeFile(file: File): Promise<string> {
  if (!hasGroq()) throw new SttUnavailableError();
  const result = await getClient().audio.transcriptions.create({
    file,
    model: STT_MODEL,
    language: "en",
    prompt: STT_DOMAIN_PROMPT,
    response_format: "json",
  });
  return result.text.trim();
}
