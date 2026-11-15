import { z } from "zod";
import { db } from "@/db";
import { applyCrud } from "@/lib/apply-crud";
import { getSessionTeams } from "@/lib/session";

const batchSchema = z.object({ crud: z.array(z.unknown()) });

export async function POST(request: Request) {
  try {
    const { session, teamIds } = await getSessionTeams(request.headers);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const batch = batchSchema.safeParse(payload);
    if (!batch.success) {
      return Response.json({ error: "Invalid CRUD batch" }, { status: 400 });
    }

    const rejected = await db.transaction(async (tx) => {
      const rejected: NonNullable<Awaited<ReturnType<typeof applyCrud>>>[] = [];
      for (const op of batch.data.crud) {
        const rejection = await applyCrud(tx, op, {
          userId: session.user.id,
          teamIds,
        });
        if (rejection) rejected.push(rejection);
      }
      return rejected;
    });
    return Response.json({ rejected });
  } catch (error) {
    console.error("Sync upload failed", error);
    return Response.json({ error: "Sync upload failed" }, { status: 500 });
  }
}
