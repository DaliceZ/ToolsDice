import type { LucideIcon } from "lucide-react";
import {
  ArrowDownUp,
  ArrowLeftRight,
  Binary,
  Braces,
  Calculator,
  CalendarClock,
  CalendarDays,
  Clock3,
  Code2,
  Crop,
  Eraser,
  FileCode2,
  FileImage,
  FileJson2,
  FileSpreadsheet,
  FileStack,
  FileText,
  Fingerprint,
  Globe2,
  Hash,
  KeyRound,
  Languages,
  ListChecks,
  ListFilter,
  ListMinus,
  ListOrdered,
  Palette,
  QrCode,
  Scaling,
  ScanLine,
  Search,
  SearchCode,
  ShieldCheck,
  Sparkles,
  Space,
  TextCursorInput,
  Timer,
  Type,
  WandSparkles,
  Workflow,
} from "lucide-react";

export type ToolCategory =
  | "PDF"
  | "ข้อความ"
  | "รูปภาพ"
  | "นักพัฒนา"
  | "ตัวแปลง"
  | "ข้อมูล"
  | "ตัวสร้าง"
  | "วันและเวลา"
  | "คำนวณ";

export type ToolId =
  | "text-word-count"
  | "text-character-count"
  | "text-transformer"
  | "text-remove-duplicates"
  | "text-sort-lines"
  | "text-whitespace"
  | "text-find-replace"
  | "text-statistics"
  | "text-diff"
  | "text-markdown"
  | "text-slug"
  | "text-remove-empty"
  | "text-reverse"
  | "text-keyboard"
  | "text-money"
  | "text-clean"
  | "timestamp-converter"
  | "timezone-converter"
  | "date-calculator"
  | "json-toolkit"
  | "json-yaml"
  | "base64"
  | "url-toolkit"
  | "hash-uuid"
  | "pdf-workspace"
  | "pdf-text"
  | "manage-pdf-pages"
  | "pdf-metadata"
  | "compress-pdf"
  | "page-number-pdf"
  | "add-watermark"
  | "images-to-pdf"
  | "pdf-to-images"
  | "split-pdf"
  | "image-resize"
  | "image-crop"
  | "image-compressor"
  | "jpg-to-png"
  | "png-to-jpg"
  | "image-to-webp"
  | "webp-to-png"
  | "remove-image-metadata"
  | "image-to-base64"
  | "base64-to-image"
  | "color-picker"
  | "favicon-generator"
  | "jwt-decoder"
  | "regex-tester"
  | "cron-helper"
  | "sql-formatter"
  | "html-beautifier"
  | "css-beautifier"
  | "javascript-beautifier"
  | "html-minifier"
  | "css-minifier"
  | "javascript-minifier"
  | "csv-json"
  | "number-base-converter"
  | "unit-converter"
  | "csv-workspace"
  | "checklist"
  | "password-generator"
  | "random-string-generator"
  | "qr-generator"
  | "lorem-generator"
  | "random-number-generator"
  | "thai-year"
  | "pomodoro"
  | "split-bill"
  | "bmi-tdee";

export type ToolDefinition = {
  id: ToolId;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  icon: LucideIcon;
};

const defineTool = (
  id: ToolId,
  name: string,
  description: string,
  category: ToolCategory,
  keywords: string[],
  icon: LucideIcon,
): ToolDefinition => ({ id, name, description, category, keywords, icon });

