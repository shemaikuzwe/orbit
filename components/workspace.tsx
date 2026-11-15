"use client";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import type { DropResult } from "@hello-pangea/dnd";
import {
  CircleUser,
  Inbox as InboxIcon,
  LayoutGrid,
  Layers,
  List,
  PanelLeft,
  Plus,
  SquarePen,
  SunMoon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/use-workspace";
import { cn } from "@/lib/utils";
import { statuses, type Issue, type Status } from "@/lib/workspace";
import CommandPalette, { type Command } from "./command-palette";
import {
  FilterBar,
  matchesFilters,
  noFilters,
  type Filters,
} from "./filter-bar";
import Inbox from "./inbox";
import IssueDialog from "./issue-dialog";
import IssuePanel from "./issue-panel";
import IssueViews, { EmptyState } from "./issue-views";
import ProjectDialog from "./project-dialog";
import ProjectsTable from "./projects-table";
import { issueOptions } from "./property-select";
import { Sidebar, type Page } from "./sidebar";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.matches("input,textarea,select") || target.isContentEditable);

export default function Workspace({
  teamId,
  user,
  onSignOut,
  signingOut,
}: {
  teamId: string;
  user: { id: string; name: string };
  onSignOut: () => Promise<void>;
  signingOut: boolean;
}) {
  const state = useWorkspace(teamId, user.id);
  const { resolvedTheme, setTheme } = useTheme();
  const [page, setPage] = useState<Page>("issues");
  const [projectId, setProjectId] = useState("");
  const [view, setView] = useState<"board" | "list">("board");
  const [filters, setFilters] = useState<Filters>(noFilters);
  const [selectedId, setSelectedId] = useState("");
  const [creating, setCreating] = useState<Issue | null>(null);
  const [projectDialog, setProjectDialog] = useState(false);
  const [palette, setPalette] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastKey = useRef({ key: "", at: 0 });

  const project = state.projects.find((p) => p.id === projectId);
  const selected = state.issues.find((i) => i.id === selectedId);
  const unread = state.notifications.filter((n) => !n.read_at);
  const mine = state.issues.filter((i) => i.assignee === user.id);
  const scoped =
    page === "my-issues"
      ? mine
      : state.issues.filter((i) => !projectId || i.projectId === projectId);
  const visible = scoped.filter((i) => matchesFilters(i, filters));
  // Keyboard navigation follows the on-screen order: grouped by status.
  const ordered = statuses.flatMap((s) =>
    visible.filter((i) => i.status === s),
  );
  const onIssuePage = page === "issues" || page === "my-issues";

  async function persist(action: () => Promise<void>, message?: string) {
    setSaving(true);
    try {
      await action();
      if (message) toast.success(message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save your change",
      );
    } finally {
      setSaving(false);
    }
  }

  function createIssue(status: Status = "Todo", parent?: Issue) {
    setCreating({
      id: crypto.randomUUID(),
      title: "",
      description: "",
      status,
      priority: "No priority",
      projectId: parent?.projectId ?? projectId,
      label: "Feature",
      assignee: page === "my-issues" ? user.id : "",
      dueDate: "",
      parentId: parent?.id ?? "",
      identifier: "",
    });
  }

  function navigate(next: Page, id = "") {
    setPage(next);
    setProjectId(id);
    setFilters(noFilters);
    setSidebar(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPalette((open) => !open);
        return;
      }
      // Radix marks Escape handled when it closes a menu or select.
      if (e.defaultPrevented || isTyping(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (creating || projectDialog || palette) return;
      const previous = lastKey.current;
      lastKey.current = { key: e.key, at: Date.now() };
      if (previous.key === "g" && Date.now() - previous.at < 1000) {
        const target = (
          { i: "inbox", m: "my-issues", a: "issues", p: "projects" } as const
        )[e.key];
        if (target) return navigate(target);
      }
      if (e.key === "c") {
        e.preventDefault();
        createIssue();
      } else if (e.key === "Escape" && selectedId) {
        setSelectedId("");
      } else if (
        selectedId &&
        ["j", "k", "ArrowDown", "ArrowUp"].includes(e.key)
      ) {
        e.preventDefault();
        const step = e.key === "j" || e.key === "ArrowDown" ? 1 : -1;
        const index = ordered.findIndex((i) => i.id === selectedId);
        const next = ordered[index + step];
        if (next) setSelectedId(next.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function dragEnd(result: DropResult) {
    if (!result.destination) return;
    const destination = visible.filter(
      (i) =>
        i.status === result.destination!.droppableId &&
        i.id !== result.draggableId,
    );
    void persist(() =>
      state.moveIssue(
        result.draggableId,
        result.destination!.droppableId as Status,
        destination[result.destination!.index]?.id,
      ),
    );
  }

  const options = issueOptions(state.members, state.projects);
  const title = {
    inbox: "Inbox",
    "my-issues": "My issues",
    issues: project?.name ?? "All issues",
    projects: "Projects",
  }[page];
  const count = {
    inbox: unread.length,
    "my-issues": visible.length,
    issues: visible.length,
    projects: state.projects.length,
  }[page];
  const commands: Command[] = [
    {
      id: "new-issue",
      group: "Actions",
      label: "Create issue",
      shortcut: "C",
      icon: <SquarePen size={14} />,
      run: () => createIssue(),
    },
    {
      id: "new-project",
      group: "Actions",
      label: "Create project",
      icon: <Plus size={14} />,
      run: () => setProjectDialog(true),
    },
    {
      id: "theme",
      group: "Actions",
      label: `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`,
      icon: <SunMoon size={14} />,
      run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
    },
    {
      id: "go-inbox",
      group: "Go to",
      label: "Inbox",
      shortcut: "G I",
      icon: <InboxIcon size={14} />,
      run: () => navigate("inbox"),
    },
    {
      id: "go-mine",
      group: "Go to",
      label: "My issues",
      shortcut: "G M",
      icon: <CircleUser size={14} />,
      run: () => navigate("my-issues"),
    },
    {
      id: "go-all",
      group: "Go to",
      label: "All issues",
      shortcut: "G A",
      icon: <Layers size={14} />,
      run: () => navigate("issues"),
    },
    {
      id: "go-projects",
      group: "Go to",
      label: "Projects",
      shortcut: "G P",
      icon: <LayoutGrid size={14} />,
      run: () => navigate("projects"),
    },
    ...state.projects.map((p) => ({
      id: `project-${p.id}`,
      group: "Go to" as const,
      label: p.name,
      icon: (
        <i className="size-2 rounded-[2px]" style={{ background: p.color }} />
      ),
      run: () => navigate("issues", p.id),
    })),
  ];

  return (
    <div className="flex h-dvh">
      <Sidebar
        open={sidebar}
        teamName={state.teamName}
        page={page}
        projectId={projectId}
        projects={state.projects}
        counts={{
          inbox: unread.length,
          mine: mine.filter((i) => i.status !== "Done").length,
          all: state.issues.length,
        }}
        user={user}
        signingOut={signingOut}
        onNavigate={navigate}
        onSearch={() => setPalette(true)}
        onCreateIssue={() => createIssue()}
        onCreateProject={() => setProjectDialog(true)}
        onSignOut={onSignOut}
      />
      {sidebar && (
        <div
          aria-hidden
          className="fixed inset-0 z-30 bg-black/30 min-[701px]:hidden"
          onClick={() => setSidebar(false)}
        />
      )}
      <main className="ml-[220px] flex min-w-0 flex-1 flex-col max-[700px]:ml-0">
        <header className="flex h-[38px] shrink-0 items-center gap-2 border-b px-4">
          <button
            type="button"
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-hover min-[701px]:hidden"
            onClick={() => setSidebar(!sidebar)}
            aria-label="Toggle navigation"
          >
            <PanelLeft size={16} />
          </button>
          {project && (
            <i
              className="size-2.5 rounded-[3px]"
              style={{ background: project.color }}
            />
          )}
          <h1 className="truncate text-[13px] font-semibold">{title}</h1>
          <span className="text-xs text-muted-foreground tabular-nums">
            {count}
          </span>
          {onIssuePage && (
            <div className="ml-2 flex rounded-md border p-px text-xs">
              {(["board", "list"] as const).map((v) => (
                <button
                  type="button"
                  key={v}
                  aria-pressed={view === v}
                  className={cn(
                    "flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-muted-foreground capitalize",
                    view === v &&
                      "bg-card text-foreground shadow-[0_0_0_1px_var(--input)]",
                  )}
                  onClick={() => setView(v)}
                >
                  {v === "board" ? (
                    <LayoutGrid size={12} />
                  ) : (
                    <List size={12} />
                  )}
                  <span className="max-sm:hidden">{v}</span>
                </button>
              ))}
            </div>
          )}
          <span className="flex-1" />
          {page === "inbox" && unread.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                void persist(() => state.markRead(unread.map((n) => n.id)))
              }
            >
              Mark all read
            </Button>
          )}
          {page !== "inbox" && (
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                page === "projects" ? setProjectDialog(true) : createIssue()
              }
            >
              <Plus size={13} />
              <span className="max-sm:hidden">
                {page === "projects" ? "New project" : "New issue"}
              </span>
            </Button>
          )}
        </header>
        {onIssuePage && state.issues.length > 0 && (
          <FilterBar
            filters={filters}
            options={options}
            fields={
              page === "my-issues"
                ? ["priority", "label", "project"]
                : projectId
                  ? ["assignee", "priority", "label"]
                  : ["assignee", "priority", "label", "project"]
            }
            onChange={setFilters}
          />
        )}
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col overflow-auto">
            {page === "inbox" ? (
              <Inbox
                notifications={state.notifications}
                issues={state.issues}
                members={state.members}
                selectedId={selectedId}
                onOpen={(notification) => {
                  setSelectedId(notification.issue_id);
                  if (!notification.read_at)
                    void persist(() => state.markRead([notification.id]));
                }}
              />
            ) : page === "projects" ? (
              <ProjectsTable
                projects={state.projects}
                issues={state.issues}
                members={state.members}
                onOpen={(id) => navigate("issues", id)}
                onCreate={() => setProjectDialog(true)}
                onSave={(p) => void persist(() => state.saveProject(p))}
              />
            ) : state.issues.length === 0 ? (
              <EmptyState onCreate={() => createIssue()} />
            ) : (
              <IssueViews
                view={view}
                members={state.members}
                issues={visible}
                selectedId={selectedId}
                dragEnd={dragEnd}
                createIssue={createIssue}
                onSelect={(issue) => setSelectedId(issue.id)}
              />
            )}
          </div>
          {selected && (
            <IssuePanel
              key={selected.id}
              issue={selected}
              issues={state.issues}
              members={state.members}
              projects={state.projects}
              saving={saving}
              onSave={(issue) => void persist(() => state.saveIssue(issue))}
              onDelete={() =>
                void persist(async () => {
                  await state.deleteIssue(selected.id);
                  setSelectedId("");
                }, "Issue deleted")
              }
              onClose={() => setSelectedId("")}
              onSelect={setSelectedId}
              onAddSubIssue={() => createIssue("Todo", selected)}
              onComment={(body) =>
                persist(() => state.addComment(selected.id, body))
              }
            />
          )}
        </div>
      </main>
      {creating && (
        <IssueDialog
          key={creating.id}
          issue={creating}
          parent={state.issues.find((i) => i.id === creating.parentId)}
          projects={state.projects}
          members={state.members}
          pending={saving}
          onClose={() => setCreating(null)}
          onSave={(issue) =>
            persist(async () => {
              await state.saveIssue(issue);
              setCreating(null);
              setSelectedId(issue.id);
            }, "Issue created")
          }
        />
      )}
      {projectDialog && (
        <ProjectDialog
          onClose={() => setProjectDialog(false)}
          pending={saving}
          onSave={(p) =>
            persist(async () => {
              await state.saveProject(p);
              setProjectDialog(false);
              navigate("issues", p.id);
            }, "Project created")
          }
        />
      )}
      {palette && (
        <CommandPalette
          commands={commands}
          issues={state.issues}
          onOpenIssue={setSelectedId}
          onClose={() => setPalette(false)}
        />
      )}
    </div>
  );
}
