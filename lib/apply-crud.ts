import { and, eq, max } from "drizzle-orm";
import { z } from "zod";
import type { db } from "@/db";
import {
  comments,
  issueEvents,
  issues,
  member,
  notifications,
  projects,
} from "@/db/schema";
import {
  commentSchema,
  issueSchema,
  notificationSchema,
  projectSchema,
} from "@/lib/domain";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Op = "PUT" | "PATCH" | "DELETE";
type Context = { tx: Transaction; userId: string };
type TeamTable =
  typeof projects | typeof issues | typeof comments | typeof notifications;

/**
 * Per-table rules. `client` lists the fields a client may write; `prepare`
 * validates cross-row references and returns server-owned fields; `after`
 * records side effects (activity, notifications) in the same savepoint.
 */
type TableConfig<S extends z.ZodObject> = {
  table: TeamTable;
  schema: S;
  client: z.ZodObject;
  ops: readonly Op[];
  prepare?: (
    ctx: Context,
    data: z.infer<S>,
    existing: z.infer<S> | undefined,
  ) => Promise<Partial<z.infer<S>>>;
  after?: (
    ctx: Context,
    data: z.infer<S>,
    existing: z.infer<S> | undefined,
  ) => Promise<void>;
};

const operationSchema = z.object({
  table: z.enum(["projects", "issues", "comments", "notifications"]),
  id: z.uuid(),
  op: z.enum(["PUT", "PATCH", "DELETE"]),
  opData: z.record(z.string(), z.unknown()).optional(),
});

class CrudRejection extends Error {}

function isForeignKeyError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23503") return true;
  return "cause" in error && error.cause !== error
    ? isForeignKeyError(error.cause)
    : false;
}

async function requireMember(tx: Transaction, userId: string, teamId: string) {
  const [row] = await tx
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.userId, userId), eq(member.organizationId, teamId)));
  if (!row) throw new CrudRejection("User must belong to the team");
}

async function requireIssue(tx: Transaction, id: string, teamId: string) {
  const [row] = await tx
    .select({ parent_id: issues.parent_id })
    .from(issues)
    .where(and(eq(issues.id, id), eq(issues.team_id, teamId)));
  if (!row) throw new CrudRejection("Issue must belong to the team");
  return row;
}

const projectConfig: TableConfig<typeof projectSchema> = {
  table: projects,
  schema: projectSchema,
  client: projectSchema.omit({ id: true }).strict(),
  ops: ["PUT", "PATCH", "DELETE"],
  async prepare({ tx }, data) {
    if (data.lead_id) await requireMember(tx, data.lead_id, data.team_id);
    return {};
  },
};

const issueConfig: TableConfig<typeof issueSchema> = {
  table: issues,
  schema: issueSchema,
  client: issueSchema.omit({ id: true }).strict(),
  ops: ["PUT", "PATCH", "DELETE"],
  async prepare({ tx, userId }, data, existing) {
    if (data.project_id) {
      const [project] = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(
            eq(projects.id, data.project_id),
            eq(projects.team_id, data.team_id),
          ),
        );
      if (!project)
        throw new CrudRejection("Project must belong to the issue's team");
    }
    if (data.assignee_id)
      await requireMember(tx, data.assignee_id, data.team_id);
    if (data.parent_id) {
      // One level of nesting keeps the hierarchy free of cycles.
      if (data.parent_id === data.id)
        throw new CrudRejection("An issue can't be its own parent");
      const parent = await requireIssue(tx, data.parent_id, data.team_id);
      if (parent.parent_id)
        throw new CrudRejection("Sub-issues can't have sub-issues");
      const [child] = await tx
        .select({ id: issues.id })
        .from(issues)
        .where(eq(issues.parent_id, data.id))
        .limit(1);
      if (child)
        throw new CrudRejection("An issue with sub-issues can't be nested");
    }
    if (existing?.number)
      return { number: existing.number, creator_id: existing.creator_id };
    const [{ last }] = await tx
      .select({ last: max(issues.number) })
      .from(issues)
      .where(eq(issues.team_id, data.team_id));
    return {
      number: (last ?? 0) + 1,
      creator_id: existing ? existing.creator_id : userId,
    };
  },
  async after({ tx, userId }, data, existing) {
    const changes = existing
      ? (
          [
            ["status", existing.status, data.status],
            ["priority", existing.priority, data.priority],
            ["assignee", existing.assignee_id, data.assignee_id],
          ] as const
        ).filter(([, from, to]) => from !== to)
      : ([["created", null, null]] as const);
    if (changes.length)
      await tx.insert(issueEvents).values(
        changes.map(([field, from, to]) => ({
          team_id: data.team_id,
          issue_id: data.id,
          actor_id: userId,
          field,
          from,
          to,
        })),
      );
    if (
      data.assignee_id &&
      data.assignee_id !== userId &&
      data.assignee_id !== existing?.assignee_id
    )
      await tx.insert(notifications).values({
        team_id: data.team_id,
        user_id: data.assignee_id,
        issue_id: data.id,
        actor_id: userId,
        kind: "assigned",
      });
  },
};

