import { Box, ArrowUpRight, Plus } from "lucide-react";
import type { Project, Issue } from "@/lib/workspace";
export default function ProjectsGrid({
  projects,
  issues,
  query,
  onOpen,
  onCreate,
}: {
  projects: Project[];
  issues: Issue[];
  query: string;
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="grid flex-1 grid-cols-[repeat(3,minmax(220px,1fr))] content-start gap-5 px-[34px] py-[30px] max-[1200px]:grid-cols-[repeat(2,minmax(200px,1fr))] max-[700px]:grid-cols-1 max-[700px]:p-5">
      {projects
        .filter((p) =>
          `${p.name} ${p.description}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .map((p) => {
          const count = issues.filter((i) => i.projectId === p.id).length;
          const done = issues.filter(
            (i) => i.projectId === p.id && i.status === "Done",
          ).length;
          return (
            <button
              key={p.id}
              className="min-h-[260px] rounded-[9px] border border-border bg-card p-[23px] text-left hover:border-border-strong hover:bg-hover [&_h2]:mt-[21px] [&_h2]:mb-[9px] [&_h2]:text-base [&_h2]:font-medium [&_h2]:tracking-[-.3px] [&>p]:mb-[27px] [&>p]:min-h-10 [&>p]:text-[11px] [&>p]:leading-[1.8] [&>p]:text-muted-foreground"
              onClick={() => onOpen(p.id)}
            >
              <div className="flex items-center justify-between text-faint-foreground">
                <span
                  className="grid size-11 place-items-center rounded-[10px]"
                  style={{ color: p.color, background: p.color + "15" }}
                >
                  <Box size={23} />
                </span>
                <ArrowUpRight size={17} />
              </div>
              <h2>{p.name}</h2>
              <p>{p.description}</p>
              <div className="flex justify-between text-[10px] text-soft-foreground [&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-1.5 [&_i]:size-[5px] [&_i]:rounded-full [&_i]:bg-[#c2a76d]">
                <span>
                  <i /> In progress
                </span>
                <span>{p.target}</span>
              </div>
              <div className="mt-3.5 mb-2.5 h-[3px] overflow-hidden rounded-[3px] bg-muted [&>span]:block [&>span]:h-full">
                <span
                  style={{
                    width: `${count ? (done / count) * 100 : 0}%`,
                    background: p.color,
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>
                  {done} of {count} issues completed
                </span>
                <span>{count ? Math.round((done / count) * 100) : 0}%</span>
              </div>
            </button>
          );
        })}
      <button
        className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-[9px] border border-dashed border-border text-xs text-soft-foreground hover:bg-hover [&>span]:text-[10px] [&>span]:text-faint-foreground"
        onClick={() => onCreate()}
      >
        <Plus size={22} /> Create a project
        <span>Give your next idea a home.</span>
      </button>
    </div>
  );
}
