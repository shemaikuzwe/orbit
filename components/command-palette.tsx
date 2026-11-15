"use client";
import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Issue } from "@/lib/workspace";
import { StatusIcon } from "./issue-icons";

export type Command = {
  id: string;
  group: "Actions" | "Go to" | "Issues";
  label: string;
  icon?: ReactNode;
  hint?: string;
  shortcut?: string;
  run: () => void;
};

/** One searchable list of actions, pages and issues behind ⌘K. */
export default function CommandPalette({
  commands,
  issues,
  onOpenIssue,
  onClose,
}: {
  commands: Command[];
  issues: Issue[];
  onOpenIssue: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const needle = query.trim().toLowerCase();
  const issueCommands: Command[] = issues
    .filter((issue) =>
      `${issue.identifier} ${issue.title}`.toLowerCase().includes(needle),
    )
    .slice(0, needle ? 20 : 5)
    .map((issue) => ({
      id: issue.id,
      group: "Issues",
      label: issue.title,
      hint: issue.identifier,
      icon: <StatusIcon status={issue.status} />,
      run: () => onOpenIssue(issue.id),
    }));
  const results = [
    ...commands.filter((c) => c.label.toLowerCase().includes(needle)),
    ...issueCommands,
  ];
  const current = Math.min(active, results.length - 1);

  function run(command: Command | undefined) {
    if (!command) return;
    onClose();
    command.run();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="top-[15%] w-[560px] max-w-[calc(100%-32px)] translate-y-0 gap-0 overflow-hidden rounded-xl bg-popover p-0 shadow-[0_30px_100px_#0007] sm:max-w-[560px]"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search issues, pages and actions.
        </DialogDescription>
        <div className="flex items-center gap-2 border-b px-4">
          <Search size={15} className="text-muted-foreground" />
          <input
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls="command-results"
            aria-activedescendant={results[current]?.id}
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-faint-foreground"
            placeholder="Type a command or search issues…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const step = e.key === "ArrowDown" ? 1 : -1;
                setActive((current + step + results.length) % results.length);
              }
              if (e.key === "Enter") {
                e.preventDefault();
                run(results[current]);
              }
            }}
          />
        </div>
        <ul
          id="command-results"
          role="listbox"
          className="max-h-[360px] overflow-y-auto p-1.5"
        >
          {results.length === 0 && (
            <li className="p-6 text-center text-[13px] text-muted-foreground">
              No results
            </li>
          )}
          {results.map((command, index) => (
            <li key={command.id} role="presentation">
              {command.group !== results[index - 1]?.group && (
                <div className="px-2.5 pt-2 pb-1 text-[11px] text-faint-foreground">
                  {command.group}
                </div>
              )}
              <div
                id={command.id}
                role="option"
                aria-selected={index === current}
                className={cn(
                  "flex h-9 cursor-default items-center gap-2.5 rounded-md px-2.5 text-[13px] text-soft-foreground",
                  index === current && "bg-accent text-foreground",
                )}
                onMouseMove={() => setActive(index)}
                onClick={() => run(command)}
              >
                {command.icon}
                {command.hint && (
                  <span className="text-[11px] text-faint-foreground tabular-nums">
                    {command.hint}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{command.label}</span>
                {command.shortcut && (
                  <kbd className="rounded-[3px] border px-1">
                    {command.shortcut}
                  </kbd>
                )}
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
