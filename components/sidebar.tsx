"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  Inbox,
  CircleUser,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  SquarePen,
} from "lucide-react";
import { getSync } from "@/lib/sync";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/workspace";
import { UserMenu } from "./user-menu";

export type Page = "inbox" | "my-issues" | "issues" | "projects";

function useSyncStatus() {
  const { database } = getSync();
  const [status, setStatus] = useState(database.currentStatus);
  useEffect(
    () => database.registerListener({ statusChanged: setStatus }),
    [database],
  );
  if (!status.connected)
    return { tone: "bg-amber-500", text: "Offline · saved locally" };
  if (status.dataFlowStatus.uploading || status.dataFlowStatus.downloading)
    return { tone: "bg-sky-500", text: "Syncing…" };
  return { tone: "bg-emerald-500", text: "Synced" };
}

function NavItem({
  active,
  icon,
  count,
  children,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  count?: number;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] text-soft-foreground hover:bg-hover",
        active && "bg-accent text-accent-foreground hover:bg-accent",
      )}
      onClick={onClick}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {!!count && (
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {count}
        </span>
      )}
    </button>
  );
}

export function Sidebar({
  open,
  teamName,
  page,
  projectId,
  projects,
  counts,
  user,
  signingOut,
  onNavigate,
  onSearch,
  onCreateIssue,
  onCreateProject,
  onSignOut,
}: {
  open: boolean;
  teamName: string;
  page: Page;
  projectId: string;
  projects: Project[];
  counts: { inbox: number; mine: number; all: number };
  user: { id: string; name: string };
  signingOut: boolean;
  onNavigate: (page: Page, projectId?: string) => void;
  onSearch: () => void;
  onCreateIssue: () => void;
  onCreateProject: () => void;
  onSignOut: () => Promise<void>;
}) {
  const sync = useSyncStatus();
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col gap-0.5 border-r bg-sidebar px-2.5 py-3",
        "max-[700px]:shadow-[20px_0_50px_#0006]",
        !open && "max-[700px]:hidden",
      )}
    >
      <div className="mb-2 flex items-center gap-2 px-1.5">
        <span className="grid size-[22px] place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
          {teamName[0]?.toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
          {teamName}
        </span>
        <button
          type="button"
          aria-label="Create issue"
          title="Create issue (C)"
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-hover hover:text-foreground"
          onClick={onCreateIssue}
        >
          <SquarePen size={15} />
        </button>
      </div>
      <button
        type="button"
        className="mb-2 flex h-7 items-center gap-2 rounded-md border bg-card px-2 text-[13px] text-muted-foreground hover:bg-hover"
        onClick={onSearch}
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="rounded-[3px] border px-1">⌘K</kbd>
      </button>
      <NavItem
        active={page === "inbox"}
        icon={<Inbox size={15} />}
        count={counts.inbox}
        onClick={() => onNavigate("inbox")}
      >
        Inbox
      </NavItem>
      <NavItem
        active={page === "my-issues"}
        icon={<CircleUser size={15} />}
        count={counts.mine}
        onClick={() => onNavigate("my-issues")}
      >
        My issues
      </NavItem>
      <NavItem
        active={page === "issues" && !projectId}
        icon={<Layers size={15} />}
        count={counts.all}
        onClick={() => onNavigate("issues")}
      >
        All issues
      </NavItem>
      <NavItem
        active={page === "projects"}
        icon={<LayoutGrid size={15} />}
        onClick={() => onNavigate("projects")}
      >
        Projects
      </NavItem>
      <div className="mt-4 mb-1 flex items-center justify-between px-2 text-[11px] font-medium text-faint-foreground">
        Your projects
        <button
          type="button"
          aria-label="Create project"
          className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-hover hover:text-foreground"
          onClick={onCreateProject}
        >
          <Plus size={13} />
        </button>
      </div>
      <nav className="-mx-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1">
        {projects.map((project) => (
          <NavItem
            key={project.id}
            active={page === "issues" && projectId === project.id}
            icon={
              <i
                className="size-2 shrink-0 rounded-[2px]"
                style={{ background: project.color }}
              />
            }
            onClick={() => onNavigate("issues", project.id)}
          >
            {project.name}
          </NavItem>
        ))}
      </nav>
      <div className="mt-2 border-t pt-2">
        <div
          role="status"
          className="mb-1 flex items-center gap-2 px-2 text-[11px] text-muted-foreground"
        >
          <i className={cn("size-1.5 rounded-full", sync.tone)} />
          {sync.text}
        </div>
        <UserMenu
          id={user.id}
          name={user.name}
          onSignOut={onSignOut}
          signingOut={signingOut}
        />
      </div>
    </aside>
  );
}
