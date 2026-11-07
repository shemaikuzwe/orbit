"use client";

import { useEffect, useState } from "react";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { Loader2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import { z } from "zod";

const offlineSessionSchema = z.object({
  user: z.object({ id: z.string(), name: z.string() }),
  session: z.object({
    activeOrganizationId: z.string().nullish(),
    expiresAt: z.coerce.date(),
  }),
});
import { authClient } from "@/lib/auth-client";
import { initializeSync, signOut, type WorkspaceSync } from "@/lib/sync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignIn } from "./sign-in";
import Workspace from "./workspace";

function LoadingWorkspace() {
  return (
    <div
      role="status"
      aria-label="Opening workspace"
      className="flex min-h-dvh animate-pulse"
    >
      <div className="w-56 border-r bg-sidebar" />
      <div className="flex-1 space-y-8 p-8">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="grid grid-cols-4 gap-5">
          {[0, 1, 2, 3].map((column) => (
            <div key={column} className="h-64 rounded-lg bg-muted" />
          ))}
        </div>
        <span className="sr-only">Opening workspace…</span>
      </div>
    </div>
  );
}

function TeamWorkspace({
  sync,
  userId,
  name,
  activeTeamId,
}: {
  sync: WorkspaceSync;
  userId: string;
  name: string;
  activeTeamId: string | null | undefined;
}) {
  const { data: memberships = [], isLoading } = useLiveQuery((q) =>
    q
      .from({ member: sync.memberships })
      .where(({ member }) => eq(member.user_id, userId)),
  );
  const [createdTeam, setCreatedTeam] = useState<string>();
  const [pending, setPending] = useState(false);
  const teamId = createdTeam ?? activeTeamId ?? memberships[0]?.team_id;

  async function leave() {
    setPending(true);
    try {
      await signOut();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to sign out",
      );
    } finally {
      setPending(false);
    }
  }

  if (teamId)
    return (
      <Workspace
        key={teamId}
        teamId={teamId}
        user={{ id: userId, name }}
        onSignOut={leave}
        signingOut={pending}
      />
    );
  if (isLoading) return <LoadingWorkspace />;
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <form
        className="w-full max-w-sm space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const name = String(
            new FormData(event.currentTarget).get("name"),
          ).trim();
          setPending(true);
          try {
            const result = await authClient.organization.create({
              name,
              slug: `team-${crypto.randomUUID()}`,
            });
            if (result.error || !result.data)
              throw new Error(result.error?.message || "Unable to create team");
            const active = await authClient.organization.setActive({
              organizationId: result.data.id,
            });
            if (active.error) throw new Error(active.error.message);
            setCreatedTeam(result.data.id);
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Unable to create team",
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <h1 className="text-2xl font-semibold">Create your team</h1>
        <p className="text-sm text-muted-foreground">
          Your synced teams will appear automatically. Creating a new team
          requires a connection.
        </p>
        <Input
          name="name"
          aria-label="Team name"
          placeholder="Team name"
          required
          maxLength={100}
          disabled={pending}
        />
        <Button disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}Create team
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={leave}
        >
          Sign out
        </Button>
      </form>
    </main>
  );
}

export default function WorkspaceGate() {
  const {
    data: liveSession,
    isPending,
    error: sessionError,
  } = authClient.useSession();
  const [offline, setOffline] = useState(false);
  const [offlineSession, setOfflineSession] =
    useState<z.infer<typeof offlineSessionSchema>>();
  useEffect(() => {
    function updateConnection() {
      setOffline(!navigator.onLine);
    }
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    try {
      const stored = localStorage.getItem("orbit-offline-session");
      if (stored) {
        const cached = offlineSessionSchema.safeParse(JSON.parse(stored));
        if (cached.success && cached.data.session.expiresAt > new Date())
          setOfflineSession(cached.data);
      }
    } catch {
      localStorage.removeItem("orbit-offline-session");
    }
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);
  useEffect(() => {
    if (liveSession) {
      // Cache only display identity, team selection, and expiry, never tokens.
      const cached = offlineSessionSchema.parse(liveSession);
      localStorage.setItem("orbit-offline-session", JSON.stringify(cached));
      setOfflineSession(cached);
    } else if (!isPending && navigator.onLine && !sessionError) {
      localStorage.removeItem("orbit-offline-session");
      setOfflineSession(undefined);
    }
  }, [liveSession, isPending, offline, sessionError]);
  const session = liveSession ?? (offline ? offlineSession : undefined);
  const userId = session?.user.id;
  const [ready, setReady] = useState<{ userId: string; sync: WorkspaceSync }>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!userId) {
      setReady(undefined);
      return;
    }
    let cancelled = false;
    initializeSync(userId)
      .then((sync) => {
        if (!cancelled) {
          setReady({ userId, sync });
          setError("");
        }
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setError(
            error instanceof Error
              ? error.message
              : "Unable to open local workspace",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  return (
    <>
      <Toaster richColors theme="dark" />
      {isPending && !session ? (
        <LoadingWorkspace />
      ) : !session ? (
        <SignIn />
      ) : ready?.userId === session.user.id ? (
        <TeamWorkspace
          key={session.user.id}
          sync={ready.sync}
          userId={session.user.id}
          name={session.user.name}
          activeTeamId={session.session.activeOrganizationId}
        />
      ) : error ? (
        <main className="grid min-h-dvh place-content-center gap-4 p-6">
          <p role="alert">{error}</p>
          <Button
            onClick={() => {
              setError("");
              setAttempt(attempt + 1);
            }}
          >
            Retry
          </Button>
        </main>
      ) : (
        <LoadingWorkspace />
      )}
    </>
  );
}
