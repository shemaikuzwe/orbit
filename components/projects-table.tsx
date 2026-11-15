"use client";
import { Plus } from "lucide-react";
import { healths } from "@/lib/domain";
import type { WorkspaceMember } from "@/lib/use-workspace";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import type { Health, Issue, Project } from "@/lib/workspace";
import { issueOptions, PropertySelect } from "./property-select";

const healthColors: Record<Health, string> = {
  Planned: "bg-faint-foreground",
  "On track": "bg-emerald-500",
  "At risk": "bg-amber-500",
  "Off track": "bg-destructive",
};
const columns =
  "grid grid-cols-[minmax(160px,1.6fr)_120px_minmax(120px,1fr)_minmax(110px,.8fr)_80px_56px] items-center gap-3";

export default function ProjectsTable({
  projects,
  issues,
  members,
  onOpen,
  onCreate,
  onSave,
}: {
  projects: Project[];
  issues: Issue[];
  members: WorkspaceMember[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onSave: (project: Project) => void;
}) {
  const leads = issueOptions(members, []).assignee.map((option) =>
    option.value ? option : { ...option, label: "No lead" },
  );
  // Projects with a target date first, soonest at the top.
  const sorted = [...projects].sort(
    (a, b) =>
      Number(!a.target) - Number(!b.target) || a.target.localeCompare(b.target),
  );
  if (!projects.length)
    return (
      <button
        type="button"
        className="m-6 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-[13px] text-soft-foreground hover:bg-hover"
        onClick={onCreate}
      >
        <Plus size={20} /> Create a project
        <span className="text-xs text-muted-foreground">
          Group related issues and track progress toward a target date.
        </span>
      </button>
    );
  return (
    <div className="flex-1 overflow-x-auto">
      <div className="min-w-[720px] px-4">
        <div
          className={cn(
            columns,
            "h-8 border-b px-2 text-[11px] text-muted-foreground",
          )}
        >
          <span>Name</span>
          <span>Health</span>
          <span>Progress</span>
          <span>Lead</span>
          <span>Target</span>
          <span className="text-right">Issues</span>
        </div>
        {sorted.map((project) => {
          const scoped = issues.filter((i) => i.projectId === project.id);
          const done = scoped.filter((i) => i.status === "Done").length;
          const percent = scoped.length
            ? Math.round((done / scoped.length) * 100)
            : 0;
          return (
            <div
              key={project.id}
              className={cn(columns, "h-11 border-b px-2 text-[13px]")}
            >
              <button
                type="button"
                className="flex min-w-0 items-center gap-2 text-left font-medium hover:underline"
                onClick={() => onOpen(project.id)}
              >
                <i
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ background: project.color }}
                />
                <span className="truncate">{project.name}</span>
              </button>
              <PropertySelect
                label={`${project.name} health`}
                value={project.health}
                options={healths.map((h) => ({
                  value: h,
                  label: h,
                  icon: (
                    <i
                      className={cn("size-1.5 rounded-full", healthColors[h])}
                    />
                  ),
                }))}
                onChange={(health) =>
                  onSave({ ...project, health: health as Health })
                }
              />
              <span className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${percent}%`, background: project.color }}
                  />
                </span>
                {percent}%
              </span>
              <PropertySelect
                label={`${project.name} lead`}
                value={project.leadId}
                options={leads}
                onChange={(leadId) => onSave({ ...project, leadId })}
              />
              <span
                className={cn(
                  "text-xs",
                  !project.target && "text-muted-foreground",
                  isOverdue(project.target) &&
                    percent < 100 &&
                    "text-destructive",
                )}
              >
                {project.target ? formatDate(project.target) : "—"}
              </span>
              <span className="text-right text-xs text-muted-foreground tabular-nums">
                {done} / {scoped.length}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
