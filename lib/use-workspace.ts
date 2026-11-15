"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import { getSync } from "@/lib/sync";
import { commentSchema, issueSchema, projectSchema } from "@/lib/domain";
import type { Issue, Project, Status } from "@/lib/workspace";
import { parseTimestamp } from "@/lib/utils";

import { generateKeyBetween } from "fractional-indexing";

export type WorkspaceMember = { id: string; name: string };
export type Workspace = ReturnType<typeof useWorkspace>;

// "Acme Labs" -> "ACM"; used as the prefix of issue identifiers.
function teamKey(name: string) {
  return (
    name
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 3)
      .toUpperCase() || "ISS"
  );
}

export function useWorkspace(teamId: string, userId: string) {
  const sync = getSync();
  const { data: rawIssues = [] } = useLiveQuery((q) =>
    q
      .from({ issue: sync.issues })
      .where(({ issue }) => eq(issue.team_id, teamId)),
  );
  const { data: rawProjects = [] } = useLiveQuery((q) =>
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
  const { data: teams = [] } = useLiveQuery((q) =>
    q.from({ team: sync.teams }).where(({ team }) => eq(team.id, teamId)),
  );
  const { data: rawNotifications = [] } = useLiveQuery((q) =>
    q
      .from({ notification: sync.notifications })
      .where(({ notification }) => eq(notification.team_id, teamId)),
  );
  const teamName = teams[0]?.name ?? "Workspace";
  const key = teamKey(teamName);
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
    dueDate: issue.due_date ?? "",
    parentId: issue.parent_id ?? "",
    identifier: issue.number ? `${key}-${issue.number}` : "",
  }));
  const projects: Project[] = rawProjects.map((project) => ({
    ...project,
    leadId: project.lead_id ?? "",
  }));
  const members: WorkspaceMember[] = memberships.map((member) => ({
    id: member.user_id,
    name:
      profiles.find((profile) => profile.id === member.user_id)?.name ??
      "Team member",
  }));
  const notifications = [...rawNotifications].sort(
    (a, b) => parseTimestamp(b.created_at) - parseTimestamp(a.created_at),
  );

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
      due_date: issue.dueDate || null,
      parent_id: issue.parentId || null,
      number: existing?.number ?? null,
      creator_id: existing ? existing.creator_id : userId,
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

  async function saveProject(project: Project) {
    const row = projectSchema.parse({
      ...project,
      team_id: teamId,
      lead_id: project.leadId || null,
    });
    const transaction = sync.projects.get(project.id)
      ? sync.projects.update(project.id, (draft) => {
          Object.assign(draft, row);
        })
      : sync.projects.insert(row);
    await transaction.when("settled");
  }

  async function addComment(issueId: string, body: string) {
    await sync.comments
      .insert(
        commentSchema.parse({
          id: crypto.randomUUID(),
          team_id: teamId,
          issue_id: issueId,
          author_id: userId,
          body,
          created_at: new Date().toISOString(),
        }),
      )
      .when("settled");
  }

  async function markRead(ids: string[]) {
    if (!ids.length) return;
    const now = new Date().toISOString();
    await sync.notifications
      .update(ids, (drafts) => {
        for (const draft of drafts) draft.read_at = now;
      })
      .when("settled");
  }

  return {
    teamName,
    issues,
    projects,
    members,
    notifications,
    saveIssue,
    deleteIssue,
    moveIssue,
    saveProject,
    addComment,
    markRead,
  };
}

/** Comments and history for one issue, merged oldest first. */
export function useIssueActivity(issueId: string) {
  const sync = getSync();
  const { data: comments = [] } = useLiveQuery((q) =>
    q
      .from({ comment: sync.comments })
      .where(({ comment }) => eq(comment.issue_id, issueId)),
  );
  const { data: events = [] } = useLiveQuery((q) =>
    q
      .from({ event: sync.events })
      .where(({ event }) => eq(event.issue_id, issueId)),
  );
  return [
    ...comments.map((comment) => ({ type: "comment" as const, ...comment })),
    ...events.map((event) => ({ type: "event" as const, ...event })),
  ].sort((a, b) => parseTimestamp(a.created_at) - parseTimestamp(b.created_at));
}
