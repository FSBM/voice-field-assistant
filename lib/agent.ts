import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { withModelFallback } from "@/lib/llm";
import { AGENT_SYSTEM } from "@/lib/prompts";
import { WorkOrder } from "@/lib/schema";
import { createWorkOrder, findWorkOrder, updateWorkOrder, setStatus } from "@/lib/work-orders";

export async function runCommand(command: string): Promise<string> {
  const { text } = await withModelFallback("agent", (model) =>
    generateText({
      model,
      system: AGENT_SYSTEM,
      prompt: command,
      stopWhen: stepCountIs(5),
      tools: {
        createWorkOrder: tool({
          description: "Create a new work order from the described inspection or fault.",
          inputSchema: WorkOrder,
          execute: async (input) => {
            const row = await createWorkOrder(input);
            return { created: true, id: row.id };
          },
        }),
        updateWorkOrder: tool({
          description: "Update an existing work order found by its equipment code or fault code.",
          inputSchema: z.object({
            search: z.string().describe("Equipment code or fault code used to find the work order."),
            action_taken: z.string().describe("The new action taken text."),
            severity: WorkOrder.shape.severity.optional(),
          }),
          execute: async ({ search, action_taken, severity }) => {
            const found = await findWorkOrder(search);
            if (!found) return { found: false };
            const patch: Partial<typeof found> = { action_taken };
            if (severity) patch.severity = severity;
            const row = await updateWorkOrder(found.id, patch);
            return { found: true, id: row.id };
          },
        }),
        closeWorkOrder: tool({
          description: "Close a work order found by its equipment code or fault code.",
          inputSchema: z.object({
            search: z.string().describe("Equipment code or fault code used to find the work order."),
          }),
          execute: async ({ search }) => {
            const found = await findWorkOrder(search);
            if (!found) return { found: false };
            const row = await setStatus(found.id, "closed");
            return { found: true, id: row.id, status: row.status };
          },
        }),
      },
    }),
  );
  return text.trim();
}
