"use client";
import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { labels, priorities, statuses } from "@/lib/domain";
import type { Project } from "@/lib/workspace";
import type { WorkspaceMember } from "@/lib/use-workspace";
import { PriorityIcon, StatusIcon } from "./issue-icons";
import { Avatar, labelColors } from "./issue-meta";

// Radix Select items can't use "" as a value, so empty values use this sentinel.
const NONE = "__none";

export type PropertyOption = { value: string; label: string; icon?: ReactNode };

/** A compact, borderless select used for inline issue and project fields. */
export function PropertySelect({
  label,
  value,
  options,
  onChange,
  className,
  disabled,
}: {
  label: string;
  value: string;
  options: PropertyOption[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  const current = options.find((option) => option.value === value);
  return (
    <Select
      value={value || NONE}
      disabled={disabled}
      onValueChange={(next) => onChange(next === NONE ? "" : next)}
    >
      <SelectTrigger
        size="sm"
        aria-label={label}
        className={cn(
          "h-7 w-auto min-w-0 gap-1.5 rounded-md border-0 bg-transparent px-1.5 text-xs font-normal text-foreground shadow-none hover:bg-hover dark:bg-transparent dark:hover:bg-hover [&>svg:last-child]:hidden",
          className,
        )}
      >
        {current?.icon}
        <span className="truncate">{current?.label ?? "None"}</span>
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {options.map((option) => (
          <SelectItem
            key={option.value || NONE}
            value={option.value || NONE}
            className="text-xs"
          >
            {option.icon}
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Option lists shared by the issue panel, create dialog and filters. */
export function issueOptions(
  members: WorkspaceMember[],
  projects: Pick<Project, "id" | "name" | "color">[],
) {
  return {
    status: statuses.map((s) => ({
      value: s,
      label: s,
      icon: <StatusIcon status={s} />,
    })),
    priority: [...priorities].reverse().map((p) => ({
      value: p,
      label: p,
      icon: <PriorityIcon priority={p} />,
    })),
    assignee: [
      { value: "", label: "Unassigned" },
      ...members.map((m) => ({
        value: m.id,
        label: m.name,
        icon: <Avatar id={m.id} name={m.name} className="size-4 text-[7px]" />,
      })),
    ],
    project: [
      { value: "", label: "No project" },
      ...projects.map((p) => ({
        value: p.id,
        label: p.name,
        icon: (
          <i
            className="size-2 shrink-0 rounded-[2px]"
            style={{ background: p.color }}
          />
        ),
      })),
    ],
    label: labels.map((l) => ({
      value: l,
      label: l,
      icon: (
        <i
          className="size-1.5 shrink-0 rounded-full"
          style={{ background: labelColors[l] }}
        />
      ),
    })),
  };
}
