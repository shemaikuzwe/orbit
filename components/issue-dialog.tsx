"use client";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { X, Trash2, ChevronRight, Loader2 } from "lucide-react";
import type { Issue, Project, Priority } from "@/lib/workspace";
import { statuses, priorities } from "@/lib/domain";
import type { WorkspaceMember } from "@/lib/use-workspace";
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
        className="w-[720px] max-w-[calc(100%-32px)] gap-0 overflow-hidden rounded-[11px] border-[#424049] bg-popover p-0 shadow-[0_30px_120px_#0009] sm:max-w-[720px]"
      >
        <DialogTitle className="sr-only">
          {existing ? issue.id : "New issue"}
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
            onSave({
              ...issue,
              title: String(data.get("title")).trim(),
              description: String(data.get("description")),
              status: data.get("status") as Issue["status"],
              priority: data.get("priority") as Priority,
              projectId: String(data.get("projectId")),
              assignee: String(data.get("assignee")),
              label: String(data.get("label")),
            });
          }}
        >
          <div className="flex h-[59px] items-center gap-[9px] border-b border-[#313037] px-[23px] text-[11px] text-[#a8a3b6]">
            <span className="inline-grid size-[18px] place-items-center rounded border border-[#494259] bg-[#333043] text-[10px] font-semibold text-[#c1b4e7]">
              O
            </span>{" "}
            Orbit <ChevronRight size={13} />
            <span>{existing ? issue.id : "New issue"}</span>
            <Button
              variant="ghost"
              size="none"
              type="button"
              className="ml-auto inline-flex size-[25px] items-center justify-center rounded text-[#7d7e88] hover:bg-[#303137] hover:text-[#eeeeee]"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} />
            </Button>
          </div>
          <div className="px-7 pt-[27px] pb-[30px] max-[700px]:p-[22px]">
            <Input
              className="h-auto rounded-none border-0 bg-transparent p-0 text-[23px] font-medium tracking-[-.5px] shadow-none placeholder:text-[#73707c] focus-visible:ring-0 md:text-[23px] max-[700px]:text-xl"
              name="title"
              aria-label="Issue title"
              placeholder="Issue title"
              defaultValue={issue.title}
              required
              autoFocus
              maxLength={180}
            />
            <Textarea
              className="my-5 block h-[175px] resize-y rounded-none border-0 bg-transparent p-0 text-[13px] leading-[1.9] text-[#b9b6c2] shadow-none placeholder:text-[#77737f] focus-visible:ring-0 md:text-[13px]"
              name="description"
              aria-label="Issue description"
              placeholder="Add a description…"
              defaultValue={issue.description}
            />
            <fieldset disabled={pending} className="flex flex-wrap gap-2">
              <NativeSelect
                className="h-auto rounded-[5px] bg-muted p-[7px] pr-8 text-[10px] text-[#bcb6cb]"
                aria-label="Status"
                name="status"
                defaultValue={issue.status}
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </NativeSelect>
              <NativeSelect
                className="h-auto rounded-[5px] bg-muted p-[7px] pr-8 text-[10px] text-[#bcb6cb]"
                aria-label="Priority"
                name="priority"
                defaultValue={issue.priority}
              >
                {priorities.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </NativeSelect>
              <NativeSelect
                className="h-auto rounded-[5px] bg-muted p-[7px] pr-8 text-[10px] text-[#bcb6cb]"
                aria-label="Assignee"
                name="assignee"
                defaultValue={issue.assignee}
              >
                <option value="">Unassigned</option>
                {issue.assignee &&
                  !members.some((member) => member.id === issue.assignee) && (
                    <option value={issue.assignee}>Team member</option>
                  )}
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                className="h-auto rounded-[5px] bg-muted p-[7px] pr-8 text-[10px] text-[#bcb6cb]"
                aria-label="Project"
                name="projectId"
                defaultValue={issue.projectId}
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                className="h-auto rounded-[5px] bg-muted p-[7px] pr-8 text-[10px] text-[#bcb6cb]"
                aria-label="Label"
                name="label"
                defaultValue={issue.label}
              >
                {["Feature", "Design", "Improvement", "Research", "Bug"].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </NativeSelect>
            </fieldset>
          </div>
          <footer className="flex items-center justify-end gap-3 border-t border-[#333139] px-[23px] py-4 [&>span]:mr-auto [&>span]:text-[10px] [&>span]:text-[#77727f] max-[700px]:[&>span]:hidden">
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
                className="inline-flex size-[25px] items-center justify-center rounded text-[#7d7e88] hover:bg-[#303137] hover:text-destructive"
                aria-label="Delete issue"
                disabled={pending}
                onClick={onDelete}
              >
                <Trash2 size={16} />
              </Button>
            )}
            <Button
              className="border border-[#c0b0f9] shadow-[0_1px_3px_#0004] [&_kbd]:ml-2.5 [&_kbd]:rounded-[3px] [&_kbd]:border [&_kbd]:border-[#9987ca] [&_kbd]:px-1 [&_kbd]:text-[#665580] [&_kbd:empty]:hidden"
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
