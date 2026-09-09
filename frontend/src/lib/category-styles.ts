import type { ToolCategory } from "./tool-registry";

export const categoryStyles: Record<
  ToolCategory,
  {
    accent: string;
    border: string;
    icon: string;
    section: string;
    eyebrow: string;
  }
> = {
  ข้อความ: {
    accent: "bg-cyan-500",
    border: "border-cyan-500/20 hover:border-cyan-500/55",
    icon: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    section: "border-cyan-500/20 bg-card/55",
    eyebrow: "text-cyan-700 dark:text-cyan-300",
  },
  วันเวลา: {
    accent: "bg-sky-500",
    border: "border-sky-500/20 hover:border-sky-500/55",
    icon: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    section: "border-sky-500/20 bg-card/55",
    eyebrow: "text-sky-700 dark:text-sky-300",
  },
  ข้อมูล: {
    accent: "bg-amber-500",
    border: "border-amber-500/20 hover:border-amber-500/55",
    icon: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    section: "border-amber-500/20 bg-card/55",
    eyebrow: "text-amber-700 dark:text-amber-300",
  },
  นักพัฒนา: {
    accent: "bg-violet-500",
    border: "border-indigo-500/20 hover:border-indigo-500/55",
    icon: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    section: "border-indigo-500/20 bg-card/55",
    eyebrow: "text-indigo-700 dark:text-indigo-300",
  },
  เอกสาร: {
    accent: "bg-rose-500",
    border: "border-rose-500/20 hover:border-rose-500/55",
    icon: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    section: "border-rose-500/20 bg-card/55",
    eyebrow: "text-rose-700 dark:text-rose-300",
  },
};
