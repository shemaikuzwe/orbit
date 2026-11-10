"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { X, Trash2, Loader2 } from "lucide-react";
import type { Issue, Project, Priority } from "@/lib/workspace";
import { statuses, priorities } from "@/lib/domain";
import type { WorkspaceMember } from "@/lib/use-workspace";

// Radix Select items can't use "" as a value, so empty fields use this sentinel.
const NONE = "none";

function IssueSelect({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select name={name} defaultValue={defaultValue || NONE}>
      <SelectTrigger
        size="sm"
        aria-label={label}
        className="h-auto rounded-[5px] bg-muted p-[7px] text-[10px] text-soft-foreground"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function IssueDialog({
  issue,
  projects,
  members,
  pending,
  existing,
  onClose,
  onSave,
  onDelete,
}: {
  issue: Issue;
  projects: Project[];
  members: WorkspaceMember[];
  pending: boolean;
  existing: boolean;
  onClose: () => void;
  onSave: (issue: Issue) => void;
  onDelete: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="w-[720px] max-w-[calc(100%-32px)] gap-0 overflow-hidden rounded-[11px] border-input bg-popover p-0 shadow-[0_30px_120px_#0009] sm:max-w-[720px]"
      >
        <DialogTitle className="sr-only">
          {existing ? "Edit issue" : "New issue"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Edit issue details, status, priority, and project.
        </DialogDescription>
        <form
          aria-busy={pending}
          onSubmit={(e) => {
            e.preventDefault();
            if (pending) return;
            const data = new FormData(e.currentTarget);
            const optional = (v: FormDataEntryValue | null) =>
              v === NONE ? "" : String(v);
            onSave({
              ...issue,
              title: String(data.get("title")).trim(),
              description: String(data.get("description")),
              status: data.get("status") as Issue["status"],
              priority: data.get("priority") as Priority,
              projectId: optional(data.get("projectId")),
              assignee: optional(data.get("assignee")),
              label: String(data.get("label")),
            });
          }}
        >
          <div className="flex h-[59px] items-center gap-[9px] border-b border-border px-[23px] text-[11px] text-soft-foreground">
            <Button
              variant="ghost"
              size="none"
              type="button"
              className="ml-auto inline-flex size-[25px] items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} />
            </Button>
          </div>
          <div className="px-7 pt-[27px] pb-[30px] max-[700px]:p-[22px]">
            <Input
              className="h-auto rounded-none border-0 bg-transparent p-0 text-[23px] font-medium tracking-[-.5px] shadow-none placeholder:text-faint-foreground focus-visible:ring-0 md:text-[23px] max-[700px]:text-xl"
              name="title"
              aria-label="Issue title"
              placeholder="Issue title"
              defaultValue={issue.title}
              required
              autoFocus
              maxLength={180}
            />
            <Textarea
              className="my-5 block h-[175px] resize-y rounded-none border-0 bg-transparent p-0 text-[13px] leading-[1.9] text-soft-foreground shadow-none placeholder:text-faint-foreground focus-visible:ring-0 md:text-[13px]"
              name="description"
              aria-label="Issue description"
              placeholder="Add a description…"
              defaultValue={issue.description}
            />
            <fieldset disabled={pending} className="flex flex-wrap gap-2">
              <IssueSelect
                name="status"
                label="Status"
                defaultValue={issue.status}
                options={statuses.map((s) => ({ value: s, label: s }))}
              />
              <IssueSelect
                name="priority"
                label="Priority"
                defaultValue={issue.priority}
                options={priorities.map((s) => ({ value: s, label: s }))}
              />
              <IssueSelect
                name="assignee"
                label="Assignee"
                defaultValue={issue.assignee}
                options={[
                  { value: NONE, label: "Unassigned" },
                  ...(issue.assignee &&
                  !members.some((member) => member.id === issue.assignee)
                    ? [{ value: issue.assignee, label: "Team member" }]
                    : []),
                  ...members.map((m) => ({ value: m.id, label: m.name })),
                ]}
              />
              <IssueSelect
                name="projectId"
                label="Project"
                defaultValue={issue.projectId}
                options={[
                  { value: NONE, label: "No project" },
                  ...projects.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
              <IssueSelect
                name="label"
                label="Label"
                defaultValue={issue.label}
                options={[
                  "Feature",
                  "Design",
                  "Improvement",
                  "Research",
                  "Bug",
                ].map((s) => ({ value: s, label: s }))}
              />
            </fieldset>
          </div>
          <footer className="flex items-center justify-end gap-3 border-t border-border px-[23px] py-4 [&>span]:mr-auto [&>span]:text-[10px] [&>span]:text-muted-foreground max-[700px]:[&>span]:hidden">
            <span>
              {existing
                ? "Changes are saved locally and synced"
                : "A good idea starts with an issue."}
            </span>
            {existing && (
              <Button
                variant="ghost"
                size="none"
                type="button"
                className="inline-flex size-[25px] items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-destructive"
                aria-label="Delete issue"
                disabled={pending}
                onClick={onDelete}
              >
                <Trash2 size={16} />
              </Button>
            )}
            <Button
              className="border border-white/15 shadow-[0_1px_3px_#0004] [&_kbd]:ml-2.5 [&_kbd]:rounded-[3px] [&_kbd]:border [&_kbd]:border-primary-foreground/25 [&_kbd]:px-1 [&_kbd]:text-primary-foreground/60 [&_kbd:empty]:hidden"
              type="submit"
              disabled={pending}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {existing ? "Save changes" : "Create issue"} <span>↵</span>
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
