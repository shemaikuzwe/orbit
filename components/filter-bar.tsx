"use client";
import { Plus, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Issue } from "@/lib/workspace";
import type { PropertyOption } from "./property-select";

export type Filters = Record<
  "assignee" | "priority" | "label" | "project",
  string[]
>;
export const noFilters: Filters = {
  assignee: [],
  priority: [],
  label: [],
  project: [],
};
const names: Record<keyof Filters, string> = {
  assignee: "Assignee",
  priority: "Priority",
  label: "Label",
  project: "Project",
};

export function matchesFilters(issue: Issue, filters: Filters) {
  const values: Record<keyof Filters, string> = {
    assignee: issue.assignee,
    priority: issue.priority,
    label: issue.label,
    project: issue.projectId,
  };
  return (Object.keys(filters) as (keyof Filters)[]).every(
    (key) => !filters[key].length || filters[key].includes(values[key]),
  );
}

export function FilterBar({
  filters,
  options,
  fields,
  onChange,
}: {
  filters: Filters;
  options: Record<keyof Filters, PropertyOption[]>;
  /** Fields that make sense on the current page. */
  fields: (keyof Filters)[];
  onChange: (filters: Filters) => void;
}) {
  const active = fields.filter((key) => filters[key].length);
  return (
    <div className="flex min-h-10 shrink-0 flex-wrap items-center gap-1.5 border-b px-4 py-1.5 text-xs">
      {active.map((key) => (
        <span
          key={key}
          className="inline-flex h-6 items-center gap-1 rounded-md border border-input pl-2 text-soft-foreground"
        >
          {names[key]} is
          <strong className="max-w-48 truncate font-medium text-foreground">
            {filters[key]
              .map(
                (value) =>
                  options[key].find((option) => option.value === value)
                    ?.label ?? "Unknown",
              )
              .join(", ")}
          </strong>
          <button
            type="button"
            aria-label={`Clear ${names[key]} filter`}
            className="grid size-6 place-items-center rounded-r-md text-muted-foreground hover:bg-hover hover:text-foreground"
            onClick={() => onChange({ ...filters, [key]: [] })}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-6 items-center gap-1 rounded-md border border-dashed border-input px-2 text-muted-foreground hover:bg-hover hover:text-foreground">
          <Plus size={12} /> Filter
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {fields.map((key) => (
            <DropdownMenuSub key={key}>
              <DropdownMenuSubTrigger className="text-xs">
                {names[key]}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-72 w-52 overflow-y-auto">
                {options[key].map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    className="text-xs"
                    checked={filters[key].includes(option.value)}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(checked) =>
                      onChange({
                        ...filters,
                        [key]: checked
                          ? [...filters[key], option.value]
                          : filters[key].filter((v) => v !== option.value),
                      })
                    }
                  >
                    {option.icon}
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {active.length > 0 && (
        <button
          type="button"
          className="ml-1 text-muted-foreground hover:text-foreground"
          onClick={() => onChange(noFilters)}
        >
          Clear
        </button>
      )}
    </div>
  );
}
