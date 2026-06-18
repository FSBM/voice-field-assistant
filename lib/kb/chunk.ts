export interface ChunkRecord {
  source: string;
  chunkIndex: number;
  heading: string;
  text: string;
  charCount: number;
  tokensApprox: number;
}

export const CHUNKING = {
  strategy: "Heading-anchored, size-bounded, with sentence overlap",
  maxChars: 900,
  minChars: 80,
  overlapChars: 150,
  embeddingModel: "gemini-embedding-001",
  dimensions: 768,
  rationale: [
    "Split on Markdown headings so each chunk covers one coherent topic. Retrieval then returns a whole idea instead of a sentence cut off mid-thought.",
    "Carry the document title into every chunk as context, so an isolated section still knows which manual or equipment it belongs to.",
    "Cap each chunk near 900 characters (about 220 tokens) to keep each passage focused, so a single embedding is not asked to summarise an over-long, multi-topic span.",
    "When a section is larger than the cap, pack it into windows along paragraph and sentence boundaries, and overlap about 150 characters between windows so an answer that straddles a boundary is never lost.",
    "Merge fragments below the minimum size into their neighbour, so we never store a near-empty embedding that adds noise to the search.",
  ],
};

function approxTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function firstLine(section: string): string {
  const line = section.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  return line.length > 64 ? `${line.slice(0, 61)}...` : line || "Overview";
}

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+(\s|$)|\S[^.!?]*$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

function hardSlice(text: string, budget: number): string[] {
  if (text.length <= budget) return [text];
  const slices: string[] = [];
  const step = Math.max(1, budget - CHUNKING.overlapChars);
  for (let i = 0; i < text.length; i += step) {
    slices.push(text.slice(i, i + budget).trim());
    if (i + budget >= text.length) break;
  }
  return slices.filter(Boolean);
}

function overlapTail(text: string): string {
  if (text.length <= CHUNKING.overlapChars) return text.trim();
  const slice = text.slice(text.length - CHUNKING.overlapChars);
  const boundary = slice.indexOf(". ");
  return (boundary >= 0 ? slice.slice(boundary + 2) : slice).trim();
}

function windowText(body: string, contextPrefix: string): string[] {
  const budget = Math.max(160, CHUNKING.maxChars - contextPrefix.length);
  const unitBudget = Math.max(120, budget - CHUNKING.overlapChars - 2);

  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const rawUnits: string[] = [];
  for (const paragraph of paragraphs) {
    if (paragraph.length <= unitBudget) rawUnits.push(paragraph);
    else rawUnits.push(...splitSentences(paragraph));
  }
  const units: string[] = [];
  for (const unit of rawUnits) units.push(...hardSlice(unit, unitBudget));

  const windows: string[] = [];
  let buffer = "";
  for (const unit of units) {
    const candidate = buffer ? `${buffer}\n\n${unit}` : unit;
    if (buffer && candidate.length > budget) {
      windows.push(`${contextPrefix}${buffer}`.trim());
      const tail = overlapTail(buffer);
      buffer = tail ? `${tail}\n\n${unit}` : unit;
    } else {
      buffer = candidate;
    }
  }
  if (buffer.trim()) windows.push(`${contextPrefix}${buffer}`.trim());
  return windows;
}

function mergeTiny(chunks: ChunkRecord[]): ChunkRecord[] {
  const merged: ChunkRecord[] = [];
  for (const chunk of chunks) {
    const previous = merged[merged.length - 1];
    if (previous && previous.source === chunk.source && chunk.charCount < CHUNKING.minChars) {
      previous.text = `${previous.text}\n\n${chunk.text}`.trim();
      previous.charCount = previous.text.length;
      previous.tokensApprox = approxTokens(previous.text);
    } else {
      merged.push({ ...chunk });
    }
  }

  const result: ChunkRecord[] = [];
  for (let i = 0; i < merged.length; i++) {
    const chunk = merged[i];
    const next = merged[i + 1];
    if (chunk.charCount < CHUNKING.minChars && next && next.source === chunk.source) {
      next.text = `${chunk.text}\n\n${next.text}`.trim();
      next.charCount = next.text.length;
      next.tokensApprox = approxTokens(next.text);
      next.heading = chunk.heading || next.heading;
      continue;
    }
    result.push(chunk);
  }

  return result.map((chunk, index) => ({ ...chunk, chunkIndex: index }));
}

export function chunkDocument(source: string, markdown: string): ChunkRecord[] {
  const clean = markdown.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  const titleLine = clean.split("\n").find((line) => /^#\s+/.test(line));
  const title = titleLine ? titleLine.replace(/^#+\s+/, "").trim() : "";

  const rawSections = clean.split(/\n(?=#{1,6}\s)/).map((s) => s.trim()).filter(Boolean);
  const sections = rawSections.length > 0 ? rawSections : [clean];

  const records: ChunkRecord[] = [];
  let index = 0;

  for (const section of sections) {
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(section.split("\n")[0]);
    const heading = headingMatch ? headingMatch[2].trim() : title || firstLine(section);
    const isTitleBlock = headingMatch ? headingMatch[1].length === 1 : false;

    if (isTitleBlock) {
      const body = section.split("\n").slice(1).join("\n").trim();
      if (body.length < CHUNKING.minChars) continue;
    }

    const contextPrefix = title && !isTitleBlock ? `# ${title}\n` : "";
    const full = `${contextPrefix}${section}`.trim();

    const windows = full.length <= CHUNKING.maxChars ? [full] : windowText(section, contextPrefix);
    for (const text of windows) {
      records.push({
        source,
        chunkIndex: index++,
        heading,
        text,
        charCount: text.length,
        tokensApprox: approxTokens(text),
      });
    }
  }

  if (records.length === 0) {
    const text = clean.length > CHUNKING.maxChars ? clean.slice(0, CHUNKING.maxChars).trim() : clean;
    records.push({ source, chunkIndex: 0, heading: title || firstLine(clean), text, charCount: text.length, tokensApprox: approxTokens(text) });
  }

  return mergeTiny(records);
}
