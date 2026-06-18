import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { embed } from "../lib/embeddings";
import { chunkDocument } from "../lib/kb/chunk";

const here = dirname(fileURLToPath(import.meta.url));
const knowledgeDir = join(here, "..", "knowledge");
const outFile = join(here, "..", "lib", "kb", "vectors.json");

interface StoredChunk {
  id: string;
  source: string;
  chunkIndex: number;
  heading: string;
  text: string;
  charCount: number;
  tokensApprox: number;
  embedding: number[];
}

async function main() {
  const files = (await readdir(knowledgeDir)).filter((name) => name.endsWith(".md")).sort();
  const stored: StoredChunk[] = [];

  for (const file of files) {
    const content = await readFile(join(knowledgeDir, file), "utf8");
    const records = chunkDocument(file, content);
    for (const record of records) {
      const embedding = await embed(record.text);
      stored.push({ id: `${record.source}#${record.chunkIndex}`, ...record, embedding });
    }
  }

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(stored));
  console.log(`Embedded ${stored.length} chunks from ${files.length} files into ${outFile}`);
}

main();
