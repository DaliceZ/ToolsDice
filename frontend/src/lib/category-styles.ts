import type { ToolCategory } from "./tool-registry";

type CategoryStyle = {
  accent: string;
  border: string;
  icon: string;
  section: string;
  eyebrow: string;
};

const rose: CategoryStyle = {
  accent: "category-rose-accent",
  border: "category-rose-border",
  icon: "category-rose-icon",
  section: "category-rose-section",
  eyebrow: "category-rose-ink",
};
const amber: CategoryStyle = {
  accent: "category-amber-accent",
  border: "category-amber-border",
  icon: "category-amber-icon",
  section: "category-amber-section",
  eyebrow: "category-amber-ink",
};
const indigo: CategoryStyle = {
  accent: "category-indigo-accent",
  border: "category-indigo-border",
  icon: "category-indigo-icon",
  section: "category-indigo-section",
  eyebrow: "category-indigo-ink",
};

export const categoryStyles: Record<ToolCategory, CategoryStyle> = {
  PDF: rose,
  "รูปภาพ": rose,
  "ข้อความ": {
    accent: "category-cyan-accent",
    border: "category-cyan-border",
    icon: "category-cyan-icon",
    section: "category-cyan-section",
    eyebrow: "category-cyan-ink",
  },
  "นักพัฒนา": indigo,
  "ตัวสร้าง": indigo,
  "ตัวแปลง": amber,
  "ข้อมูล": amber,
  "คำนวณ": amber,
  "วันและเวลา": {
    accent: "category-sky-accent",
    border: "category-sky-border",
    icon: "category-sky-icon",
    section: "category-sky-section",
    eyebrow: "category-sky-ink",
  },
};
