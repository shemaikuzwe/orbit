import { eq } from "drizzle-orm";
import { db } from "@/db";
import { member } from "@/db/schema";
import { auth } from "./auth";

export async function getSessionTeams(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session) return { session: null, teamIds: [] as string[] };
  const memberships = await db
    .select({ teamId: member.organizationId })
    .from(member)
    .where(eq(member.userId, session.user.id));
  return { session, teamIds: memberships.map(({ teamId }) => teamId) };
}
