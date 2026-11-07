"use client";

import {
  PowerSyncDatabase,
  Schema,
  Table,
  column,
  type PowerSyncBackendConnector,
} from "@powersync/web";
import { createCollection } from "@tanstack/react-db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { issueSchema, projectSchema } from "@/lib/domain";

const schema = new Schema({
  projects: new Table({
    team_id: column.text,
    name: column.text,
    description: column.text,
    color: column.text,
    target: column.text,
  }),
  issues: new Table({
    team_id: column.text,
    title: column.text,
    description: column.text,
    status: column.text,
    priority: column.text,
    project_id: column.text,
    label: column.text,
    assignee_id: column.text,
    position: column.text,
  }),
  team_members: new Table({ team_id: column.text, user_id: column.text }),
  user: new Table({ name: column.text }),
});

const uploadResponse = z.object({
  rejected: z.array(z.object({ id: z.string(), reason: z.string() })),
});

const connector: PowerSyncBackendConnector = {
  async fetchCredentials() {
    const endpoint = process.env.NEXT_PUBLIC_POWERSYNC_URL!;
    const result = await authClient.token();
    if (result.error || !result.data?.token)
      throw new Error(
        result.error?.message || "Unable to obtain sync credentials",
      );
    return { endpoint, token: result.data.token };
  },
  async uploadData(database) {
    const batch = await database.getNextCrudTransaction();
    if (!batch) return;
    const response = await fetch("/api/sync/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crud: batch.crud }),
    });
    if (!response.ok)
      throw new Error(`Sync upload failed (${response.status})`);
    const { rejected } = uploadResponse.parse(await response.json());
    await batch.complete();
    for (const rejection of rejected) {
      toast.error(
        `Your change to ${rejection.id} was dropped: ${rejection.reason}`,
      );
    }
  },
};

function createSync() {
  const database = new PowerSyncDatabase({
    schema,
    database: { dbFilename: "orbit.db", worker: "/@powersync/worker.js" },
    sync: { worker: "/@powersync/worker.js" },
  });
  const onDeserializationError = (error: { issues: readonly unknown[] }) => {
    console.error("Invalid synced data", error);
    toast.error(
      "Some synced data could not be read. Please reconnect after updating the app.",
    );
  };
  const projects = createCollection(
    powerSyncCollectionOptions({
      database,
      table: schema.props.projects,
      schema: projectSchema,
      onDeserializationError,
    }),
  );
  const issues = createCollection(
    powerSyncCollectionOptions({
      database,
      table: schema.props.issues,
      schema: issueSchema,
      onDeserializationError,
    }),
  );
  const memberships = createCollection(
    powerSyncCollectionOptions({
      database,
      table: schema.props.team_members,
      schema: z.object({
        id: z.string(),
        team_id: z.string(),
        user_id: z.string(),
      }),
      onDeserializationError,
    }),
  );
  const profiles = createCollection(
    powerSyncCollectionOptions({
      database,
      table: schema.props.user,
      schema: z.object({ id: z.string(), name: z.string() }),
      onDeserializationError,
    }),
  );
  return { database, projects, issues, memberships, profiles };
}

export type WorkspaceSync = ReturnType<typeof createSync>;
let sync: WorkspaceSync | undefined;
let initialization: Promise<WorkspaceSync> | undefined;
let initializingUser: string | undefined;

export function initializeSync(userId: string): Promise<WorkspaceSync> {
  if (typeof window === "undefined") throw new Error("Sync is browser-only");
  if (initialization && initializingUser === userId) return initialization;
  // Serialize account switches and reuse the same initialization in Strict Mode.
  initializingUser = userId;
  const pending = (initialization ?? Promise.resolve(undefined))
    .catch(() => undefined)
    .then(async () => {
      sync ??= createSync();
      await sync.database.init();
      const previousUser = localStorage.getItem("orbit-user");
      if (previousUser && previousUser !== userId)
        await sync.database.disconnectAndClear();
      localStorage.setItem("orbit-user", userId);
      await sync.database.connect(connector);
      return sync;
    });
  initialization = pending;
  pending.catch(() => {
    if (initialization === pending) initialization = undefined;
  });
  return pending;
}

export async function signOut() {
  await initialization;
  if (sync) await sync.database.disconnectAndClear();
  initialization = undefined;
  const result = await authClient.signOut();
  if (result.error) throw new Error(result.error.message || "Sign out failed");
  localStorage.removeItem("orbit-user");
  localStorage.removeItem("orbit-offline-session");
}

export function getSync() {
  if (!sync) throw new Error("Workspace sync has not been initialized");
  return sync;
}
