import {
  CircleDashed,
  Circle,
  CircleDot,
  CircleCheck,
  SignalHigh,
  SignalMedium,
  SignalLow,
  MoreHorizontal,
} from "lucide-react";
import { type Status, type Issue } from "@/lib/workspace";
const statusIcons = {
  Backlog: CircleDashed,
  Todo: Circle,
  "In progress": CircleDot,
  Done: CircleCheck,
};
export function StatusIcon({ status }: { status: Status }) {
  const Icon = statusIcons[status];
  return (
    <Icon
      size={15}
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
export function PriorityIcon({ priority }: { priority: Issue["priority"] }) {
  const Icon =
    priority === "High" || priority === "Urgent"
      ? SignalHigh
      : priority === "Medium"
        ? SignalMedium
        : priority === "Low"
          ? SignalLow
          : MoreHorizontal;
  return (
    <Icon
      size={15}
      className={
        priority === "Urgent" ? "text-destructive" : "text-muted-foreground"
      }
    />
  );
}
