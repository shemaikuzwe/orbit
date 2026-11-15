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
import {
  commentSchema,
  issueEventSchema,
  issueSchema,
  notificationSchema,
  projectSchema,
} from "@/lib/domain";

const schema = new Schema({
  projects: new Table({
    team_id: column.text,
    name: column.text,
    description: column.text,
    color: column.text,
    target: column.text,
    health: column.text,
    lead_id: column.text,
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
    due_date: column.text,
    parent_id: column.text,
    number: column.integer,
    creator_id: column.text,
  }),
  comments: new Table({
    team_id: column.text,
    issue_id: column.text,
    author_id: column.text,
    body: column.text,
    created_at: column.text,
  }),
  issue_events: new Table({
    team_id: column.text,
    issue_id: column.text,
    actor_id: column.text,
    field: column.text,
    from_value: column.text,
    to_value: column.text,
    created_at: column.text,
  }),
  notifications: new Table({
    team_id: column.text,
    user_id: column.text,
    issue_id: column.text,
    actor_id: column.text,
    kind: column.text,
    read_at: column.text,
    created_at: column.text,
  }),
  teams: new Table({ name: column.text }),
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
    // CrudEntry.toJSON() renames fields (table -> type, opData -> data), so map
    // explicitly to the shape /api/sync/upload validates.
    const crud = batch.crud.map(({ table, id, op, opData }) => ({
      table,
      id,
      op,
      opData,
    }));
    const response = await fetch("/api/sync/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crud }),
    });
    if (!response.ok)
      throw new Error(`Sync upload failed (${response.status})`);
    const { rejected } = uploadResponse.parse(await response.json());
    await batch.complete();
    for (const rejection of rejected) {
      console.error("Sync change rejected", rejection);
      toast.error("Couldn't save your change", {
        description: rejection.reason,
      });
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
  const comments = createCollection(
    powerSyncCollectionOptions({
      database,
      table: schema.props.comments,
      schema: commentSchema,
      onDeserializationError,
    }),
  );
  const events = createCollection(
    powerSyncCollectionOptions({
      database,
      table: schema.props.issue_events,
      schema: issueEventSchema,
      onDeserializationError,
    }),
  );
  const notifications = createCollection(
    powerSyncCollectionOptions({
      database,
      table: schema.props.notifications,
      schema: notificationSchema,
      onDeserializationError,
    }),
  );
  const teams = createCollection(
    powerSyncCollectionOptions({
      database,
      table: schema.props.teams,
      schema: z.object({ id: z.string(), name: z.string() }),
      onDeserializationError,
    }),
  );
  return {
    database,
    projects,
    issues,
    memberships,
    profiles,
    comments,
    events,
    notifications,
    teams,
  };
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
}

export function getSync() {
  if (!sync) throw new Error("Workspace sync has not been initialized");
  return sync;
}
