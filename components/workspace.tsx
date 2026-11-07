"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { IssueAvatar, IssueLabel } from "./issue-meta";
import ProjectsGrid from "./projects-grid";
import IssueViews from "./issue-views";
import ProjectDialog from "./project-dialog";
import { PriorityIcon } from "./issue-icons";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/use-workspace";
import type { DropResult } from "@hello-pangea/dnd";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Layers,
  SlidersHorizontal,
  List,
  Box,
  PanelLeft,
  Folder,
  Sparkles,
} from "lucide-react";
import type { Issue, Status } from "@/lib/workspace";
import IssueDialog from "./issue-dialog";
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
  const state = useWorkspace(teamId);
  const [page, setPage] = useState<"issues" | "projects">("issues");
  const [projectId, setProjectId] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"board" | "list">("board");
  const [priority, setPriority] = useState("");
  const [filters, setFilters] = useState(false);
  const [editing, setEditing] = useState<Issue | null>(null);
  const [projectDialog, setProjectDialog] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [saving, setSaving] = useState(false);
  async function persist(action: () => Promise<void>, message: string) {
    setSaving(true);
    try {
      await action();
      toast.success(message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save your change",
      );
    } finally {
      setSaving(false);
    }
  }
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedProject = state.projects.find((p) => p.id === projectId);
  const issues = state.issues.filter(
    (i) =>
      (!projectId || i.projectId === projectId) &&
      (!priority || i.priority === priority) &&
      `${i.title} ${i.id}`.toLowerCase().includes(query.toLowerCase()),
  );
  function createIssue(status: Status = "Todo") {
    setEditing({
      id: crypto.randomUUID(),
      title: "",
      description: "",
      status,
      priority: "No priority",
      projectId,
      label: "Feature",
      assignee: "",
    });
  }
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLElement &&
        (e.target.matches("input,textarea,select") ||
          e.target.isContentEditable)
      )
        return;
      if (
        e.key === "c" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !editing &&
        !projectDialog
      ) {
        e.preventDefault();
        createIssue();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  function dragEnd(result: DropResult) {
    if (!result.destination) return;
    const destination = issues.filter(
      (i) =>
        i.status === result.destination!.droppableId &&
        i.id !== result.draggableId,
    );
    void persist(
      () =>
        state.moveIssue(
          result.draggableId,
          result.destination!.droppableId as Status,
          destination[result.destination!.index]?.id,
        ),
      "Issue moved",
    );
  }
  function navigate(next: "issues" | "projects", id = "") {
    setPage(next);
    setProjectId(id);
    setQuery("");
    setSidebar(false);
  }
  function renderCard(issue: Issue) {
    return (
      <>
        <div className="flex items-center justify-between text-[9px] text-[#72727e]">
          <span>{issue.id}</span>
          <PriorityIcon priority={issue.priority} />
        </div>
        <h3 className="mt-2.5 mb-[18px] text-xs leading-[1.65] font-[450] tracking-[-.05px] min-[1600px]:text-[13px]">
          {issue.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <IssueLabel label={issue.label} />
          <span className="flex items-center gap-[9px] text-[#63636d]">
            {issue.projectId && <Box size={12} />}
            <IssueAvatar
              assignee={issue.assignee}
              members={state.members}
              small
            />
          </span>
        </div>
      </>
    );
  }
  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 flex w-[232px] shrink-0 flex-col border-r bg-sidebar px-3.5 pt-[25px] max-[1200px]:w-[205px] max-[700px]:z-40 max-[700px]:w-[230px] max-[700px]:shadow-[20px_0_50px_#0008]",
          !sidebar && "max-[700px]:hidden",
        )}
      >
        <Button
          variant="ghost"
          size="none"
          className="flex w-full items-center gap-2.5 px-2 text-base font-semibold"
          onClick={() => navigate("issues")}
        >
          <span className="grid size-[27px] place-items-center rounded-lg bg-[#b4a4ef] text-[26px] text-[#25202e]">
            ◒
          </span>{" "}
          Orbit <ChevronDown size={14} />
          <span className="ml-auto text-[10px] font-normal text-[#73737d]">
            ⌘ K
          </span>
        </Button>
        <Button
          variant="ghost"
          size="none"
          className="mx-1 mt-[25px] mb-7 flex h-[34px] items-center justify-start gap-2 rounded-md border border-[#323338] bg-[#1b1c1f] px-[11px] text-xs hover:bg-[#26272c] [&_kbd]:ml-auto [&_kbd]:rounded-[3px] [&_kbd]:border [&_kbd]:border-[#393a3f] [&_kbd]:px-1"
          onClick={() => createIssue()}
        >
          <Plus size={15} /> Create issue <kbd>C</kbd>
        </Button>
        <div className="mb-2.5 px-3 text-[10px] font-semibold tracking-[.055em] text-[#6f707a] uppercase">
          Workspace
        </div>
        <nav className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="none"
            data-active={page === "issues" && !projectId}
            className="h-[35px] w-full justify-start gap-2.5 rounded-[5px] px-3 text-left text-xs font-normal text-[#9b9ca5] hover:bg-[#1b1c20] data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
            onClick={() => navigate("issues")}
          >
            <Layers size={16} /> Issues{" "}
            <span className="ml-auto text-[10px] text-[#ab9bcf]">
              {state.issues.length}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="none"
            data-active={page === "projects"}
            className="h-[35px] w-full justify-start gap-2.5 rounded-[5px] px-3 text-left text-xs font-normal text-[#9b9ca5] hover:bg-[#1b1c20] data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
            onClick={() => navigate("projects")}
          >
            <LayoutGrid size={16} /> Projects
          </Button>
        </nav>
        <div className="mt-[34px] mb-2.5 flex items-center justify-between px-3 text-[10px] font-semibold tracking-[.055em] text-[#6f707a] uppercase">
          Your projects
          <Button
            variant="ghost"
            size="none"
            className="inline-flex size-[25px] items-center justify-center rounded text-[#7d7e88] hover:bg-[#303137] hover:text-[#eeeeee]"
            onClick={() => setProjectDialog(true)}
            aria-label="Create project"
          >
            <Plus size={13} />
          </Button>
        </div>
        <nav className="flex flex-col gap-1">
          {state.projects.map((p) => (
            <Button
              variant="ghost"
              size="none"
              key={p.id}
              data-active={page === "issues" && projectId === p.id}
              className="h-[35px] w-full justify-start gap-2.5 rounded-[5px] px-3 text-left text-xs font-normal text-[#9b9ca5] hover:bg-[#1b1c20] data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
              onClick={() => navigate("issues", p.id)}
            >
              <Box size={15} color={p.color} />
              <span className="truncate">{p.name}</span>
            </Button>
          ))}
        </nav>
        <div className="relative mx-2.5 mt-auto mb-[38px] min-h-[270px] overflow-hidden pt-[75px] [&>strong]:text-[11px] [&>strong]:font-medium [&>strong]:text-[#adadb5] [&>p]:my-[11px] [&>p]:text-[11px] [&>p]:leading-[1.7] [&>p]:text-[#60616c]">
          <span className="mb-3 block text-[#ad9bdf]">
            <Sparkles size={15} />
          </span>
          <strong>A little space for big ideas.</strong>
          <p>
            Make something worth
            <br />
            working on.
          </p>
          <div className="absolute -bottom-[5px] -left-2.5 h-[90px] w-[200px] opacity-50 [&>span]:absolute [&>span]:top-5 [&>span]:left-1.5 [&>span]:h-[58px] [&>span]:w-[150px] [&>span]:-rotate-30 [&>span]:rounded-[50%] [&>span]:border [&>span]:border-[#504262] [&>span+span]:rotate-[28deg] [&>span+span]:border-[#37333e] [&>i]:absolute [&>i]:top-[18px] [&>i]:right-[43px] [&>i]:size-[7px] [&>i]:rounded-full [&>i]:bg-[#a693d1] [&>i]:shadow-[0_0_15px_#9680bb80]">
            <span />
            <span />
            <i />
          </div>
        </div>
        <div className="flex h-[76px] items-center gap-2.5 border-t border-[#242529] px-2.5 [&>div]:flex [&>div]:flex-1 [&>div]:flex-col [&>div]:gap-1 [&_strong]:text-[11px] [&_strong]:font-medium [&>div>span]:text-[10px] [&>div>span]:text-[#656670]">
          <IssueAvatar assignee={user.id} members={[user]} />
          <div>
            <strong>{user.name}</strong>
            <Button
              variant="ghost"
              size="none"
              className="justify-start text-[10px] text-muted-foreground"
              disabled={signingOut}
              onClick={onSignOut}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
          <ChevronDown size={14} />
        </div>
      </aside>
      <main className="ml-[232px] flex min-w-0 flex-1 flex-col max-[1200px]:ml-[205px] max-[700px]:ml-0">
        <header className="flex h-[61px] shrink-0 items-center justify-between border-b px-8 text-[11px] max-[700px]:px-4 [&>div]:flex [&>div]:items-center [&>div]:gap-3 [&>div]:text-[#85858f] [&_strong]:font-medium [&_strong]:text-[#cdccd4]">
          <div>
            <Button
              variant="ghost"
              size="none"
              className="inline-flex size-[25px] items-center justify-center rounded text-[#7d7e88] hover:bg-[#303137] hover:text-[#eeeeee] min-[701px]:hidden"
              onClick={() => setSidebar(!sidebar)}
              aria-label="Toggle navigation"
            >
              <PanelLeft size={18} />
            </Button>
            <span className="inline-grid size-[18px] place-items-center rounded border border-[#494259] bg-[#333043] text-[10px] font-semibold text-[#c1b4e7]">
              O
            </span>
            <span>Orbit</span>
            <ChevronRight size={13} />
            <strong>
              {page === "projects"
                ? "Projects"
                : selectedProject?.name || "Issues"}
            </strong>
          </div>
          <span className="flex items-center gap-[7px] text-[10px] text-[#787982] max-[700px]:text-[8px] [&>i]:size-[5px] [&>i]:rounded-full [&>i]:bg-[#8bb898]">
            <i /> Local workspace
          </span>
        </header>
        <section className="px-[34px] pt-[38px] pb-[29px] max-[1200px]:px-6 max-[700px]:px-5 max-[700px]:py-7">
          <div className="mb-3 text-[9px] font-medium tracking-[.15em] text-[#85818f]">
            YOUR WORK, IN MOTION
          </div>
          <div className="flex items-center justify-between gap-5 max-[700px]:items-start [&_h1]:m-0 [&_h1]:flex [&_h1]:items-center [&_h1]:gap-3 [&_h1]:text-[26px] [&_h1]:font-[550] [&_h1]:tracking-[-.85px] max-[700px]:[&_h1]:text-[23px] [&_p]:mt-2.5 [&_p]:text-xs [&_p]:leading-normal [&_p]:text-muted-foreground max-[700px]:[&_p]:max-w-[235px] max-[700px]:[&_p]:text-[11px]">
            <div>
              <h1>
                {page === "projects"
                  ? "Projects"
                  : selectedProject?.name || "All issues"}
                <span className="rounded-[5px] border border-[#34343b] px-1.5 py-[3px] text-[11px] font-normal tracking-normal text-[#91909b]">
                  {page === "projects" ? state.projects.length : issues.length}
                </span>
              </h1>
              <p>
                {page === "projects"
                  ? "Big ideas, broken down into great work."
                  : selectedProject?.description ||
                    "A shared view of what’s next, what’s moving, and what’s done."}
              </p>
            </div>
            <Button
              className="max-[700px]:gap-0 max-[700px]:p-[9px] max-[700px]:text-[0px] max-[700px]:[&_kbd]:hidden border border-[#c0b0f9] shadow-[0_1px_3px_#0004] [&_kbd]:ml-2.5 [&_kbd]:rounded-[3px] [&_kbd]:border [&_kbd]:border-[#9987ca] [&_kbd]:px-1 [&_kbd]:text-[#665580] [&_kbd:empty]:hidden"
              onClick={() =>
                page === "projects" ? setProjectDialog(true) : createIssue()
              }
            >
              <Plus size={15} />
              {page === "projects" ? "New project" : "New issue"}
              <kbd>{page === "projects" ? "" : "C"}</kbd>
            </Button>
          </div>
        </section>
        <div className="relative flex h-14 shrink-0 items-center justify-between gap-2.5 border-y border-t-[#222327] px-[34px] max-[1200px]:px-6 max-[700px]:px-4">
          <div className="flex items-center gap-1">
            {page === "issues" ? (
              <>
                <Button
                  variant="ghost"
                  size="none"
                  data-active={view === "board"}
                  className="flex items-center gap-[7px] rounded-[5px] px-2.5 py-1.5 text-[11px] font-normal text-[#82838d] data-[active=true]:bg-[#29292f] data-[active=true]:text-[#dedde6] data-[active=true]:shadow-[inset_0_0_0_1px_#38373f]"
                  onClick={() => setView("board")}
                >
                  <LayoutGrid size={14} /> Board
                </Button>
                <Button
                  variant="ghost"
                  size="none"
                  data-active={view === "list"}
                  className="flex items-center gap-[7px] rounded-[5px] px-2.5 py-1.5 text-[11px] font-normal text-[#82838d] data-[active=true]:bg-[#29292f] data-[active=true]:text-[#dedde6] data-[active=true]:shadow-[inset_0_0_0_1px_#38373f]"
                  onClick={() => setView("list")}
                >
                  <List size={15} /> List
                </Button>
              </>
            ) : (
              <span className="flex items-center gap-2 text-[11px] text-[#b0acbc]">
                <Folder size={15} /> All projects
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 max-[700px]:gap-2.5">
            <div className="flex items-center gap-2 text-[#73747f] [&_kbd]:text-[9px] max-[700px]:[&_kbd]:hidden">
              <Search size={14} />
              <Input
                className="h-auto w-[126px] rounded-none border-0 p-0 text-[11px] shadow-none placeholder:text-[#71727c] focus-visible:ring-0 md:text-[11px] max-[700px]:w-[100px]"
                ref={searchRef}
                aria-label="Search workspace"
                placeholder={
                  page === "issues" ? "Search issues…" : "Search projects…"
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>⌘ K</kbd>
            </div>
            {page === "issues" && (
              <Button
                variant="ghost"
                size="none"
                className={cn(
                  "flex items-center gap-[7px] rounded-[5px] border border-[#34343b] px-[9px] py-1.5 text-[10px] font-normal text-[#a5a4af]",
                  priority && "border-[#8d79b7] text-[#c9b6ff]",
                )}
                onClick={() => setFilters(!filters)}
              >
                <SlidersHorizontal size={14} /> Filter{" "}
                {priority && <span>1</span>}
              </Button>
            )}
          </div>
          {filters && page === "issues" && (
            <div className="absolute top-12 right-[34px] z-5 grid gap-3 rounded-lg border border-[#42404c] bg-[#25252c] p-4 text-[11px] shadow-[0_12px_30px_#0005]">
              <strong>Filter by priority</strong>
              <NativeSelect
                className="h-auto rounded-[5px] bg-muted p-[7px] pr-8 text-[10px] text-[#bcb6cb]"
                aria-label="Filter priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">All priorities</option>
                {["Urgent", "High", "Medium", "Low", "No priority"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </NativeSelect>
            </div>
          )}
        </div>
        {page === "issues" ? (
          <IssueViews
            view={view}
            members={state.members}
            issues={issues}
            dragEnd={dragEnd}
            createIssue={createIssue}
            setEditing={setEditing}
            renderCard={renderCard}
          />
        ) : (
          <ProjectsGrid
            projects={state.projects}
            issues={state.issues}
            query={query}
            onOpen={(id) => navigate("issues", id)}
            onCreate={() => setProjectDialog(true)}
          />
        )}
        <footer className="mt-auto flex items-center justify-between gap-5 px-8 py-[17px] text-[9px] text-[#62636b] max-[700px]:px-5 max-[700px]:py-4 [&>span]:flex [&>span]:items-center [&>span]:gap-2 max-[1200px]:[&>span:last-child]:hidden">
          <span>
            <span className="text-sm text-[#77717f]">◒</span> A little more
            focused. A little further forward.
          </span>
          <span>
            {page === "issues"
              ? "Drag issues to update their status"
              : "Build something that matters"}
            <span className="mx-1 text-[#474750]">·</span> Saved on this device
          </span>
        </footer>
      </main>
      {editing && (
        <IssueDialog
          key={editing.id}
          issue={editing}
          projects={state.projects}
          members={state.members}
          pending={saving}
          existing={state.issues.some((i) => i.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(issue) =>
            persist(async () => {
              await state.saveIssue(issue);
              setEditing(null);
            }, "Issue saved")
          }
          onDelete={() =>
            persist(async () => {
              await state.deleteIssue(editing.id);
              setEditing(null);
            }, "Issue deleted")
          }
        />
      )}
      {projectDialog && (
        <ProjectDialog
          onClose={() => setProjectDialog(false)}
          pending={saving}
          onSave={(project) =>
            persist(async () => {
              await state.createProject(project);
              setProjectDialog(false);
              navigate("issues", project.id);
            }, "Project created")
          }
        />
      )}
    </div>
  );
}