const commentConfig: TableConfig<typeof commentSchema> = {
  table: comments,
  schema: commentSchema,
  client: commentSchema.omit({ id: true }).strict(),
  ops: ["PUT"],
  async prepare({ tx, userId }, data, existing) {
    if (existing) throw new CrudRejection("Comments can't be edited");
    await requireIssue(tx, data.issue_id, data.team_id);
    return { author_id: userId, created_at: new Date().toISOString() };
  },
  async after({ tx, userId }, data) {
    const [issue] = await tx
      .select({ assignee: issues.assignee_id, creator: issues.creator_id })
      .from(issues)
      .where(eq(issues.id, data.issue_id));
    const recipients = new Set([issue.assignee, issue.creator]);
    recipients.delete(userId);
    recipients.delete(null);
    if (recipients.size)
      await tx.insert(notifications).values(
        [...recipients].map((user_id) => ({
          team_id: data.team_id,
          user_id: user_id!,
          issue_id: data.issue_id,
          actor_id: userId,
          kind: "comment" as const,
        })),
      );
  },
};

const notificationConfig: TableConfig<typeof notificationSchema> = {
  table: notifications,
  schema: notificationSchema,
  client: notificationSchema.pick({ read_at: true }).strict(),
  ops: ["PATCH"],
  async prepare({ userId }, _data, existing) {
    if (existing?.user_id !== userId)
      throw new CrudRejection("Only the recipient can update a notification");
    return {};
  },
};

async function write<S extends z.ZodObject>(
  tx: Transaction,
  config: TableConfig<S>,
  op: z.infer<typeof operationSchema>,
  { userId, teamIds }: { userId: string; teamIds: readonly string[] },
) {
  // Drizzle can't infer column types for a union of tables, so the generic
  // path works on plain rows and each config's schema provides the typing.
  const table = config.table as typeof issues;
  if (!config.ops.includes(op.op))
    throw new CrudRejection(`${op.op} is not allowed on ${op.table}`);
  // PostgreSQL aborts a transaction after an FK error. One savepoint per
  // operation lets Drizzle roll back only that operation and commit the rest.
  await tx.transaction(async (savepoint) => {
    const [row] = await savepoint
      .select()
      .from(table)
      .where(eq(table.id, op.id));
    const existing = row as z.infer<S> | undefined;
    if (row && !teamIds.includes(row.team_id))
      throw new CrudRejection("No permission for this team");

    if (op.op === "DELETE") {
      if (row)
        await savepoint
          .delete(table)
          .where(and(eq(table.id, op.id), eq(table.team_id, row.team_id)));
      return;
    }
    if (op.op === "PATCH" && !row)
      throw new CrudRejection("Row does not exist");

    // PowerSync omits null columns from PUT data, so a missing key means null.
    const omitted =
      op.op === "PUT"
        ? Object.fromEntries(
            Object.keys(config.client.shape).map((k) => [k, null]),
          )
        : {};
    const fields = (
      op.op === "PATCH" ? config.client.partial() : config.client
    ).parse({ ...omitted, ...op.opData });
    const parsed = config.schema.parse({
      ...row,
      ...fields,
      id: op.id,
    }) as z.infer<S> & {
      team_id: string;
    };
    if (!teamIds.includes(parsed.team_id))
      throw new CrudRejection("No permission for the proposed team");
    if (row && row.team_id !== parsed.team_id)
      throw new CrudRejection("Changing a row's team is not allowed");

    const ctx = { tx: savepoint, userId };
    const server = (await config.prepare?.(ctx, parsed, existing)) ?? {};
    const data = { ...parsed, ...server };
    const changes = { ...fields, ...server } as typeof issues.$inferInsert;

    if (op.op === "PATCH") {
      await savepoint
        .update(table)
        .set(changes)
        .where(and(eq(table.id, op.id), eq(table.team_id, parsed.team_id)));
    } else {
      // The conflict guard also prevents an upsert from changing the team of
      // a row inserted concurrently after the authorization read.
      const written = await savepoint
        .insert(table)
        .values(data as unknown as typeof issues.$inferInsert)
        .onConflictDoUpdate({
          target: table.id,
          set: changes,
          setWhere: eq(table.team_id, parsed.team_id),
        })
        .returning({ id: table.id });
      if (written.length === 0)
        throw new CrudRejection("No permission to change this row's team");
    }
    await config.after?.(ctx, data, existing);
  });
}

export async function applyCrud(
  tx: Transaction,
  input: unknown,
  session: { userId: string; teamIds: readonly string[] },
) {
  const identity = z
    .object({ table: z.string().catch(""), id: z.string().catch("") })
    .safeParse(input);
  const rejection = (reason: string) => ({
    table: identity.success ? identity.data.table : "",
    id: identity.success ? identity.data.id : "",
    reason,
  });

  try {
    const op = operationSchema.parse(input);
    if (op.table === "projects") await write(tx, projectConfig, op, session);
    else if (op.table === "issues") await write(tx, issueConfig, op, session);
    else if (op.table === "comments")
      await write(tx, commentConfig, op, session);
    else await write(tx, notificationConfig, op, session);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return rejection(
        `Invalid operation: ${error.issues.map((issue) => issue.message).join("; ")}`,
      );
    }
    if (error instanceof CrudRejection) return rejection(error.message);
    if (isForeignKeyError(error))
      return rejection("Referenced row does not exist");
    throw error;
  }
}
