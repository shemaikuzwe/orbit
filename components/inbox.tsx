"use client";
import { Inbox as InboxIcon } from "lucide-react";
import type { Workspace } from "@/lib/use-workspace";
import { cn, timeAgo } from "@/lib/utils";
import { StatusIcon } from "./issue-icons";
import { Avatar } from "./issue-meta";

type Notification = Workspace["notifications"][number];

export default function Inbox({
  notifications,
  issues,
  members,
  selectedId,
  onOpen,
}: {
  notifications: Notification[];
  issues: Workspace["issues"];
  members: Workspace["members"];
  selectedId: string;
  onOpen: (notification: Notification) => void;
}) {
  if (!notifications.length)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center text-[13px] text-muted-foreground">
        <InboxIcon size={22} />
        You&apos;re all caught up.
        <span className="text-xs">
          Assignments and comments on your issues show up here.
        </span>
      </div>
    );
  return (
    <ul className="flex-1">
      {notifications.map((notification) => {
        const issue = issues.find((i) => i.id === notification.issue_id);
        const actor =
          members.find((m) => m.id === notification.actor_id)?.name ??
          "Someone";
        return (
          <li key={notification.id}>
            <button
              type="button"
              aria-current={issue?.id === selectedId || undefined}
              className="flex w-full items-start gap-3 border-b px-4 py-3 text-left hover:bg-hover aria-[current]:bg-accent"
              onClick={() => onOpen(notification)}
            >
              <i
                aria-label={notification.read_at ? undefined : "Unread"}
                className={cn(
                  "mt-1.5 size-1.5 shrink-0 rounded-full",
                  !notification.read_at && "bg-primary",
                )}
              />
              <Avatar id={notification.actor_id ?? ""} name={actor} />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "flex items-center gap-2 text-[13px]",
                    !notification.read_at && "font-medium",
                  )}
                >
                  {issue && <StatusIcon status={issue.status} />}
                  <span className="text-faint-foreground tabular-nums">
                    {issue?.identifier}
                  </span>
                  <span className="truncate">
                    {issue?.title ?? "Deleted issue"}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {actor}{" "}
                  {notification.kind === "assigned"
                    ? "assigned it to you"
                    : "commented"}{" "}
                  · {timeAgo(notification.created_at)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
