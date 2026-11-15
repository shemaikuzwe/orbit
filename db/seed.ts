import "dotenv/config";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { generateNKeysBetween } from "fractional-indexing";

async function seed() {
  const email = "user@orbit.com";
  const password = "d432e9fa3cf0";
  const { db, pool } = await import("./index");
  try {
    const { auth } = await import("../lib/auth");
    const { organization, user, member, projects, issues } =
      await import("./schema");
    const { seedData } = await import("./seed-data");
    const slug = "orbit-demo";
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email));
    const demoUser =
      existingUser ??
      (
        await auth.api.signUpEmail({
          body: { name: "Demo User", email, password },
        })
      ).user;
    const [existingTeam] = await db
      .select()
      .from(organization)
      .where(eq(organization.slug, slug));
    const team =
      existingTeam ??
      (await auth.api.createOrganization({
        body: { name: "Orbit", slug, userId: demoUser.id },
      }));
    if (!team) throw new Error("Demo team creation failed");
    const [membership] = await db
      .select()
      .from(member)
      .where(
        and(eq(member.organizationId, team.id), eq(member.userId, demoUser.id)),
      );
    if (!membership) {
      throw new Error(
        "Demo team belongs to another account; use its original SEED_EMAIL",
      );
    }
    // UUIDs derived from the team and sample IDs make retries safe without resetting edits.
    const seedId = (kind: string, id: string) => {
      const hash = createHash("sha256")
        .update(`${team.id}:${kind}:${id}`)
        .digest("hex");
      return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-8${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
    };
    const projectIds = new Map(
      seedData.projects.map((project) => [
        project.id,
        seedId("project", project.id),
      ]),
    );
    const positions = generateNKeysBetween(null, null, seedData.issues.length);
    await db.transaction(async (tx) => {
      await tx
        .insert(projects)
        .values(
          seedData.projects.map((project) => ({
            id: projectIds.get(project.id)!,
            name: project.name,
            description: project.description,
            color: project.color,
            target: project.target,
            health: project.health,
            team_id: team.id,
          })),
        )
        .onConflictDoNothing();
      await tx
        .insert(issues)
        .values(
          seedData.issues.map((issue, index) => ({
            id: seedId("issue", issue.id),
            team_id: team.id,
            title: issue.title,
            description: issue.description,
            status: issue.status,
            priority: issue.priority,
            project_id: projectIds.get(issue.projectId) ?? null,
            label: issue.label,
            assignee_id: issue.assignee ? demoUser.id : null,
            position: positions[index],
            number: index + 1,
          })),
        )
        .onConflictDoNothing();
    });
    console.info(
      `Seeded demo team for ${email}. Existing records were preserved.`,
    );
  } finally {
    await pool.end();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
