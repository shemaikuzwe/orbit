import { cn, formatDate, initials, isOverdue } from "@/lib/utils";
import type { WorkspaceMember } from "@/lib/use-workspace";
export const labelColors: Record<string, string> = {
  Feature: "#b69add",
  Design: "#db9c9f",
  Improvement: "#90b7bc",
  Research: "#c5b17e",
  Bug: "#e88680",
};
const avatarColors = ["#b5a5ef", "#8fc7b3", "#e8b48a", "#90b7bc", "#db9c9f"];

export function Avatar({
  id,
  name,
  className,
}: {
  id: string;
  name: string;
  className?: string;
}) {
  // A stable color per user keeps people recognizable across views.
  const hash = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (
    <span
      title={name}
      aria-label={name}
      className={cn(
        "inline-grid size-[18px] shrink-0 place-items-center rounded-full text-[8px] font-semibold text-[#17171a]",
        className,
      )}
      style={{ background: avatarColors[hash % avatarColors.length] }}
    >
      {initials(name) || "?"}
    </span>
  );
}

export function IssueAvatar({
  assignee,
  members = [],
  className,
}: {
  assignee: string;
  members?: WorkspaceMember[];
  className?: string;
}) {
  if (!assignee)
    return (
      <span
        title="Unassigned"
        aria-label="Unassigned"
        className={cn(
          "inline-block size-[18px] shrink-0 rounded-full border border-dashed border-border-strong",
          className,
        )}
      />
    );
  const name =
    members.find((member) => member.id === assignee)?.name ?? "Team member";
  return <Avatar id={assignee} name={name} className={className} />;
}

export function IssueLabel({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] whitespace-nowrap text-muted-foreground",
        className,
      )}
    >
      <i
        className="size-1.5 rounded-full"
        style={{ background: labelColors[label] ?? "var(--faint-foreground)" }}
      />
      {label}
    </span>
  );
}

export function DueDate({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  if (!date) return null;
  return (
    <span
      title={isOverdue(date) ? "Overdue" : "Due date"}
      className={cn(
        "text-[11px] whitespace-nowrap text-muted-foreground",
        isOverdue(date) && "text-destructive",
        className,
      )}
    >
      {formatDate(date)}
    </span>
  );
}
