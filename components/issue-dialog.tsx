"use client";
import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Issue, Project } from "@/lib/workspace";
import type { WorkspaceMember } from "@/lib/use-workspace";
import { issueOptions, PropertySelect } from "./property-select";

/** Creates an issue. Existing issues are edited in the side panel. */
export default function IssueDialog({
  issue: initial,
  parent,
  projects,
  members,
  pending,
  onClose,
  onSave,
}: {
  issue: Issue;
  parent?: Issue;
  projects: Project[];
  members: WorkspaceMember[];
  pending: boolean;
  onClose: () => void;
  onSave: (issue: Issue) => void;
}) {
  const [issue, setIssue] = useState(initial);
  const options = issueOptions(members, projects);
  const set = (patch: Partial<Issue>) => setIssue({ ...issue, ...patch });
  const pill = "h-7 border border-input px-2";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="top-[18%] w-[640px] max-w-[calc(100%-32px)] translate-y-0 gap-0 overflow-hidden rounded-xl bg-popover p-0 shadow-[0_30px_100px_#0007] sm:max-w-[640px]"
      >
        <DialogTitle className="sr-only">New issue</DialogTitle>
        <DialogDescription className="sr-only">
          Describe the issue and set its properties.
        </DialogDescription>
        <form
          aria-busy={pending}
          onSubmit={(e) => {
            e.preventDefault();
            if (!pending && issue.title.trim())
              onSave({ ...issue, title: issue.title.trim() });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
              e.currentTarget.requestSubmit();
          }}
        >
          <div className="flex items-center gap-2 px-4 pt-3 text-xs text-muted-foreground">
            {parent ? (
              <span className="truncate">
                New sub-issue of{" "}
                <span className="text-foreground">
                  {parent.identifier} {parent.title}
                </span>
              </span>
            ) : (
              "New issue"
            )}
            <button
              type="button"
              className="ml-auto grid size-7 place-items-center rounded-md hover:bg-hover hover:text-foreground"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={15} />
            </button>
          </div>
          <div className="px-4 pb-3">
            <input
              className="w-full bg-transparent py-1 text-lg font-semibold outline-none placeholder:text-faint-foreground"
              aria-label="Issue title"
              placeholder="Issue title"
              value={issue.title}
              onChange={(e) => set({ title: e.target.value })}
              required
              autoFocus
              maxLength={180}
            />
            <textarea
              className="field-sizing-content mt-1 min-h-24 w-full resize-none bg-transparent text-[13px] leading-relaxed outline-none placeholder:text-faint-foreground"
              aria-label="Issue description"
              placeholder="Add a description…"
              value={issue.description}
              onChange={(e) => set({ description: e.target.value })}
            />
            <fieldset disabled={pending} className="flex flex-wrap gap-1.5">
              <PropertySelect
                className={pill}
                label="Status"
                value={issue.status}
                options={options.status}
                onChange={(v) => set({ status: v as Issue["status"] })}
              />
              <PropertySelect
                className={pill}
                label="Priority"
                value={issue.priority}
                options={options.priority}
                onChange={(v) => set({ priority: v as Issue["priority"] })}
              />
              <PropertySelect
                className={pill}
                label="Assignee"
                value={issue.assignee}
                options={options.assignee}
                onChange={(assignee) => set({ assignee })}
              />
              <PropertySelect
                className={pill}
                label="Project"
                value={issue.projectId}
                options={options.project}
                onChange={(projectId) => set({ projectId })}
              />
              <PropertySelect
                className={pill}
                label="Label"
                value={issue.label}
                options={options.label}
                onChange={(label) => set({ label })}
              />
              <input
                type="date"
                aria-label="Due date"
                className={`${pill} rounded-md bg-transparent text-xs text-soft-foreground`}
                value={issue.dueDate}
                onChange={(e) => set({ dueDate: e.target.value })}
              />
            </fieldset>
          </div>
          <footer className="flex items-center justify-end gap-3 border-t px-4 py-3">
            <span className="mr-auto text-[11px] text-muted-foreground max-sm:hidden">
              <kbd className="rounded-[3px] border px-1">⌘↵</kbd> to create
            </span>
            <Button type="submit" disabled={pending || !issue.title.trim()}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Create issue
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
