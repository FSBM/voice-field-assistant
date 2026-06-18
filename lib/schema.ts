import { z } from "zod";

export const Severity = z.enum(["low", "medium", "high", "critical"]);

export const PartRequired = z.object({
  part_number: z.string().describe("Manufacturer part number such as P/N 88-22A. Empty string if unknown."),
  name: z.string().describe("Plain name of the part."),
  quantity: z.number().int().positive().describe("How many units are needed."),
});

export const WorkOrder = z.object({
  equipment_code: z.string().describe("Equipment identifier such as AHU-12 or CH-02. Empty string if not mentioned."),
  inspection_result: z.string().describe("What the technician observed."),
  fault_code: z.string().describe("Fault code such as F-203. Empty string if none."),
  location: z.string().describe("Where the work happened, such as Roof Plant Room B."),
  severity: Severity.describe("How urgent the issue is."),
  action_taken: z.string().describe("What the technician did or recommends doing."),
  parts_required: z.array(PartRequired).describe("Parts needed to finish the work. Empty list if none."),
});

export type WorkOrderInput = z.infer<typeof WorkOrder>;
export type SeverityValue = z.infer<typeof Severity>;
