import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";

export const models = {
  extract: groq("openai/gpt-oss-120b"),
  agent: groq("llama-3.3-70b-versatile"),
  answer: groq("llama-3.1-8b-instant"),
  fallback: google("gemini-2.5-flash-lite"),
};

export const STT_MODEL = "whisper-large-v3-turbo";
