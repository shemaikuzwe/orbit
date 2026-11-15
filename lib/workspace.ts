import { healths, labels, priorities, statuses } from "./domain";

export { statuses, priorities, labels, healths } from "./domain";
export type Status = (typeof statuses)[number];
export type Priority = (typeof priorities)[number];
export type Label = (typeof labels)[number];
export type Health = (typeof healths)[number];
export type Issue = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  projectId: string;
  label: string;
  assignee: string;
  dueDate: string;
  parentId: string;
  /** Team-scoped key such as ORB-12; empty until the server numbers it. */
  identifier: string;
};
export type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  /** ISO date, or "" for none. */
  target: string;
  health: Health;
  leadId: string;
};
export type WorkspaceState = { issues: Issue[]; projects: Project[] };
