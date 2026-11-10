import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { db } from "@/db";
import { issues, member, projects } from "@/db/schema";
import { issueSchema, projectSchema } from "@/lib/domain";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const operationSchema = z.object({
  table: z.enum(["projects", "issues"]),
  id: z.uuid(),
  op: z.enum(["PUT", "PATCH", "DELETE"]),
  opData: z.record(z.string(), z.unknown()).optional(),
});
const projectFields = projectSchema.omit({ id: true }).strict();
const issueFields = issueSchema.omit({ id: true }).strict();

class CrudRejection extends Error {}

function isForeignKeyError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23503") return true;
  return "cause" in error && error.cause !== error
    ? isForeignKeyError(error.cause)
    : false;
}

export async function applyCrud(
  tx: Transaction,
  input: unknown,
  teamIds: readonly string[],
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
    // PostgreSQL aborts a transaction after an FK error. One savepoint per
    // operation lets Drizzle roll back only that operation and commit the rest.
    await tx.transaction(async (savepoint) => {
      const table = op.table === "projects" ? projects : issues;
      const [existing] = await savepoint
        .select()
        .from(table)
        .where(eq(table.id, op.id));
      if (existing && !teamIds.includes(existing.team_id)) {
        throw new CrudRejection("No permission for this team");
      }

      if (op.op === "DELETE") {
        if (existing) {
          await savepoint
            .delete(table)
            .where(
              and(eq(table.id, op.id), eq(table.team_id, existing.team_id)),
            );
        }
        return;
      }
      if (op.op === "PATCH" && !existing) {
        throw new CrudRejection("Row does not exist");
      }

      const schema = op.table === "projects" ? projectFields : issueFields;
      // PowerSync omits null columns from PUT data, so a missing key means null.
      const omitted =
        op.op === "PUT"
          ? Object.fromEntries(Object.keys(schema.shape).map((k) => [k, null]))
          : {};
      const fields = (op.op === "PATCH" ? schema.partial() : schema).parse({
        ...omitted,
        ...op.opData,
      });
      const data = (
        op.table === "projects" ? projectSchema : issueSchema
      ).parse({
        ...(op.op === "PATCH" ? existing : {}),
        ...fields,
        id: op.id,
      });
      if (!teamIds.includes(data.team_id)) {
        throw new CrudRejection("No permission for the proposed team");
      }
      if (existing && existing.team_id !== data.team_id) {
        throw new CrudRejection("Changing a row's team is not allowed");
      }

      if ("title" in data) {
        if (data.project_id !== null) {
          const [project] = await savepoint
            .select({ id: projects.id })
            .from(projects)
            .where(
              and(
                eq(projects.id, data.project_id),
                eq(projects.team_id, data.team_id),
              ),
            );
          if (!project) {
            throw new CrudRejection("Project must belong to the issue's team");
          }
        }
        if (data.assignee_id !== null) {
          const [assignee] = await savepoint
            .select({ id: member.id })
            .from(member)
            .where(
              and(
                eq(member.userId, data.assignee_id),
                eq(member.organizationId, data.team_id),
              ),
            );
          if (!assignee) {
            throw new CrudRejection("Assignee must belong to the issue's team");
          }
        }
      }

      if (op.op === "PATCH") {
        if (Object.keys(fields).length === 0) return;
        await savepoint
          .update(table)
          .set(fields)
          .where(and(eq(table.id, op.id), eq(table.team_id, data.team_id)));
      } else {
        // The conflict guard also prevents an upsert from changing the team of
        // a row inserted concurrently after the authorization read.
        const written =
          "title" in data
            ? await savepoint
                .insert(issues)
                .values(data)
                .onConflictDoUpdate({
                  target: issues.id,
                  set: fields,
                  setWhere: eq(issues.team_id, data.team_id),
                })
                .returning({ id: issues.id })
            : await savepoint
                .insert(projects)
                .values(data)
                .onConflictDoUpdate({
                  target: projects.id,
                  set: fields,
                  setWhere: eq(projects.team_id, data.team_id),
                })
                .returning({ id: projects.id });
        if (written.length === 0) {
          throw new CrudRejection("No permission to change this row's team");
        }
      }
    });
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
