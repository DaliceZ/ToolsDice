import type { LucideIcon } from "lucide-react";
import {
  ArrowDownUp,
  ArrowLeftRight,
  Binary,
  BadgeDollarSign,
  Calculator,
  CalendarClock,
  CalendarDays,
  Code2,
  Crop,
  Dices,
  FileImage,
  FileStack,
  FileText,
  Fuel,
  Fingerprint,
  Globe2,
  Hash,
  KeyRound,
  Languages,
  ListFilter,
  ListMinus,
  ListOrdered,
  Palette,
  PiggyBank,
  QrCode,
  Scaling,
  ScanLine,
  Search,
  SearchCode,
  Send,
  ShieldCheck,
  Sparkles,
  TextCursorInput,
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
  | "ตัวสร้าง"
  | "วันและเวลา"
  | "คำนวณ";

export type ToolId =
  | "text-word-count"
  | "text-find-replace"
  | "text-remove-duplicates"
  | "text-diff"
  | "text-reverse"
  | "text-keyboard"
  | "text-money"
  | "timezone-converter"
  | "date-calculator"
  | "base64"
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
  | "api-client"
  | "code-formatter"
  | "number-base-converter"
  | "unit-converter"
  | "currency-converter"
  | "thai-year"
  | "password-generator"
  | "random-string-generator"
  | "qr-generator"
  | "lorem-generator"
  | "random-number-generator"
  | "random-picker"
  | "loan-calculator"
  | "savings-calculator"
  | "trip-cost-calculator"
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

  defineTool("text-keyboard", "แก้ข้อความพิมพ์ผิดภาษา", "สลับข้อความจากแป้นอังกฤษเป็นไทย หรือไทยเป็นอังกฤษ", "ข้อความ", ["keyboard", "thai", "english", "layout", "wrong language"], Languages),
  defineTool("text-find-replace", "ค้นหาและแทนที่", "ค้นหา แทนที่ และดูจำนวนตำแหน่งที่พบ", "ข้อความ", ["find", "replace", "search", "match"], Search),
  defineTool("text-diff", "เปรียบเทียบข้อความ", "ดูส่วนที่เพิ่ม ลบ และเปลี่ยนแปลง", "ข้อความ", ["diff", "compare", "difference"], ArrowLeftRight),
  defineTool("text-money", "อ่านจำนวนเงินเป็นคำ", "เปลี่ยนจำนวนเงินบาทเป็นคำอ่านไทย", "ข้อความ", ["money", "thai", "baht", "currency"], Type),
  defineTool("text-reverse", "กลับลำดับข้อความ", "กลับตัวอักษร คำ หรือบรรทัด", "ข้อความ", ["reverse", "characters", "words", "lines"], ArrowDownUp),
  defineTool("text-word-count", "นับจำนวนคำและตัวอักษร", "นับจำนวนคำและตัวอักษร พร้อมดูจำนวนตัวอักษรที่ไม่รวมช่องว่าง", "ข้อความ", ["word", "character", "count", "length", "unicode"], TextCursorInput),
  defineTool("text-remove-duplicates", "ลบบรรทัดซ้ำ", "ลบบรรทัดที่ซ้ำกันโดยเก็บรายการแรกและคงลำดับเดิม", "ข้อความ", ["duplicate", "dedupe", "unique", "lines", "remove duplicates"], ListMinus),

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

  defineTool("api-client", "ทดสอบ API", "สร้างคำขอ API แยก Params, Headers, Auth และ Body พร้อมดูผลตอบกลับ", "นักพัฒนา", ["api", "request", "postman", "rest", "http", "params", "headers", "body", "curl"], Send),
  defineTool("jwt-decoder", "JWT Decoder", "ถอด Header และ Payload ในเครื่อง โดยไม่ตรวจลายเซ็น", "นักพัฒนา", ["jwt", "token", "decode", "payload"], KeyRound),
  defineTool("regex-tester", "Regex Tester", "ทดลอง Regular Expression และดูรายการที่ตรงกัน", "นักพัฒนา", ["regex", "regular expression", "pattern"], SearchCode),
  defineTool("code-formatter", "จัดรูปแบบโค้ด", "จัดรูปแบบหรือย่อ JSON, JavaScript, HTML, CSS และ SQL ในหน้าเดียว", "นักพัฒนา", ["json", "javascript", "js", "html", "css", "sql", "format", "beautify", "minify"], Code2),

  defineTool("currency-converter", "แปลงค่าเงิน", "แปลงจำนวนเงินด้วยอัตราแลกเปลี่ยนที่คุณระบุ โดยไม่เรียกบริการภายนอก", "ตัวแปลง", ["currency", "exchange rate", "money", "convert"], ArrowLeftRight),
  defineTool("thai-year", "แปลง พ.ศ. ↔ ค.ศ.", "แปลงปีพุทธศักราชและคริสต์ศักราช", "ตัวแปลง", ["thai year", "buddhist", "christian", "be", "ce"], CalendarDays),
  defineTool("unit-converter", "แปลงหน่วย", "แปลงระยะทาง น้ำหนัก อุณหภูมิ และพื้นที่", "ตัวแปลง", ["unit", "distance", "weight", "temperature"], Workflow),
  defineTool("number-base-converter", "แปลงฐานตัวเลข", "แปลง Binary, Octal, Decimal และ Hexadecimal", "ตัวแปลง", ["binary", "octal", "decimal", "hexadecimal", "base"], Binary),
  defineTool("base64", "Base64", "เข้ารหัสและถอดรหัสข้อความ Unicode", "ตัวแปลง", ["encode", "decode", "unicode"], Binary),

  defineTool("qr-generator", "สร้าง QR Code", "สร้าง QR จากลิงก์ Wi-Fi เบอร์โทร หรือข้อความ", "ตัวสร้าง", ["qr", "code", "wifi", "phone"], QrCode),
  defineTool("random-number-generator", "สุ่มตัวเลข", "สุ่มตัวเลขในช่วงที่กำหนด พร้อมตัวเลือกไม่ซ้ำ", "ตัวสร้าง", ["random", "number", "range", "dice"], Binary),
  defineTool("password-generator", "สร้างรหัสผ่าน", "กำหนดความยาวและชุดอักขระ แล้วสุ่มในเครื่อง", "ตัวสร้าง", ["password", "secure", "random"], KeyRound),
  defineTool("random-picker", "สุ่มเลือกชื่อหรือรายการ", "สุ่มจับฉลากจากรายชื่อหรือรายการ โดยไม่เลือกซ้ำในรอบเดียว", "ตัวสร้าง", ["random picker", "draw", "lottery", "names", "choice"], Dices),
  defineTool("hash-uuid", "Hash & UUID", "สร้าง UUID และค่า SHA-256, SHA-384 หรือ SHA-512 ในเครื่อง", "ตัวสร้าง", ["sha", "uuid", "hash", "guid"], Fingerprint),
  defineTool("random-string-generator", "สร้างข้อความสุ่ม", "สร้างข้อความสุ่มจากชุดอักขระและความยาวที่เลือก", "ตัวสร้าง", ["random", "string", "token"], WandSparkles),
  defineTool("lorem-generator", "สร้างข้อความตัวอย่าง", "สร้าง Lorem Ipsum ตามจำนวนคำหรือย่อหน้า", "ตัวสร้าง", ["lorem", "placeholder", "words", "paragraphs"], Type),

  defineTool("date-calculator", "คำนวณวันห่าง", "เปรียบเทียบวันที่เพื่อดูจำนวนวันรวมวันหยุดและเฉพาะวันทำงาน", "วันและเวลา", ["date", "duration", "difference", "days", "weekdays"], CalendarClock),
  defineTool("timezone-converter", "Timezone Converter", "แปลงเวลาระหว่างเขตเวลา IANA", "วันและเวลา", ["timezone", "utc", "bangkok"], Globe2),

  defineTool("split-bill", "หารบิล", "คำนวณ VAT ค่าบริการ ทิป และยอดต่อคน", "คำนวณ", ["bill", "split", "vat", "tip"], Calculator),
  defineTool("bmi-tdee", "คำนวณ BMI และ TDEE", "ประเมินดัชนีมวลกายและพลังงานต่อวัน", "คำนวณ", ["bmi", "tdee", "health", "calories"], Sparkles),
  defineTool("loan-calculator", "คำนวณค่างวดสินเชื่อ", "ประมาณค่างวดรายเดือน ดอกเบี้ยรวม และยอดชำระด้วยอัตราดอกเบี้ยคงที่", "คำนวณ", ["loan", "payment", "interest", "installment"], BadgeDollarSign),
  defineTool("savings-calculator", "คำนวณเงินออมทบต้น", "ประมาณเงินออมปลายทางจากเงินตั้งต้น เงินออมรายเดือน และดอกเบี้ย", "คำนวณ", ["savings", "compound interest", "investment", "monthly deposit"], PiggyBank),
  defineTool("trip-cost-calculator", "คำนวณค่าน้ำมันเดินทาง", "ประมาณน้ำมันและค่าเดินทางจากระยะทาง อัตราสิ้นเปลือง และจำนวนผู้เดินทาง", "คำนวณ", ["fuel", "trip", "travel cost", "gas"], Fuel),
];

export const categories: Array<"ทั้งหมด" | ToolCategory> = [
  "ทั้งหมด",
  "PDF",
  "ข้อความ",
  "รูปภาพ",
  "นักพัฒนา",
  "ตัวแปลง",
  "ตัวสร้าง",
  "วันและเวลา",
  "คำนวณ",
];

export const toolById = new Map<ToolId, ToolDefinition>(
  tools.map((tool) => [tool.id, tool]),
);
