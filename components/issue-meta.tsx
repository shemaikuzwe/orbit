import { cn } from "@/lib/utils";
import type { WorkspaceMember } from "@/lib/use-workspace";
const labelColors: Record<string, string> = {
  Feature: "text-[#a6a2b3] [&>i]:bg-[#b69add]",
  Design: "text-[#bea0a8] [&>i]:bg-[#db9c9f]",
  Improvement: "text-[#9eb3b7] [&>i]:bg-[#90b7bc]",
  Research: "text-[#a6a2b3] [&>i]:bg-[#c5b17e]",
  Bug: "text-[#a6a2b3] [&>i]:bg-[#e88680]",
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
        "inline-flex size-[23px] shrink-0 items-center justify-center rounded-full border border-white/5 bg-[#353238] text-[8px] font-semibold text-[#b9afc6]",
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
        "inline-flex items-center gap-[5px] whitespace-nowrap rounded border border-[#37363e] px-[5px] py-0.5 text-[9px] [&>i]:size-1 [&>i]:rounded-full",
        labelColors[label],
        className,
      )}
    >
      <i />
      {label}
    </span>
  );
}
