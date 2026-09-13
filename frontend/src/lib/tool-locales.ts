import type { AppLanguage } from "./language";
import type { ToolCategory, ToolDefinition, ToolId } from "./tool-registry";

export const categoryNames: Record<ToolCategory, string> = {
  PDF: "PDF",
  "ข้อความ": "Text",
  "รูปภาพ": "Images",
  "นักพัฒนา": "Developer",
  "ตัวแปลง": "Converters",
  "ข้อมูล": "Data",
  "ตัวสร้าง": "Generators",
  "วันและเวลา": "Date & Time",
  "คำนวณ": "Calculators",
};

export const categorySlugs: Record<ToolCategory, string> = {
  PDF: "pdf",
  "ข้อความ": "text",
  "รูปภาพ": "images",
  "นักพัฒนา": "developer",
  "ตัวแปลง": "converters",
  "ข้อมูล": "data",
  "ตัวสร้าง": "generators",
  "วันและเวลา": "date-time",
  "คำนวณ": "calculators",
};

export const categoryDescriptions: Record<ToolCategory, { th: string; en: string }> = {
  PDF: { th: "รวม แยก จัดหน้า และแปลงไฟล์ PDF", en: "Merge, split, organize, and convert PDF files." },
  "ข้อความ": { th: "นับ แก้ไข และแปลงข้อความ", en: "Count, clean, compare, and transform text." },
  "รูปภาพ": { th: "ปรับขนาด ครอป และแปลงรูป", en: "Resize, crop, and convert images locally." },
  "นักพัฒนา": { th: "จัดการโค้ด JSON, URL และ Regex", en: "Work with JSON, URLs, code, and patterns." },
  "ตัวแปลง": { th: "แปลงรูปแบบข้อมูล เวลา และหน่วย", en: "Convert data formats, timestamps, and units." },
  "ข้อมูล": { th: "ดู ค้นหา และจัดการตาราง", en: "Explore tables and keep a private checklist." },
  "ตัวสร้าง": { th: "สร้างรหัส ข้อความสุ่ม และ QR", en: "Generate secure values, sample text, and QR codes." },
  "วันและเวลา": { th: "คำนวณวันที่ แปลงปี และจับเวลา", en: "Convert time zones, dates, and focus sessions." },
  "คำนวณ": { th: "หารบิลและคำนวณตัวเลขทั่วไป", en: "Split bills and calculate everyday numbers." },
};