export const tools: ToolDefinition[] = [
  defineTool("pdf-workspace", "รวมไฟล์ PDF", "รวมไฟล์ PDF หลายไฟล์และจัดเรียงก่อนดาวน์โหลด", "PDF", ["pdf", "merge", "combine", "รวมไฟล์"], FileStack),
  defineTool("pdf-text", "คัดลอกข้อความ PDF", "อ่านข้อความใน PDF แล้วคัดลอกหรือดาวน์โหลดข้อความ", "PDF", ["pdf", "text", "extract", "copy", "อ่านข้อความ"], FileText),
  defineTool("manage-pdf-pages", "จัดการหน้า PDF", "เรียงลำดับ หมุน และลบหน้า PDF", "PDF", ["pdf", "pages", "organize", "reorder", "rotate", "delete", "จัดหน้า"], ListOrdered),
  defineTool("split-pdf", "แยกหน้า PDF", "เลือกช่วงหน้าเพื่อแยกออกเป็นไฟล์ PDF", "PDF", ["pdf", "split", "pages", "แยกหน้า"], ListFilter),
  defineTool("pdf-metadata", "ดูข้อมูล PDF", "ตรวจดูชื่อเรื่อง ผู้สร้าง วันที่ และข้อมูลของไฟล์ PDF", "PDF", ["pdf", "metadata", "info", "ข้อมูลไฟล์"], ScanLine),
  defineTool("compress-pdf", "ลดขนาด PDF", "ลดขนาดไฟล์ PDF ในเบราว์เซอร์", "PDF", ["pdf", "compress", "size", "บีบอัด"], Scaling),
  defineTool("page-number-pdf", "ใส่เลขหน้า PDF", "กำหนดรูปแบบ ช่วง และตำแหน่งเลขหน้าบน PDF", "PDF", ["pdf", "page numbers", "numbering", "เลขหน้า"], Hash),
  defineTool("add-watermark", "ใส่ลายน้ำ PDF", "เพิ่มและจัดตำแหน่งลายน้ำบนหน้า PDF", "PDF", ["pdf", "watermark", "stamp", "ลายน้ำ"], Sparkles),
  defineTool("images-to-pdf", "รูปภาพเป็น PDF", "รวมรูปภาพเป็นไฟล์ PDF พร้อมดูตัวอย่างก่อนดาวน์โหลด", "PDF", ["image", "images", "to pdf", "รูปภาพเป็น pdf"], FileImage),
  defineTool("pdf-to-images", "PDF เป็นรูปภาพ", "แปลงหน้า PDF เป็นรูปภาพเพื่อดาวน์โหลด", "PDF", ["pdf", "jpg", "jpeg", "image", "convert"], FileImage),

  defineTool("text-word-count", "นับจำนวนคำ", "นับคำ บรรทัด ย่อหน้า และเวลาอ่าน", "ข้อความ", ["word", "count", "paragraph", "reading time"], TextCursorInput),
  defineTool("text-character-count", "นับจำนวนตัวอักษร", "นับตัวอักษรทั้งแบบรวมและไม่รวมช่องว่าง", "ข้อความ", ["character", "count", "length", "unicode"], Hash),
  defineTool("text-transformer", "เปลี่ยนรูปแบบตัวพิมพ์", "แปลงเป็น lowercase, UPPERCASE, Title และ Sentence case", "ข้อความ", ["text", "case", "uppercase", "lowercase", "title"], Type),
  defineTool("text-remove-duplicates", "ลบบรรทัดซ้ำ", "เก็บบรรทัดแรกและลบรายการที่ซ้ำกัน", "ข้อความ", ["duplicate", "dedupe", "unique", "lines"], ListMinus),
  defineTool("text-sort-lines", "เรียงลำดับบรรทัด", "เรียง A–Z, Z–A, ตัวเลข หรือสุ่มลำดับ", "ข้อความ", ["sort", "lines", "alphabetical", "numeric", "random"], ListOrdered),
  defineTool("text-whitespace", "จัดช่องว่าง", "ตัดช่องว่างหัวท้ายและลดช่องว่างซ้ำ", "ข้อความ", ["whitespace", "trim", "space", "format"], Space),
  defineTool("text-find-replace", "ค้นหาและแทนที่", "ค้นหา แทนที่ และดูจำนวนตำแหน่งที่พบ", "ข้อความ", ["find", "replace", "search", "match"], Search),
  defineTool("text-statistics", "สถิติข้อความ", "ดูคำ ตัวอักษร บรรทัด ย่อหน้า และเวลาอ่าน", "ข้อความ", ["statistics", "count", "word", "character", "reading"], FileText),
  defineTool("text-diff", "เปรียบเทียบข้อความ", "ดูส่วนที่เพิ่ม ลบ และเปลี่ยนแปลง", "ข้อความ", ["diff", "compare", "difference"], ArrowLeftRight),
  defineTool("text-markdown", "Markdown Preview", "พิมพ์ Markdown แล้วดูตัวอย่างแบบปลอดภัย", "ข้อความ", ["markdown", "preview", "md", "render"], Code2),
  defineTool("text-slug", "ข้อความเป็น Slug", "สร้าง slug ที่เหมาะกับ URL จากข้อความ", "ข้อความ", ["slug", "url", "seo", "permalink"], Workflow),
  defineTool("text-remove-empty", "ลบบรรทัดว่าง", "ลบบรรทัดที่ไม่มีข้อความออกทั้งหมด", "ข้อความ", ["empty", "blank", "lines", "remove"], ListFilter),
  defineTool("text-reverse", "กลับลำดับข้อความ", "กลับตัวอักษร คำ หรือบรรทัด", "ข้อความ", ["reverse", "characters", "words", "lines"], ArrowDownUp),
  defineTool("text-keyboard", "แก้ข้อความพิมพ์ผิดภาษา", "สลับข้อความจากแป้นอังกฤษเป็นไทย หรือไทยเป็นอังกฤษ", "ข้อความ", ["keyboard", "thai", "english", "layout"], Languages),
  defineTool("text-money", "อ่านจำนวนเงินเป็นคำ", "เปลี่ยนจำนวนเงินบาทเป็นคำอ่านไทย", "ข้อความ", ["money", "thai", "baht", "currency"], Type),
  defineTool("text-clean", "ล้างข้อความและ HTML", "ลบ HTML อีโมจิ และช่องว่างเกิน", "ข้อความ", ["clean", "html", "emoji", "sanitize"], Eraser),

  defineTool("image-resize", "ปรับขนาดรูปภาพ", "กำหนดความกว้างและความสูง พร้อมล็อกสัดส่วน", "รูปภาพ", ["resize", "dimensions", "ปรับขนาด"], Scaling),
  defineTool("image-crop", "ครอปรูปภาพ", "ครอปภาพตามพิกัดที่กำหนด", "รูปภาพ", ["crop", "ตัดภาพ", "ratio"], Crop),
  defineTool("image-compressor", "ลดขนาดรูปภาพ", "ย่อและบีบอัดรูปก่อนส่งหรือจัดเก็บ", "รูปภาพ", ["compress", "reduce", "ขนาดไฟล์"], ScanLine),
  defineTool("jpg-to-png", "JPG เป็น PNG", "แปลงภาพ JPEG เป็น PNG ในเบราว์เซอร์", "รูปภาพ", ["convert", "jpeg", "png"], FileImage),
  defineTool("png-to-jpg", "PNG เป็น JPG", "แปลง PNG เป็น JPEG พร้อมเลือกคุณภาพและพื้นหลัง", "รูปภาพ", ["convert", "png", "jpeg"], FileImage),
  defineTool("image-to-webp", "รูปภาพเป็น WebP", "แปลง JPG หรือ PNG เป็น WebP", "รูปภาพ", ["webp", "convert", "image"], FileImage),
  defineTool("webp-to-png", "WebP เป็น PNG", "แปลง WebP เป็น PNG", "รูปภาพ", ["webp", "png", "convert"], FileImage),
  defineTool("remove-image-metadata", "ลบ Metadata รูปภาพ", "เขียนภาพใหม่เพื่อลบ EXIF และข้อมูลแฝง", "รูปภาพ", ["remove", "exif", "metadata", "privacy"], ShieldCheck),
  defineTool("image-to-base64", "รูปภาพเป็น Base64", "สร้าง Data URL จากรูปภาพเพื่อใช้ในเว็บหรือโค้ด", "รูปภาพ", ["data url", "encode", "base64"], Binary),
  defineTool("base64-to-image", "Base64 เป็นรูปภาพ", "ดูตัวอย่างและดาวน์โหลด Data URL เป็นไฟล์", "รูปภาพ", ["decode", "data url", "base64"], FileImage),
  defineTool("color-picker", "เลือกและแปลงค่าสี", "ดูค่า HEX, RGB และ HSL พร้อมเลือกสี", "รูปภาพ", ["color", "hex", "rgb", "hsl", "picker"], Palette),
  defineTool("favicon-generator", "สร้าง Favicon", "สร้างไอคอน PNG หลายขนาดจากรูปหรืออักษรย่อ", "รูปภาพ", ["favicon", "icon", "logo"], Sparkles),

  defineTool("json-toolkit", "JSON Toolkit", "ตรวจ syntax จัดรูปแบบ ย่อ และดูข้อมูลแบบต้นไม้", "นักพัฒนา", ["json", "format", "validate", "viewer", "tree"], Braces),
  defineTool("url-toolkit", "URL Toolkit", "แยก URL จัดการ query และ encode หรือ decode", "นักพัฒนา", ["url", "query", "percent", "parser"], Workflow),
  defineTool("jwt-decoder", "JWT Decoder", "ถอด Header และ Payload ในเครื่อง โดยไม่ตรวจลายเซ็น", "นักพัฒนา", ["jwt", "token", "decode", "payload"], KeyRound),
  defineTool("regex-tester", "Regex Tester", "ทดลอง Regular Expression และดูรายการที่ตรงกัน", "นักพัฒนา", ["regex", "regular expression", "pattern"], SearchCode),
  defineTool("cron-helper", "Cron Expression Helper", "ตรวจและอธิบาย cron expression 5 ช่อง", "นักพัฒนา", ["cron", "schedule", "expression"], Clock3),
  defineTool("sql-formatter", "SQL Formatter", "จัดรูปแบบ query SQL ให้อ่านง่าย", "นักพัฒนา", ["sql", "query", "format"], FileCode2),
  defineTool("html-beautifier", "HTML Beautifier", "จัด indent และบรรทัดของ HTML", "นักพัฒนา", ["html", "beautify", "format"], Code2),
  defineTool("css-beautifier", "CSS Beautifier", "จัดบล็อกและ property ของ CSS", "นักพัฒนา", ["css", "beautify", "format"], Code2),
  defineTool("javascript-beautifier", "JavaScript Beautifier", "จัดบรรทัดและ indent ของ JavaScript พื้นฐาน", "นักพัฒนา", ["javascript", "js", "beautify"], Code2),
  defineTool("html-minifier", "HTML Minifier", "ลดช่องว่างและ comment ของ HTML", "นักพัฒนา", ["html", "minify", "compress"], FileCode2),
  defineTool("css-minifier", "CSS Minifier", "ลดช่องว่างและ comment ของ CSS", "นักพัฒนา", ["css", "minify", "compress"], FileCode2),
  defineTool("javascript-minifier", "JavaScript Minifier", "ลดช่องว่างและ comment ของ JavaScript", "นักพัฒนา", ["javascript", "js", "minify"], FileCode2),

  defineTool("json-yaml", "JSON ↔ YAML", "แปลง structured data ได้ทั้งสองทิศทาง", "ตัวแปลง", ["yaml", "json", "convert"], FileJson2),
  defineTool("base64", "Base64", "เข้ารหัสและถอดรหัสข้อความ Unicode", "ตัวแปลง", ["encode", "decode", "unicode"], Binary),
  defineTool("timestamp-converter", "Timestamp Converter", "แปลง Unix timestamp, ISO และเวลาท้องถิ่น", "ตัวแปลง", ["unix", "epoch", "iso", "timestamp"], Clock3),
  defineTool("csv-json", "CSV ↔ JSON", "แปลง CSV และ JSON พร้อมรองรับเครื่องหมายคำพูดและบรรทัดใหม่", "ตัวแปลง", ["csv", "json", "convert"], FileSpreadsheet),
  defineTool("number-base-converter", "แปลงฐานตัวเลข", "แปลง Binary, Octal, Decimal และ Hexadecimal", "ตัวแปลง", ["binary", "octal", "decimal", "hexadecimal", "base"], Binary),
  defineTool("unit-converter", "แปลงหน่วย", "แปลงระยะทาง น้ำหนัก อุณหภูมิ และพื้นที่", "ตัวแปลง", ["unit", "distance", "weight", "temperature"], Workflow),

  defineTool("csv-workspace", "จัดการตาราง CSV", "ดู ค้นหา เรียง กรอง และส่งออกข้อมูลตาราง", "ข้อมูล", ["csv", "table", "filter", "sort", "rows", "columns"], FileSpreadsheet),
  defineTool("checklist", "Checklist ส่วนตัว", "ทำรายการในหน้านี้และนำเข้า/ส่งออก JSON ด้วยตนเอง", "ข้อมูล", ["checklist", "todo", "task", "json", "รายการ"], ListChecks),

  defineTool("hash-uuid", "Hash & UUID", "สร้าง UUID และค่า SHA-256, SHA-384 หรือ SHA-512 ในเครื่อง", "ตัวสร้าง", ["sha", "uuid", "hash", "guid"], Fingerprint),
  defineTool("password-generator", "สร้างรหัสผ่าน", "กำหนดความยาวและชุดอักขระ แล้วสุ่มในเครื่อง", "ตัวสร้าง", ["password", "secure", "random"], KeyRound),
  defineTool("random-string-generator", "สร้างข้อความสุ่ม", "สร้างข้อความสุ่มจากชุดอักขระและความยาวที่เลือก", "ตัวสร้าง", ["random", "string", "token"], WandSparkles),
  defineTool("qr-generator", "สร้าง QR Code", "สร้าง QR จากลิงก์ Wi-Fi เบอร์โทร หรือข้อความ", "ตัวสร้าง", ["qr", "code", "wifi", "phone"], QrCode),
  defineTool("lorem-generator", "สร้างข้อความตัวอย่าง", "สร้าง Lorem Ipsum ตามจำนวนคำหรือย่อหน้า", "ตัวสร้าง", ["lorem", "placeholder", "words", "paragraphs"], Type),
  defineTool("random-number-generator", "สุ่มตัวเลข", "สุ่มตัวเลขในช่วงที่กำหนด พร้อมตัวเลือกไม่ซ้ำ", "ตัวสร้าง", ["random", "number", "range", "dice"], Binary),

  defineTool("timezone-converter", "Timezone Converter", "แปลงเวลาระหว่างเขตเวลา IANA", "วันและเวลา", ["timezone", "utc", "bangkok"], Globe2),
  defineTool("date-calculator", "คำนวณวันเวลา", "หาผลต่างหรือเพิ่มและลดช่วงเวลา", "วันและเวลา", ["date", "duration", "difference", "days"], CalendarClock),
  defineTool("thai-year", "แปลง พ.ศ. ↔ ค.ศ.", "แปลงปีพุทธศักราชและคริสต์ศักราช", "วันและเวลา", ["thai year", "buddhist", "christian"], CalendarDays),
  defineTool("pomodoro", "Pomodoro จับเวลาโฟกัส", "จับเวลาทำงานและพัก พร้อมเสียงแจ้งเตือน", "วันและเวลา", ["timer", "focus", "break", "pomodoro"], Timer),

  defineTool("split-bill", "หารบิล", "คำนวณ VAT ค่าบริการ ทิป และยอดต่อคน", "คำนวณ", ["bill", "split", "vat", "tip"], Calculator),
  defineTool("bmi-tdee", "คำนวณ BMI และ TDEE", "ประเมินดัชนีมวลกายและพลังงานต่อวัน", "คำนวณ", ["bmi", "tdee", "health", "calories"], Sparkles),
];

export const categories: Array<"ทั้งหมด" | ToolCategory> = [
  "ทั้งหมด",
  "PDF",
  "ข้อความ",
  "รูปภาพ",
  "นักพัฒนา",
  "ตัวแปลง",
  "ข้อมูล",
  "ตัวสร้าง",
  "วันและเวลา",
  "คำนวณ",
];

export const toolById = new Map<ToolId, ToolDefinition>(
  tools.map((tool) => [tool.id, tool]),
);
