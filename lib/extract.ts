import { generateObject } from "ai";
import { withModelFallback } from "@/lib/llm";
import { hasAnyLlm } from "@/lib/env";
import { EXTRACTION_SYSTEM } from "@/lib/prompts";
import { WorkOrder, type WorkOrderInput, type SeverityValue } from "@/lib/schema";

const SEVERITY_HINTS: [RegExp, SeverityValue][] = [
  [/\b(critical|emergency|fire|smoke|burning|hazard|danger|flood)\b/i, "critical"],
  [/\b(high|urgent|severe|major|leak|leaking|down|failure|failed|overheat)\b/i, "high"],
  [/\b(low|minor|cosmetic|routine|small)\b/i, "low"],
];

function guessSeverity(text: string): SeverityValue {
  for (const [pattern, value] of SEVERITY_HINTS) if (pattern.test(text)) return value;
  return "medium";
}

function regexExtract(transcript: string): WorkOrderInput {
  const fault =
    transcript.match(/\bF-?\d{2,4}\b/i)?.[0]?.toUpperCase().replace(/^F(?=\d)/, "F-") ?? "";
  const partMatches = transcript.match(/P\/?N\s*[:#]?\s*[\w-]+/gi) ?? [];
  let scrubbed = transcript;
  for (const match of partMatches) scrubbed = scrubbed.replace(match, " ");
  const equipmentRaw =
    scrubbed.match(/\b[A-Za-z]{2,4}-?\d{1,4}\b/g)?.find((code) => code.toUpperCase() !== fault) ?? "";
  const equipment = equipmentRaw.toUpperCase().replace(/^([A-Z]+)(\d)/, "$1-$2");
  const parts = partMatches.map((raw) => ({
    part_number: raw.replace(/^P\/?N\s*[:#]?\s*/i, "P/N "),
    name: "",
    quantity: 1,
  }));

  return {
    equipment_code: equipment,
    inspection_result: transcript.trim(),
    fault_code: fault,
    location: "",
    severity: guessSeverity(transcript),
    action_taken: "",
    parts_required: parts,
  };
}

export async function extractWorkOrder(transcript: string): Promise<WorkOrderInput> {
  if (!hasAnyLlm()) return regexExtract(transcript);
  try {
    const { object } = await withModelFallback("extract", (model) =>
      generateObject({
        model,
        schema: WorkOrder,
        system: EXTRACTION_SYSTEM,
        prompt: `Field voice note:\n"""${transcript}"""`,
      }),
    );
    return object;
  } catch {
    return regexExtract(transcript);
  }
}
