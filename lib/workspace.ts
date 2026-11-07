import { priorities, statuses } from "./domain";

export { statuses } from "./domain";
export type Status = (typeof statuses)[number];
export type Priority = (typeof priorities)[number];
export type Issue = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  projectId: string;
  label: string;
  assignee: string;
};
export type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  target: string;
};
export type WorkspaceState = { issues: Issue[]; projects: Project[] };
