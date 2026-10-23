export const statuses = ["Backlog", "Todo", "In progress", "Done"] as const;
export type Status = (typeof statuses)[number];
export type Priority = "No priority" | "Low" | "Medium" | "High" | "Urgent";
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
export type Action =
  | { type: "save-issue"; issue: Issue }
  | { type: "delete-issue"; id: string }
  | { type: "move-issue"; id: string; status: Status; beforeId?: string }
  | { type: "create-project"; project: Project };
// All mutations live here. A future sync layer can dispatch the same typed actions.
export function workspaceReducer(
  state: WorkspaceState,
  action: Action,
): WorkspaceState {
  switch (action.type) {
    case "save-issue":
      return {
        ...state,
        issues: state.issues.some((i) => i.id === action.issue.id)
          ? state.issues.map((i) =>
              i.id === action.issue.id ? action.issue : i,
            )
          : [...state.issues, action.issue],
      };
    case "delete-issue":
      return {
        ...state,
        issues: state.issues.filter((i) => i.id !== action.id),
      };
    case "create-project":
      return { ...state, projects: [...state.projects, action.project] };
    case "move-issue": {
      const issue = state.issues.find((i) => i.id === action.id);
      if (!issue) return state;
      const issues = state.issues.filter((i) => i.id !== action.id);
      const index = action.beforeId
        ? issues.findIndex((i) => i.id === action.beforeId)
        : -1;
      issues.splice(index < 0 ? issues.length : index, 0, {
        ...issue,
        status: action.status,
      });
      return { ...state, issues };
    }
  }
}
export const initialState: WorkspaceState = {
  projects: [
    {
      id: "platform",
      name: "Platform foundation",
      description:
        "The building blocks for a faster, more connected workspace.",
      color: "#a89af9",
      target: "Nov 12",
    },
    {
      id: "website",
      name: "Website refresh",
      description: "A fresh expression of who we are and what we’re building.",
      color: "#e0a779",
      target: "Nov 24",
    },
    {
      id: "mobile",
      name: "Mobile experience",
      description: "Bring the essentials with you, wherever work happens.",
      color: "#7cbfa6",
      target: "Dec 08",
    },
  ],
  issues: [
    [
      "18",
      "Explore offline-first architecture",
      "Backlog",
      "Medium",
      "platform",
      "Research",
      "JL",
    ],
    [
      "19",
      "Define workspace permissions",
      "Backlog",
      "Low",
      "platform",
      "Feature",
      "AM",
    ],
    [
      "20",
      "Audit keyboard accessibility",
      "Backlog",
      "Medium",
      "website",
      "Improvement",
      "SK",
    ],
    [
      "21",
      "Design the project overview",
      "Todo",
      "High",
      "platform",
      "Design",
      "AM",
    ],
    [
      "22",
      "Build the command menu",
      "Todo",
      "Medium",
      "platform",
      "Feature",
      "JL",
    ],
    ["23", "Polish empty states", "Todo", "Low", "website", "Design", "SK"],
    [
      "24",
      "Set up the design token system",
      "In progress",
      "High",
      "platform",
      "Improvement",
      "AM",
    ],
    [
      "25",
      "Implement issue drag and drop",
      "In progress",
      "High",
      "platform",
      "Feature",
      "JL",
    ],
    [
      "26",
      "Refine mobile navigation",
      "In progress",
      "Medium",
      "mobile",
      "Design",
      "SK",
    ],
    [
      "27",
      "Create the workspace shell",
      "Done",
      "Medium",
      "platform",
      "Feature",
      "JL",
    ],
    [
      "28",
      "Document component patterns",
      "Done",
      "Low",
      "platform",
      "Improvement",
      "AM",
    ],
    [
      "29",
      "Finalize the brand palette",
      "Done",
      "Medium",
      "website",
      "Design",
      "SK",
    ],
  ].map(([id, title, status, priority, projectId, label, assignee]) => ({
    id: `ORB-${id}`,
    title,
    status: status as Status,
    priority: priority as Priority,
    projectId,
    label,
    assignee,
    description:
      "Let’s make the experience feel thoughtful, fast, and easy to use.\n\nCapture the details and next steps here.",
  })),
};
