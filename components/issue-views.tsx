"use client";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Issue, Status } from "@/lib/workspace";
import { statuses } from "@/lib/domain";
import type { WorkspaceMember } from "@/lib/use-workspace";
import { DueDate, IssueAvatar, IssueLabel } from "./issue-meta";
import { StatusIcon, PriorityIcon } from "./issue-icons";

// Scrolls a keyboard-selected row into view without moving visible ones.
const reveal = (element: HTMLElement | null) =>
  element?.scrollIntoView({ block: "nearest" });

function Identifier({ issue }: { issue: Issue }) {
  return (
    <span className="w-14 shrink-0 text-[11px] text-faint-foreground tabular-nums">
      {issue.identifier || "—"}
    </span>
  );
}

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="m-6 flex flex-1 flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed p-10 text-center">
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-lg text-primary-foreground">
        ◒
      </span>
      <h2 className="text-sm font-semibold">No issues yet</h2>
      <p className="max-w-[28ch] text-[13px] leading-relaxed text-muted-foreground">
        Issues are the unit of work. Create the first one to start your board.
      </p>
      <Button className="mt-1" onClick={onCreate}>
        Create issue
        <kbd className="rounded-[3px] border border-primary-foreground/30 px-1 text-primary-foreground/70">
          C
        </kbd>
      </Button>
      <p className="text-[11px] text-muted-foreground">
        or press <kbd className="rounded-[3px] border px-1">⌘K</kbd> for
        everything else
      </p>
    </div>
  );
}

export default function IssueViews({
  view,
  members,
  issues,
  selectedId,
  dragEnd,
  createIssue,
  onSelect,
}: {
  view: "board" | "list";
  issues: Issue[];
  members: WorkspaceMember[];
  selectedId: string;
  dragEnd: (result: DropResult) => void;
  createIssue: (status?: Status) => void;
  onSelect: (issue: Issue) => void;
}) {
  if (view === "list")
    return (
      <div className="flex-1 pb-10">
        {issues.length === 0 && (
          <p className="p-6 text-[13px] text-muted-foreground">
            No issues match these filters.
          </p>
        )}
        {statuses.map((status) => {
          const group = issues.filter((i) => i.status === status);
          if (!group.length) return null;
          return (
            <section key={status}>
              <h2 className="sticky top-0 z-1 flex h-8 items-center gap-2 border-b bg-card px-4 text-xs font-medium">
                <StatusIcon status={status} />
                {status}
                <span className="font-normal text-muted-foreground">
                  {group.length}
                </span>
              </h2>
              {group.map((issue) => (
                <button
                  type="button"
                  key={issue.id}
                  ref={issue.id === selectedId ? reveal : undefined}
                  aria-current={issue.id === selectedId || undefined}
                  className="flex h-9 w-full items-center gap-2.5 border-b px-4 text-left text-[13px] hover:bg-hover aria-[current]:bg-accent"
                  onClick={() => onSelect(issue)}
                >
                  <PriorityIcon priority={issue.priority} />
                  <Identifier issue={issue} />
                  <span className="min-w-0 flex-1 truncate">{issue.title}</span>
                  <IssueLabel label={issue.label} className="max-lg:hidden" />
                  <DueDate date={issue.dueDate} className="max-sm:hidden" />
                  <IssueAvatar assignee={issue.assignee} members={members} />
                </button>
              ))}
            </section>
          );
        })}
      </div>
    );

  return (
    <DragDropContext onDragEnd={dragEnd}>
      <div className="grid flex-1 auto-cols-[minmax(240px,1fr)] grid-flow-col content-start gap-3 overflow-x-auto p-4">
        {statuses.map((status) => {
          const column = issues.filter((i) => i.status === status);
          return (
            <section className="min-w-0" key={status}>
              <div className="mb-2 flex h-7 items-center gap-2 px-1 text-xs font-medium">
                <StatusIcon status={status} />
                <h2>{status}</h2>
                <span className="font-normal text-muted-foreground">
                  {column.length}
                </span>
                <button
                  type="button"
                  className="ml-auto grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-hover hover:text-foreground"
                  onClick={() => createIssue(status)}
                  aria-label={`Add issue to ${status}`}
                >
                  <Plus size={14} />
                </button>
              </div>
              <Droppable droppableId={status}>
                {(provided) => (
                  <div
                    className="min-h-40"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {column.map((issue, index) => (
                      <Draggable
                        draggableId={issue.id}
                        index={index}
                        key={issue.id}
                      >
                        {(drag, snapshot) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            className={cn(
                              "mb-1.5 rounded-lg border bg-card p-2.5 shadow-[0_1px_2px_#0000000d] hover:border-border-strong",
                              issue.id === selectedId && "border-ring",
                              status === "Done" && "opacity-70",
                              snapshot.isDragging &&
                                "border-primary shadow-[0_12px_35px_#0005]",
                            )}
                            onClick={() => onSelect(issue)}
                            aria-label={issue.title}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-faint-foreground tabular-nums">
                                {issue.identifier || "Syncing…"}
                              </span>
                              <span className="flex-1" />
                              <PriorityIcon priority={issue.priority} />
                              <IssueAvatar
                                assignee={issue.assignee}
                                members={members}
                              />
                            </div>
                            <h3 className="mt-1.5 mb-2 text-[13px] leading-snug font-medium">
                              {issue.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <IssueLabel label={issue.label} />
                              <DueDate
                                date={issue.dueDate}
                                className="ml-auto"
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </section>
          );
        })}
      </div>
    </DragDropContext>
  );
}
