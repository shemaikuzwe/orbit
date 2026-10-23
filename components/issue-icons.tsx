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
          Backlog: "text-[#8c8c98]",
          Todo: "text-[#a8a8b2]",
          "In progress": "text-[#dfb969]",
          Done: "text-[#9b8ada]",
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
      className={priority === "Urgent" ? "text-[#e68e7b]" : "text-[#8c8b95]"}
    />
  );
}
