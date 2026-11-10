"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { Loader2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useTheme } from "next-themes";
import { useSession } from "@/components/session-provider";
import { authClient } from "@/lib/auth-client";
import { initializeSync, signOut, type WorkspaceSync } from "@/lib/sync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const router = useRouter();
  const [createdTeam, setCreatedTeam] = useState<string>();
  const [pending, setPending] = useState(false);
  const teamId = createdTeam ?? activeTeamId ?? memberships[0]?.team_id;

  async function leave() {
    setPending(true);
    try {
      await signOut();
      router.replace("/sign-in");
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
  // The proxy only renders this page with a valid session.
  const session = useSession()!;
  const userId = session.user.id;
  const [ready, setReady] = useState<{ userId: string; sync: WorkspaceSync }>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const { resolvedTheme } = useTheme();
  useEffect(() => {
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
      <Toaster richColors theme={resolvedTheme as "light" | "dark"} />
      {ready?.userId === userId ? (
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
