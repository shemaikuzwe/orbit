import { CircleDashed, Circle, CircleDot, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Status, Priority } from "@/lib/workspace";
const statusIcons = {
  Backlog: CircleDashed,
  Todo: Circle,
  "In progress": CircleDot,
  Done: CircleCheck,
};
export function StatusIcon({
  status,
  size = 14,
}: {
  status: Status;
  size?: number;
}) {
  const Icon = statusIcons[status];
  return (
    <Icon
      size={size}
      aria-hidden
      className={
        {
          Backlog: "text-muted-foreground",
          Todo: "text-soft-foreground",
          "In progress": "text-amber-600 dark:text-[#dfb969]",
          Done: "text-primary",
        }[status]
      }
    />
  );
}

const levels = { "No priority": 0, Low: 1, Medium: 2, High: 3 } as const;

/** Signal bars filled by level; Urgent gets its own alert mark. */
export function PriorityIcon({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  if (priority === "Urgent")
    return (
      <span
        role="img"
        aria-label="Urgent"
        title="Urgent"
        className={cn(
          "grid size-3.5 shrink-0 place-items-center rounded-[3px] bg-destructive text-[9px] leading-none font-bold text-background",
          className,
        )}
      >
        !
      </span>
    );
  const level = levels[priority];
  return (
    <svg
      role="img"
      aria-label={priority}
      viewBox="0 0 14 14"
      className={cn("size-3.5 text-soft-foreground", className)}
    >
      <title>{priority}</title>
      {[4, 7, 10].map((height, i) =>
        level === 0 ? (
          <rect
            key={height}
            x={1.5 + i * 4}
            y={6.25}
            width={3}
            height={1.5}
            rx={0.75}
            fill="currentColor"
            opacity={0.45}
          />
        ) : (
          <rect
            key={height}
            x={1.5 + i * 4}
            y={12 - height}
            width={3}
            height={height}
            rx={1}
            fill="currentColor"
            opacity={i < level ? 1 : 0.22}
          />
        ),
      )}
    </svg>
  );
}
