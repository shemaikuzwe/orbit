"use client";
import { useState } from "react";
import { MoreHorizontal, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useIssueActivity, type WorkspaceMember } from "@/lib/use-workspace";
import { timeAgo } from "@/lib/utils";
import type { Issue, Project } from "@/lib/workspace";
import { StatusIcon } from "./issue-icons";
import { Avatar } from "./issue-meta";
import { issueOptions, PropertySelect } from "./property-select";

type Activity = ReturnType<typeof useIssueActivity>[number];

function describe(
  item: Extract<Activity, { type: "event" }>,
  name: (id: string | null) => string,
) {
  if (item.field === "created") return "created the issue";
  if (item.field === "assignee")
    return item.to_value
      ? `assigned it to ${name(item.to_value)}`
      : "removed the assignee";
  return `changed ${item.field} from ${item.from_value} to ${item.to_value}`;
}

function Property({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <span className="w-16 shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

export default function IssuePanel({
  issue,
  issues,
  members,
  projects,
  saving,
  onSave,
  onDelete,
  onClose,
  onSelect,
  onAddSubIssue,
  onComment,
}: {
  issue: Issue;
  issues: Issue[];
  members: WorkspaceMember[];
  projects: Project[];
  saving: boolean;
  onSave: (issue: Issue) => void;
  onDelete: () => void;
  onClose: () => void;
  onSelect: (id: string) => void;
  onAddSubIssue: () => void;
  onComment: (body: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);
  const [comment, setComment] = useState("");
  const activity = useIssueActivity(issue.id);
  const options = issueOptions(members, projects);
  const project = projects.find((p) => p.id === issue.projectId);
  const parent = issues.find((i) => i.id === issue.parentId);
  const children = issues.filter((i) => i.parentId === issue.id);
  const name = (id: string | null) =>
    members.find((m) => m.id === id)?.name ?? "Someone";
  const save = (patch: Partial<Issue>) => onSave({ ...issue, ...patch });

  async function submitComment() {
    const body = comment.trim();
    if (!body) return;
    setComment("");
    await onComment(body);
  }

  return (
    <aside
      aria-label="Issue details"
      className="flex w-[440px] shrink-0 flex-col overflow-y-auto border-l bg-background max-xl:w-[380px] max-[900px]:fixed max-[900px]:inset-0 max-[900px]:z-30 max-[900px]:w-auto"
    >
      <header className="sticky top-0 z-1 flex h-[38px] shrink-0 items-center gap-2 border-b bg-background px-4 text-xs text-muted-foreground">
        {project && (
          <>
            <i
              className="size-2 rounded-[2px]"
              style={{ background: project.color }}
            />
            <span className="max-w-32 truncate">{project.name}</span>
            <span className="text-faint-foreground">/</span>
          </>
        )}
        <span className="tabular-nums">{issue.identifier || "New issue"}</span>
        <span className="flex-1" />
        <span className="flex items-center gap-1.5 text-[11px]" role="status">
          <i
            className={`size-1.5 rounded-full ${saving ? "bg-sky-500" : "bg-emerald-500"}`}
          />
          {saving ? "Saving…" : "Saved"}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Issue actions"
            className="grid size-7 place-items-center rounded-md hover:bg-hover hover:text-foreground"
          >
            <MoreHorizontal size={15} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              className="text-xs"
              onSelect={onDelete}
            >
              <Trash2 /> Delete issue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          aria-label="Close issue"
          title="Close (Esc)"
          className="grid size-7 place-items-center rounded-md hover:bg-hover hover:text-foreground"
          onClick={onClose}
        >
          <X size={15} />
        </button>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {parent && (
          <button
            type="button"
            className="flex items-center gap-1.5 self-start text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onSelect(parent.id)}
          >
            Sub-issue of
            <span className="text-faint-foreground">{parent.identifier}</span>
            <span className="max-w-56 truncate text-foreground">
              {parent.title}
            </span>
          </button>
        )}
        <div>
          <textarea
            aria-label="Issue title"
            rows={1}
            className="field-sizing-content w-full resize-none bg-transparent text-lg leading-snug font-semibold tracking-[-0.2px] outline-none"
            value={title}
            maxLength={180}
            onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
            onBlur={() => {
              if (title.trim() && title.trim() !== issue.title)
                save({ title: title.trim() });
              else setTitle(issue.title);
            }}
          />
          <textarea
            aria-label="Issue description"
            placeholder="Add a description…"
            className="field-sizing-content mt-1 min-h-14 w-full resize-none bg-transparent text-[13px] leading-relaxed text-soft-foreground outline-none placeholder:text-faint-foreground"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              if (description !== issue.description) save({ description });
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-y py-3 max-sm:grid-cols-1">
          <Property label="Status">
            <PropertySelect
              label="Status"
              value={issue.status}
              options={options.status}
              onChange={(status) => save({ status: status as Issue["status"] })}
            />
          </Property>
          <Property label="Assignee">
            <PropertySelect
              label="Assignee"
              value={issue.assignee}
              options={options.assignee}
              onChange={(assignee) => save({ assignee })}
            />
          </Property>
          <Property label="Priority">
            <PropertySelect
              label="Priority"
              value={issue.priority}
              options={options.priority}
              onChange={(priority) =>
                save({ priority: priority as Issue["priority"] })
              }
            />
          </Property>
          <Property label="Due">
            <input
              type="date"
              aria-label="Due date"
              className="h-7 min-w-0 rounded-md bg-transparent px-1.5 text-xs hover:bg-hover"
              value={issue.dueDate}
              onChange={(e) => save({ dueDate: e.target.value })}
            />
          </Property>
          <Property label="Project">
            <PropertySelect
              label="Project"
              value={issue.projectId}
              options={options.project}
              onChange={(projectId) => save({ projectId })}
            />
          </Property>
          <Property label="Label">
            <PropertySelect
              label="Label"
              value={issue.label}
              options={options.label}
              onChange={(label) => save({ label })}
            />
          </Property>
        </div>

        {!issue.parentId && (
          <section>
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              Sub-issues
              {children.length > 0 && (
                <span className="text-faint-foreground">
                  {children.filter((c) => c.status === "Done").length} of{" "}
                  {children.length}
                </span>
              )}
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-hover hover:text-foreground"
                onClick={onAddSubIssue}
              >
                <Plus size={12} /> Add
              </button>
            </div>
            {children.map((child) => (
              <button
                type="button"
                key={child.id}
                className="flex h-8 w-full items-center gap-2 rounded-md px-1.5 text-left text-[13px] hover:bg-hover"
                onClick={() => onSelect(child.id)}
              >
                <StatusIcon status={child.status} />
                <span className="w-12 shrink-0 text-[11px] text-faint-foreground tabular-nums">
                  {child.identifier}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate ${child.status === "Done" ? "text-muted-foreground line-through" : ""}`}
                >
                  {child.title}
                </span>
              </button>
            ))}
          </section>
        )}

        <section className="flex flex-col gap-3 border-t pt-4">
          <h3 className="text-xs text-muted-foreground">Activity</h3>
          {activity.map((item) =>
            item.type === "event" ? (
              <p
                key={item.id}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Avatar
                  id={item.actor_id ?? ""}
                  name={name(item.actor_id)}
                  className="size-4 text-[7px]"
                />
                <span>
                  <span className="text-soft-foreground">
                    {name(item.actor_id)}
                  </span>{" "}
                  {describe(item, name)} · {timeAgo(item.created_at)}
                </span>
              </p>
            ) : (
              <article key={item.id} className="rounded-lg border bg-card p-3">
                <div className="mb-1.5 flex items-center gap-2 text-xs">
                  <Avatar
                    id={item.author_id ?? ""}
                    name={name(item.author_id)}
                    className="size-4 text-[7px]"
                  />
                  <span className="font-medium">{name(item.author_id)}</span>
                  <span className="text-muted-foreground">
                    {timeAgo(item.created_at)}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                  {item.body}
                </p>
              </article>
            ),
          )}
          <form
            className="rounded-lg border bg-card focus-within:border-ring"
            onSubmit={(e) => {
              e.preventDefault();
              void submitComment();
            }}
          >
            <Textarea
              aria-label="Comment"
              placeholder="Leave a comment…"
              className="field-sizing-content min-h-16 resize-none border-0 bg-transparent text-[13px] shadow-none focus-visible:ring-0 dark:bg-transparent"
              value={comment}
              maxLength={5000}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void submitComment();
                }
              }}
            />
            <div className="flex justify-end p-2 pt-0">
              <Button size="sm" disabled={!comment.trim()} className="h-7">
                Comment
              </Button>
            </div>
          </form>
        </section>
      </div>
    </aside>
  );
}
