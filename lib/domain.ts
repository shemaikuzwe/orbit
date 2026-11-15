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
export const labels = [
  "Feature",
  "Design",
  "Improvement",
  "Research",
  "Bug",
] as const;
export const healths = ["Planned", "On track", "At risk", "Off track"] as const;
export const notificationKinds = ["assigned", "comment"] as const;

const isoDate = z.iso.date();
// Postgres and PowerSync serialize timestamps with a space separator.
const timestamp = z.string().min(1);

export const projectSchema = z.object({
  id: z.uuid(),
  team_id: z.string().min(1),
  name: z.string().trim().min(1),
  description: z.string(),
  color: z.string(),
  // ISO date, or "" for none. Older rows may hold free text.
  target: z.string(),
  health: z.enum(healths),
  lead_id: z.string().min(1).nullable(),
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
  due_date: isoDate.nullable(),
  parent_id: z.uuid().nullable(),
  // Assigned by the server on first upload.
  number: z.number().int().nullable(),
  creator_id: z.string().min(1).nullable(),
});

export const commentSchema = z.object({
  id: z.uuid(),
  team_id: z.string().min(1),
  issue_id: z.uuid(),
  author_id: z.string().min(1).nullable(),
  body: z.string().trim().min(1).max(5000),
  created_at: timestamp,
});

export const notificationSchema = z.object({
  id: z.uuid(),
  team_id: z.string().min(1),
  user_id: z.string().min(1),
  issue_id: z.uuid(),
  actor_id: z.string().min(1).nullable(),
  kind: z.enum(notificationKinds),
  read_at: timestamp.nullable(),
  created_at: timestamp,
});

export const issueEventSchema = z.object({
  id: z.uuid(),
  team_id: z.string().min(1),
  issue_id: z.uuid(),
  actor_id: z.string().min(1).nullable(),
  field: z.enum(["created", "status", "priority", "assignee"]),
  // Aliased in sync.yaml: "from"/"to" are reserved words in SQLite.
  from_value: z.string().nullable(),
  to_value: z.string().nullable(),
  created_at: timestamp,
});
