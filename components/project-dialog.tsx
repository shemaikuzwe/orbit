"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Box, X, ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/workspace";
export default function ProjectDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (project: Project) => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="w-[520px] max-w-[calc(100%-32px)] gap-0 overflow-hidden rounded-[11px] border-[#424049] bg-popover p-0 shadow-[0_30px_120px_#0009] sm:max-w-[520px]"
      >
        <DialogTitle className="sr-only">New project</DialogTitle>
        <DialogDescription className="sr-only">
          Create a project to organize your issues.
        </DialogDescription>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            onSave({
              id: crypto.randomUUID(),
              name: String(data.get("name")).trim(),
              description: String(data.get("description")),
              color: String(data.get("color")),
              target: data.get("target")
                ? new Date(
                    String(data.get("target")) + "T12:00:00",
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                  })
                : "No target",
            });
          }}
        >
          <div className="flex h-[59px] items-center gap-[9px] border-b border-[#313037] px-[23px] text-[11px] text-[#a8a3b6]">
            <Box size={17} /> New project
            <Button
              variant="ghost"
              size="none"
              type="button"
              className="ml-auto inline-flex size-[25px] items-center justify-center rounded text-[#7d7e88] hover:bg-[#303137] hover:text-[#eeeeee]"
              aria-label="Close dialog"
              onClick={onClose}
            >
              <X size={18} />
            </Button>
          </div>
          <div className="p-6 [&>h2]:mb-[25px] [&>h2]:text-[21px] [&>h2]:font-medium [&>h2]:tracking-[-.5px] max-[700px]:[&>h2]:text-[19px] [&_label]:mb-[19px] [&_label]:flex [&_label]:flex-col [&_label]:gap-2 [&_label]:text-[11px] [&_label]:text-[#a8a3b5]">
            <h2>Make room for your next idea.</h2>
            <label>
              Project name
              <Input
                className="h-auto rounded-[5px] border-[#3b3843] bg-[#17181c] p-2.5 text-xs md:text-xs"
                name="name"
                placeholder="e.g. A better onboarding"
                required
                autoFocus
                maxLength={80}
              />
            </label>
            <label>
              Description
              <Textarea
                className="h-[85px] resize-y rounded-[5px] border-[#3b3843] bg-[#17181c] p-2.5 text-xs md:text-xs"
                name="description"
                placeholder="What are you working towards?"
                maxLength={250}
              />
            </label>
            <div className="flex gap-5 [&>label:first-child]:flex-1">
              <label>
                Target date
                <Input
                  className="h-auto rounded-[5px] border-[#3b3843] bg-[#17181c] p-2.5 text-xs md:text-xs"
                  type="date"
                  name="target"
                />
              </label>
              <label>
                Project color
                <Input
                  className="h-[38px] w-[65px] rounded-[5px] border-[#3b3843] bg-[#17181c] p-[5px]"
                  type="color"
                  name="color"
                  defaultValue="#a89af9"
                />
              </label>
            </div>
          </div>
          <footer className="flex items-center justify-end gap-3 border-t border-[#333139] px-[23px] py-4 [&>span]:mr-auto [&>span]:text-[10px] [&>span]:text-[#77727f] max-[700px]:[&>span]:hidden">
            <Button
              variant="secondary"
              type="button"
              className="border border-[#423d4d]"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="border border-[#c0b0f9] shadow-[0_1px_3px_#0004] [&_kbd]:ml-2.5 [&_kbd]:rounded-[3px] [&_kbd]:border [&_kbd]:border-[#9987ca] [&_kbd]:px-1 [&_kbd]:text-[#665580] [&_kbd:empty]:hidden"
              type="submit"
            >
              Create project <ArrowUpRight size={14} />
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
