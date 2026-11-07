import { index, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { priorities, statuses } from "@/lib/domain";
import { organization, user } from "./auth-schema";

export * from "./auth-schema";

export const issueStatus = pgEnum("issue_status", statuses);
export const issuePriority = pgEnum("issue_priority", priorities);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    team_id: text("team_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    color: text("color").notNull(),
    target: text("target").notNull().default(""),
  },
  (table) => [index("projects_team_id_idx").on(table.team_id)],
);

export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    team_id: text("team_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: issueStatus("status").notNull(),
    priority: issuePriority("priority").notNull(),
    project_id: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    label: text("label").notNull().default(""),
    assignee_id: text("assignee_id").references(() => user.id, {
      onDelete: "set null",
    }),
    position: text("position").notNull(),
  },
  (table) => [
    index("issues_team_id_idx").on(table.team_id),
    index("issues_assignee_id_idx").on(table.assignee_id),
  ],
);