const englishTools: Record<ToolId, { name: string; description: string }> = {
  "pdf-workspace": { name: "PDF Workspace", description: "Merge, split, organize pages, watermark, and convert PDFs." },
  "text-word-count": { name: "Word Counter", description: "Count words, lines, paragraphs, and reading time." },
  "text-character-count": { name: "Character Counter", description: "Count characters with or without spaces." },
  "text-transformer": { name: "Text Case Converter", description: "Convert text to upper, lower, title, or sentence case." },
  "text-remove-duplicates": { name: "Remove Duplicate Lines", description: "Keep the first copy of each line." },
  "text-sort-lines": { name: "Sort Lines", description: "Sort alphabetically, numerically, or randomly." },
  "text-whitespace": { name: "Whitespace Cleaner", description: "Trim edges and collapse repeated spaces." },
  "text-find-replace": { name: "Find and Replace", description: "Find text, replace matches, and see the match count." },
  "text-statistics": { name: "Text Statistics", description: "Review words, characters, paragraphs, and reading time." },
  "text-diff": { name: "Text Diff", description: "Compare two texts and inspect their changes." },
  "text-markdown": { name: "Markdown Preview", description: "Preview Markdown using safe, parsed blocks." },
  "text-slug": { name: "Text to Slug", description: "Create a URL-friendly slug from text." },
  "text-remove-empty": { name: "Remove Empty Lines", description: "Remove lines that contain no text." },
  "text-reverse": { name: "Reverse Text", description: "Reverse characters, words, or lines." },
  "text-keyboard": { name: "Keyboard Layout Converter", description: "Fix text typed with the wrong Thai or English layout." },
  "text-money": { name: "Thai Baht to Words", description: "Convert baht amounts into Thai words." },
  "text-clean": { name: "Text Cleaner", description: "Remove HTML, emoji, and extra spaces from text." },
  "image-resize": { name: "Resize Image", description: "Set image dimensions and keep the original aspect ratio." },
  "image-crop": { name: "Crop Image", description: "Crop an image using local coordinates." },
  "image-compressor": { name: "Compress Image", description: "Reduce image size before sharing or saving." },
  "jpg-to-png": { name: "JPG to PNG", description: "Convert JPEG images to PNG in your browser." },
  "png-to-jpg": { name: "PNG to JPG", description: "Convert PNG images to JPEG with quality and background options." },
  "image-to-webp": { name: "Image to WebP", description: "Convert JPG or PNG images to WebP." },
  "webp-to-png": { name: "WebP to PNG", description: "Convert WebP images to PNG." },
  "remove-image-metadata": { name: "Remove Image Metadata", description: "Rewrite an image to remove EXIF and embedded metadata." },
  "image-to-base64": { name: "Image to Base64", description: "Create a data URL from a local image." },
  "base64-to-image": { name: "Base64 to Image", description: "Preview and download a data URL as an image." },
  "color-picker": { name: "Color Picker", description: "Choose a color and inspect HEX, RGB, and HSL values." },
  "favicon-generator": { name: "Favicon Generator", description: "Create a set of PNG icons from an image or initials." },
  "json-toolkit": { name: "JSON Toolkit", description: "Validate, format, minify, and inspect JSON." },
  "url-toolkit": { name: "URL Toolkit", description: "Parse URLs, edit query parameters, and encode or decode text." },
  "jwt-decoder": { name: "JWT Decoder", description: "Decode a JWT header and payload locally; signature is not verified." },
  "regex-tester": { name: "Regex Tester", description: "Test regular expressions and review matches." },
  "cron-helper": { name: "Cron Expression Helper", description: "Validate and explain five-field cron expressions." },
  "sql-formatter": { name: "SQL Formatter", description: "Format SQL queries for readability." },
  "html-beautifier": { name: "HTML Beautifier", description: "Indent and wrap HTML markup." },
  "css-beautifier": { name: "CSS Beautifier", description: "Format CSS blocks and properties." },
  "javascript-beautifier": { name: "JavaScript Beautifier", description: "Format basic JavaScript with readable indentation." },
  "html-minifier": { name: "HTML Minifier", description: "Remove extra spaces and comments from HTML." },
  "css-minifier": { name: "CSS Minifier", description: "Remove extra spaces and comments from CSS." },
  "javascript-minifier": { name: "JavaScript Minifier", description: "Remove extra spaces and comments from JavaScript." },
  "json-yaml": { name: "JSON ↔ YAML", description: "Convert structured data in either direction." },
  base64: { name: "Base64", description: "Encode and decode Unicode text." },
  "timestamp-converter": { name: "Timestamp Converter", description: "Convert Unix timestamps, ISO dates, and local time." },
  "csv-json": { name: "CSV ↔ JSON", description: "Convert CSV and JSON, including quoted fields and newlines." },
  "number-base-converter": { name: "Number Base Converter", description: "Convert binary, octal, decimal, and hexadecimal values." },
  "unit-converter": { name: "Unit Converter", description: "Convert distance, weight, temperature, and area." },
  "csv-workspace": { name: "CSV Table Workspace", description: "View, search, sort, filter, and export local table data." },
  checklist: { name: "Private Checklist", description: "Keep a checklist in this page and import or export JSON yourself." },
  "hash-uuid": { name: "Hash & UUID", description: "Generate UUIDs and SHA-256, SHA-384, or SHA-512 hashes locally." },
  "password-generator": { name: "Password Generator", description: "Choose a length and character set to generate a password locally." },
  "random-string-generator": { name: "Random String Generator", description: "Generate a string using a custom character set." },
  "qr-generator": { name: "QR Code Generator", description: "Create a QR code for text, links, Wi-Fi, or phone numbers." },
  "lorem-generator": { name: "Lorem Ipsum Generator", description: "Generate sample text by word count or paragraph." },
  "random-number-generator": { name: "Random Number Generator", description: "Generate numbers in a range, with an optional no-repeat mode." },
  "timezone-converter": { name: "Timezone Converter", description: "Convert wall-clock time between IANA time zones." },
  "date-calculator": { name: "Date Calculator", description: "Find date differences or add and subtract time." },
  "thai-year": { name: "Buddhist Year Converter", description: "Convert Buddhist Era and Common Era years." },
  pomodoro: { name: "Pomodoro Focus Timer", description: "Time focused work sessions and breaks." },
  "split-bill": { name: "Split the Bill", description: "Calculate tax, service, tip, and the amount per person." },
  "bmi-tdee": { name: "BMI & TDEE Calculator", description: "Estimate adult BMI and daily energy needs." },
};

export function toolName(tool: ToolDefinition, language: AppLanguage) {
  return language === "en" ? englishTools[tool.id].name : tool.name;
}

export function toolDescription(tool: ToolDefinition, language: AppLanguage) {
  return language === "en"
    ? englishTools[tool.id].description
    : tool.description;
}

export function categoryName(category: ToolCategory, language: AppLanguage) {
  return language === "en" ? categoryNames[category] : category;
}
