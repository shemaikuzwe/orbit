"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import { getSync } from "@/lib/sync";
import { issueSchema, projectSchema } from "@/lib/domain";
import type { Issue, Project, Status } from "@/lib/workspace";

import { generateKeyBetween } from "fractional-indexing";

export type WorkspaceMember = { id: string; name: string };

export function useWorkspace(teamId: string) {
  const sync = getSync();
  const { data: rawIssues = [] } = useLiveQuery((q) =>
    q
      .from({ issue: sync.issues })
      .where(({ issue }) => eq(issue.team_id, teamId)),
  );
  const { data: projects = [] } = useLiveQuery((q) =>
    q
      .from({ project: sync.projects })
      .where(({ project }) => eq(project.team_id, teamId)),
  );
  const { data: memberships = [] } = useLiveQuery((q) =>
    q
      .from({ member: sync.memberships })
      .where(({ member }) => eq(member.team_id, teamId)),
  );
  const { data: profiles = [] } = useLiveQuery((q) =>
    q.from({ profile: sync.profiles }),
  );
  const ordered = [...rawIssues].sort((a, b) =>
    a.position < b.position
      ? -1
      : a.position > b.position
        ? 1
        : a.id < b.id
          ? -1
          : a.id > b.id
            ? 1
            : 0,
  );
  const issues: Issue[] = ordered.map((issue) => ({
    ...issue,
    projectId: issue.project_id ?? "",
    assignee: issue.assignee_id ?? "",
  }));
  const members: WorkspaceMember[] = memberships.map((member) => ({
    id: member.user_id,
    name:
      profiles.find((profile) => profile.id === member.user_id)?.name ??
      "Team member",
  }));

  async function saveIssue(issue: Issue) {
    const existing = sync.issues.get(issue.id);
    if (existing && existing.team_id !== teamId)
      throw new Error("Issue is not in this team");
    const last = ordered
      .filter((row) => row.status === issue.status && row.id !== issue.id)
      .at(-1);
    const row = issueSchema.parse({
      id: issue.id,
      team_id: teamId,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      project_id: issue.projectId || null,
      label: issue.label,
      assignee_id: issue.assignee || null,
      position:
        existing?.status === issue.status
          ? existing.position
          : generateKeyBetween(last?.position ?? null, null),
    });
    const transaction = existing
      ? sync.issues.update(issue.id, (draft) => {
          Object.assign(draft, row);
        })
      : sync.issues.insert(row);
    await transaction.when("settled");
  }

  async function deleteIssue(id: string) {
    if (sync.issues.get(id)?.team_id !== teamId)
      throw new Error("Issue is not in this team");
    await sync.issues.delete(id).when("settled");
  }

  async function moveIssue(id: string, status: Status, beforeId?: string) {
    if (sync.issues.get(id)?.team_id !== teamId)
      throw new Error("Issue is not in this team");
    const destination = ordered.filter(
      (row) => row.status === status && row.id !== id,
    );
    const index = beforeId
      ? destination.findIndex((row) => row.id === beforeId)
      : destination.length;
    if (index < 0)
      throw new Error("The destination issue is no longer available");
    const position = generateKeyBetween(
      destination[index - 1]?.position ?? null,
      destination[index]?.position ?? null,
    );
    await sync.issues
      .update(id, (draft) => {
        draft.status = status;
        draft.position = position;
      })
      .when("settled");
  }

  async function createProject(project: Project) {
    await sync.projects
      .insert(projectSchema.parse({ ...project, team_id: teamId }))
      .when("settled");
  }

  return {
    issues,
    projects,
    members,
    saveIssue,
    deleteIssue,
    moveIssue,
    createProject,
  };
}
