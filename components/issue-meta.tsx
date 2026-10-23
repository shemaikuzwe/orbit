import { cn } from "@/lib/utils";

const avatarColors: Record<string, string> = {
  JL: "bg-[#3d3c51] text-[#c3bee4]",
  AM: "bg-[#4a3d35] text-[#d3b49e]",
  SK: "bg-[#324740] text-[#a6cabc]",
};
const labelColors: Record<string, string> = {
  Feature: "text-[#a6a2b3] [&>i]:bg-[#b69add]",
  Design: "text-[#bea0a8] [&>i]:bg-[#db9c9f]",
  Improvement: "text-[#9eb3b7] [&>i]:bg-[#90b7bc]",
  Research: "text-[#a6a2b3] [&>i]:bg-[#c5b17e]",
  Bug: "text-[#a6a2b3] [&>i]:bg-[#e88680]",
};
export function IssueAvatar({
  assignee,
  small = false,
}: {
  assignee: string;
  small?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-[23px] shrink-0 items-center justify-center rounded-full border border-white/5 bg-[#353238] text-[8px] font-semibold text-[#b9afc6]",
        avatarColors[assignee],
        small && "size-5 text-[7px]",
      )}
    >
      {assignee || "–"}
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
