import { randomUUID } from "node:crypto";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { jwt } from "better-auth/plugins/jwt";
import { organization } from "better-auth/plugins/organization";
import { db } from "@/db";

async function unassignIssues(userId: string, organizationId: string) {
  await db
    .update(schema.issues)
    .set({ assignee_id: null })
    .where(
      and(
        eq(schema.issues.assignee_id, userId),
        eq(schema.issues.team_id, organizationId),
      ),
    );
}

const departedMember = z.object({
  userId: z.string(),
  organizationId: z.string(),
});

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  hooks: {
    // Better Auth 1.7's leave endpoint bypasses organization member hooks.
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/organization/leave") return;
      const result = departedMember.safeParse(ctx.context.returned);
      if (result.success)
        await unassignIssues(result.data.userId, result.data.organizationId);
    }),
  },
  // Keep auth IDs as text for sync foreign keys while generating UUID values.
  advanced: { database: { generateId: () => randomUUID() } },
  emailAndPassword: { enabled: true },
  plugins: [
    organization({
      organizationHooks: {
        beforeRemoveMember: async ({ member, organization }) => {
          await unassignIssues(member.userId, organization.id);
        },
      },
    }),
    jwt({
      jwks: { keyPairConfig: { alg: "RS256" } },
      jwt: {
        audience: "powersync",
        issuer: process.env.BETTER_AUTH_URL,
        expirationTime: "5m",
        definePayload: () => ({}),
      },
    }),
  ],
});
