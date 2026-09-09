import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  ArrowLeftRight,
  Binary,
  Braces,
  CalendarClock,
  Clock3,
  FileJson2,
  FileText,
  Fingerprint,
  Globe2,
  Type,
  Workflow,
} from "lucide-react";

export type ToolCategory =
  | "ข้อความ"
  | "วันเวลา"
  | "ข้อมูล"
  | "นักพัฒนา"
  | "เอกสาร";
export type ToolId =
  | "text-transformer"
  | "text-statistics"
  | "text-diff"
  | "timestamp-converter"
  | "timezone-converter"
  | "date-calculator"
  | "json-toolkit"
  | "json-yaml"
  | "base64"
  | "url-toolkit"
  | "hash-uuid"
  | "pdf-workspace";
export type ToolDefinition = {
  id: ToolId;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  icon: LucideIcon;
};

export const tools: ToolDefinition[] = [
  {
    id: "text-transformer",
    name: "แปลงข้อความ",
    description: "จัดช่องว่างและแปลงรูปแบบตัวพิมพ์",
    category: "ข้อความ",
    keywords: ["text", "case", "trim"],
    icon: Type,
  },
  {
    id: "text-statistics",
    name: "สถิติข้อความ",
    description: "นับตัวอักษร คำ บรรทัด และขนาดข้อมูล",
    category: "ข้อความ",
    keywords: ["count", "word", "character"],
    icon: AlignLeft,
  },
  {
    id: "text-diff",
    name: "เปรียบเทียบข้อความ",
    description: "ดูส่วนที่เพิ่ม ลบ และเปลี่ยนแปลง",
    category: "ข้อความ",
    keywords: ["diff", "compare"],
    icon: ArrowLeftRight,
  },
  {
    id: "timestamp-converter",
    name: "Timestamp Converter",
    description: "แปลง Unix timestamp, ISO และเวลาท้องถิ่น",
    category: "วันเวลา",
    keywords: ["unix", "epoch", "iso"],
    icon: Clock3,
  },
  {
    id: "timezone-converter",
    name: "Timezone Converter",
    description: "แปลงเวลาระหว่างเขตเวลา IANA",
    category: "วันเวลา",
    keywords: ["timezone", "utc", "bangkok"],
    icon: Globe2,
  },
  {
    id: "date-calculator",
    name: "คำนวณวันเวลา",
    description: "หาผลต่างหรือเพิ่มและลดช่วงเวลา",
    category: "วันเวลา",
    keywords: ["date", "duration", "difference"],
    icon: CalendarClock,
  },
  {
    id: "json-toolkit",
    name: "JSON Toolkit",
    description: "ตรวจสอบ จัดรูปแบบ และย่อ JSON",
    category: "ข้อมูล",
    keywords: ["json", "format", "validate"],
    icon: Braces,
  },
  {
    id: "json-yaml",
    name: "JSON ↔ YAML",
    description: "แปลง structured data สองทิศทาง",
    category: "ข้อมูล",
    keywords: ["yaml", "json", "convert"],
    icon: FileJson2,
  },
  {
    id: "base64",
    name: "Base64",
    description: "เข้ารหัสและถอดรหัสข้อความ Unicode",
    category: "นักพัฒนา",
    keywords: ["encode", "decode", "unicode"],
    icon: Binary,
  },
  {
    id: "url-toolkit",
    name: "URL Toolkit",
    description: "encode, decode และจัดการ query string",
    category: "นักพัฒนา",
    keywords: ["url", "query", "percent"],
    icon: Workflow,
  },
  {
    id: "hash-uuid",
    name: "Hash & UUID",
    description: "สร้าง UUID และค่า SHA ที่ไม่ส่งข้อมูลออก",
    category: "นักพัฒนา",
    keywords: ["sha", "uuid", "hash"],
    icon: Fingerprint,
  },
  {
    id: "pdf-workspace",
    name: "PDF Workspace",
    description: "รวม แยก เรียง และหมุนหน้า PDF",
    category: "เอกสาร",
    keywords: ["pdf", "merge", "split", "rotate"],
    icon: FileText,
  },
];

export const categories: Array<"ทั้งหมด" | ToolCategory> = [
  "ทั้งหมด",
  "ข้อความ",
  "วันเวลา",
  "ข้อมูล",
  "นักพัฒนา",
  "เอกสาร",
];
export const toolById = new Map(tools.map((tool) => [tool.id, tool]));
