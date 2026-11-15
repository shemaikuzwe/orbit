import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { healths, notificationKinds, priorities, statuses } from "@/lib/domain";
import { organization, user } from "./auth-schema";

export * from "./auth-schema";

export const issueStatus = pgEnum("issue_status", statuses);
export const issuePriority = pgEnum("issue_priority", priorities);
export const projectHealth = pgEnum("project_health", healths);
export const notificationKind = pgEnum("notification_kind", notificationKinds);

const teamId = () =>
  text("team_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" });
const createdAt = () =>
  timestamp("created_at", { mode: "string", withTimezone: true })
    .notNull()
    .defaultNow();

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    team_id: teamId(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    color: text("color").notNull(),
    target: text("target").notNull().default(""),
    health: projectHealth("health").notNull().default("Planned"),
    lead_id: text("lead_id").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => [index("projects_team_id_idx").on(table.team_id)],
);

export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    team_id: teamId(),
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
    due_date: date("due_date", { mode: "string" }),
    parent_id: uuid("parent_id").references((): AnyPgColumn => issues.id, {
      onDelete: "set null",
    }),
    number: integer("number"),
    creator_id: text("creator_id").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("issues_team_id_idx").on(table.team_id),
    index("issues_assignee_id_idx").on(table.assignee_id),
    uniqueIndex("issues_team_number_idx").on(table.team_id, table.number),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    team_id: teamId(),
    issue_id: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    author_id: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    created_at: createdAt(),
  },
  (table) => [index("comments_issue_id_idx").on(table.issue_id)],
);

// Written only by the server when an issue changes.
export const issueEvents = pgTable(
  "issue_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    team_id: teamId(),
    issue_id: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    actor_id: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    field: text("field", {
      enum: ["created", "status", "priority", "assignee"],
    }).notNull(),
    from: text("from"),
    to: text("to"),
    created_at: createdAt(),
  },
  (table) => [index("issue_events_issue_id_idx").on(table.issue_id)],
);

// Created by the server; recipients may only mark them read.
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    team_id: teamId(),
    user_id: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    issue_id: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    actor_id: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    kind: notificationKind("kind").notNull(),
    read_at: timestamp("read_at", { mode: "string", withTimezone: true }),
    created_at: createdAt(),
  },
  (table) => [index("notifications_user_id_idx").on(table.user_id)],
);
