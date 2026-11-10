"use client";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IssueAvatar, IssueLabel } from "./issue-meta";
import { Plus } from "lucide-react";
import type { Issue, Status } from "@/lib/workspace";
import { statuses } from "@/lib/domain";
import type { WorkspaceMember } from "@/lib/use-workspace";
import { StatusIcon, PriorityIcon } from "./issue-icons";
export default function IssueViews({
  view,
  members,
  issues,
  dragEnd,
  createIssue,
  setEditing,
  renderCard,
}: {
  view: "board" | "list";
  issues: Issue[];
  members: WorkspaceMember[];
  dragEnd: (result: DropResult) => void;
  createIssue: (status?: Status) => void;
  setEditing: (issue: Issue) => void;
  renderCard: (issue: Issue) => React.ReactNode;
}) {
  return view === "board" ? (
    <DragDropContext onDragEnd={dragEnd}>
      <div className="grid flex-1 grid-cols-[repeat(4,minmax(210px,1fr))] content-start gap-[21px] overflow-auto px-8 pt-[25px] pb-10 min-[1600px]:gap-[26px] max-[1200px]:grid-cols-[repeat(4,230px)] max-[1200px]:gap-3.5 max-[1200px]:p-[23px] max-[700px]:grid-cols-[repeat(4,250px)] max-[700px]:px-5 max-[700px]:py-[22px]">
        {statuses.map((status) => (
          <section className="min-w-0" key={status}>
            <div className="mx-[3px] mb-[17px] flex items-center gap-2 [&>h2]:text-[11px] [&>h2]:font-[550] [&>span]:ml-[3px] [&>span]:text-[10px] [&>span]:text-faint-foreground [&>button]:ml-auto">
              <StatusIcon status={status} />
              <h2>{status}</h2>
              <span>{issues.filter((i) => i.status === status).length}</span>
              <Button
                variant="ghost"
                size="none"
                className="inline-flex size-[25px] items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => createIssue(status)}
                aria-label={`Add issue to ${status}`}
              >
                <Plus size={15} />
              </Button>
            </div>
            <Droppable droppableId={status}>
              {(provided) => (
                <div
                  className="min-h-60"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {issues
                    .filter((i) => i.status === status)
                    .map((issue, index) => (
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
                              "mb-2.5 min-h-[123px] rounded-[7px] border border-border bg-card px-[13px] pt-[13px] pb-3 shadow-[0_2px_3px_#00000014] transition-colors hover:border-border-strong hover:bg-hover min-[1600px]:min-h-[140px] min-[1600px]:p-[17px]",
                              snapshot.isDragging &&
                                "border-primary shadow-[0_12px_35px_#0007]",
                            )}
                            onClick={() => setEditing(issue)}
                            aria-label={issue.title}
                          >
                            {renderCard(issue)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                  <Button
                    variant="ghost"
                    size="none"
                    className="flex w-full items-center justify-start gap-[7px] rounded-[5px] p-2 text-[10px] text-faint-foreground hover:bg-hover hover:text-soft-foreground"
                    onClick={() => createIssue(status)}
                  >
                    <Plus size={14} /> Add issue
                  </Button>
                </div>
              )}
            </Droppable>
          </section>
        ))}
      </div>
    </DragDropContext>
  ) : (
    <div className="flex-1 px-[34px] py-[22px]">
      {issues.length === 0 && (
        <p className="p-5 text-soft-foreground">No issues match your search.</p>
      )}
      {statuses.map((status) => (
        <section key={status}>
          <div className="mt-2 flex gap-[9px] bg-card px-2.5 py-3 text-[11px] [&>span]:ml-1 [&>span]:text-muted-foreground">
            <StatusIcon status={status} />
            {status}
            <span>{issues.filter((i) => i.status === status).length}</span>
          </div>
          {issues
            .filter((i) => i.status === status)
            .map((i) => (
              <Button
                variant="ghost"
                size="none"
                className="flex w-full items-center justify-start gap-[15px] rounded-none border-b border-border px-2.5 py-3.5 text-left text-[11px] hover:bg-hover max-[700px]:gap-[9px] [&>strong]:flex-1 [&>strong]:font-[450]"
                key={i.id}
                onClick={() => setEditing(i)}
              >
                <PriorityIcon priority={i.priority} />
                <strong>{i.title}</strong>
                <IssueLabel label={i.label} className="max-[700px]:hidden" />
                <IssueAvatar assignee={i.assignee} members={members} />
              </Button>
            ))}
        </section>
      ))}
    </div>
  );
}
