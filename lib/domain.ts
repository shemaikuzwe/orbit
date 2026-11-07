import { generateKeyBetween } from "fractional-indexing";
import { z } from "zod";

export const statuses = ["Backlog", "Todo", "In progress", "Done"] as const;
export const priorities = [
  "No priority",
  "Low",
  "Medium",
  "High",
  "Urgent",
] as const;

export const projectSchema = z.object({
  id: z.uuid(),
  team_id: z.string().min(1),
  name: z.string().trim().min(1),
  description: z.string(),
  color: z.string(),
  target: z.string(),
});

export const issueSchema = z.object({
  id: z.uuid(),
  team_id: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string(),
  status: z.enum(statuses),
  priority: z.enum(priorities),
  project_id: z.uuid().nullable(),
  label: z.string(),
  assignee_id: z.string().min(1).nullable(),
  position: z
    .string()
    .min(1)
    .refine((value) => {
      try {
        generateKeyBetween(value, null);
        return true;
      } catch {
        return false;
      }
    }, "Invalid fractional position"),
});

