import { cn } from "@/lib/utils";
import type { WorkspaceMember } from "@/lib/use-workspace";
const labelColors: Record<string, string> = {
  Feature: "text-soft-foreground [&>i]:bg-[#b69add]",
  Design: "text-soft-foreground [&>i]:bg-[#db9c9f]",
  Improvement: "text-soft-foreground [&>i]:bg-[#90b7bc]",
  Research: "text-soft-foreground [&>i]:bg-[#c5b17e]",
  Bug: "text-soft-foreground [&>i]:bg-[#e88680]",
};
export function IssueAvatar({
  assignee,
  members = [],
  small = false,
}: {
  assignee: string;
  members?: WorkspaceMember[];
  small?: boolean;
}) {
  const name = members.find((member) => member.id === assignee)?.name;
  const initials = name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span
      title={name || (assignee ? "Team member" : "Unassigned")}
      aria-label={name || (assignee ? "Team member" : "Unassigned")}
      className={cn(
        "inline-flex size-[23px] shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-[8px] font-semibold text-soft-foreground",
        small && "size-5 text-[7px]",
      )}
    >
      {initials || (assignee ? "?" : "–")}
    </span>
  );
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
        "inline-flex items-center gap-[5px] whitespace-nowrap rounded border border-border px-[5px] py-0.5 text-[9px] [&>i]:size-1 [&>i]:rounded-full",
        labelColors[label],
        className,
      )}
    >
      <i />
      {label}
    </span>
  );
}
