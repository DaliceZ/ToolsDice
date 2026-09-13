import type { AppLanguage } from "./language";
import type { ToolCategory, ToolDefinition, ToolId } from "./tool-registry";

export const categoryNames: Record<ToolCategory, string> = {
  PDF: "PDF",
  "ข้อความ": "Text",
  "รูปภาพ": "Images",
  "นักพัฒนา": "Developer",
  "ตัวแปลง": "Converters",
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
  "ตัวสร้าง": "generators",
  "วันและเวลา": "date-time",
  "คำนวณ": "calculators",
};

export const categoryDescriptions: Record<ToolCategory, { th: string; en: string }> = {
  PDF: { th: "รวม แยก จัดหน้า และแปลงไฟล์ PDF", en: "Merge, split, organize, and convert PDF files." },
  "ข้อความ": { th: "แก้ข้อความผิดภาษา ค้นหา เปรียบเทียบ อ่านจำนวนเงิน และนับคำกับตัวอักษร", en: "Fix keyboard typos, find and compare text, read Thai amounts, and count words and characters." },
  "รูปภาพ": { th: "ปรับขนาด ครอป และแปลงรูป", en: "Resize, crop, and convert images locally." },
  "นักพัฒนา": { th: "ทดสอบ API, ถอด JWT, ทดลอง Regex และจัดรูปแบบโค้ด", en: "Build API requests, decode JWTs, test regex, and format code." },
  "ตัวแปลง": { th: "แปลงค่าเงิน ปี พ.ศ./ค.ศ. หน่วย ฐานตัวเลข และ Base64", en: "Convert currencies, Thai years, units, number bases, and Base64." },
  "ตัวสร้าง": { th: "สร้าง QR สุ่มตัวเลข รหัสผ่าน และจับฉลากรายการ", en: "Create QR codes, random values, passwords, and everyday picks." },
  "วันและเวลา": { th: "คำนวณวันที่ห่างกันและแปลงเขตเวลา", en: "Compare dates and convert time zones." },
  "คำนวณ": { th: "หารบิล BMI ค่างวด เงินออม และค่าน้ำมัน", en: "Split bills and estimate health, loans, savings, and trip costs." },
};

const englishTools: Record<ToolId, { name: string; description: string }> = {
  "pdf-workspace": { name: "Merge PDFs", description: "Combine PDF files and arrange their order before downloading." },
  "pdf-text": { name: "Copy PDF Text", description: "Read text from a PDF, then copy or download the result." },
  "manage-pdf-pages": { name: "Manage PDF Pages", description: "Reorder, rotate, and delete PDF pages." },
  "pdf-metadata": { name: "PDF Information", description: "Inspect the title, author, dates, and other PDF file details." },
  "compress-pdf": { name: "Compress PDF", description: "Reduce a PDF file locally in your browser." },
  "page-number-pdf": { name: "Add PDF Page Numbers", description: "Choose the numbering style, page ranges, and position." },
  "add-watermark": { name: "Add PDF Watermark", description: "Add and position a watermark on PDF pages." },
  "images-to-pdf": { name: "Images to PDF", description: "Combine images into a PDF and preview them before downloading." },
  "pdf-to-images": { name: "PDF to Images", description: "Convert PDF pages into images for download." },
  "split-pdf": { name: "Split PDF", description: "Choose page ranges to split into separate PDF files." },
  "text-keyboard": { name: "Fix Mistyped Language", description: "Convert text typed with the wrong Thai or English keyboard layout." },
  "text-find-replace": { name: "Find and Replace", description: "Find text, replace matches, and see the match count." },
  "text-remove-duplicates": { name: "Remove Duplicate Lines", description: "Remove repeated lines while keeping the first occurrence and original order." },
  "text-diff": { name: "Text Diff", description: "Compare two texts and inspect their changes." },
  "text-money": { name: "Thai Baht to Words", description: "Convert baht amounts into Thai words." },
  "text-reverse": { name: "Reverse Text", description: "Reverse characters, words, or lines." },
  "text-word-count": { name: "Word & Character Counter", description: "Count words and characters, with or without spaces." },
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
  "api-client": { name: "API Request Builder", description: "Build requests with query parameters, headers, auth, and body, then inspect the response." },
  "jwt-decoder": { name: "JWT Decoder", description: "Decode a JWT header and payload locally; signature is not verified." },
  "regex-tester": { name: "Regex Tester", description: "Test regular expressions and review matches." },
  "code-formatter": { name: "Code Formatter", description: "Format or minify JSON, JavaScript, HTML, CSS, and SQL in one workspace." },
  base64: { name: "Base64", description: "Encode and decode Unicode text." },
  "currency-converter": { name: "Currency Converter", description: "Convert amounts using an exchange rate you enter; no external service is called." },
  "thai-year": { name: "Buddhist Era ↔ Common Era", description: "Convert years between Buddhist Era and Common Era." },
  "number-base-converter": { name: "Number Base Converter", description: "Convert binary, octal, decimal, and hexadecimal values." },
  "unit-converter": { name: "Unit Converter", description: "Convert distance, weight, temperature, and area." },
  "hash-uuid": { name: "Hash & UUID", description: "Generate UUIDs and SHA-256, SHA-384, or SHA-512 hashes locally." },
  "password-generator": { name: "Password Generator", description: "Choose a length and character set to generate a password locally." },
  "random-string-generator": { name: "Random String Generator", description: "Generate a string using a custom character set." },
  "qr-generator": { name: "QR Code Generator", description: "Create a QR code for text, links, Wi-Fi, or phone numbers." },
  "lorem-generator": { name: "Lorem Ipsum Generator", description: "Generate sample text by word count or paragraph." },
  "random-number-generator": { name: "Random Number Generator", description: "Generate numbers in a range, with an optional no-repeat mode." },
  "random-picker": { name: "Random Picker", description: "Draw names or items without repeating a pick in the same draw." },
  "timezone-converter": { name: "Timezone Converter", description: "Convert wall-clock time between IANA time zones." },
  "date-calculator": { name: "Date Difference Calculator", description: "Compare two dates in total days and weekdays." },
  "split-bill": { name: "Split the Bill", description: "Calculate tax, service, tip, and the amount per person." },
  "bmi-tdee": { name: "BMI & TDEE Calculator", description: "Estimate adult BMI and daily energy needs." },
  "loan-calculator": { name: "Loan Payment Calculator", description: "Estimate monthly payments, total interest, and total repayment for a fixed-rate loan." },
  "savings-calculator": { name: "Compound Savings Calculator", description: "Estimate savings growth from a starting balance, monthly deposits, and interest." },
  "trip-cost-calculator": { name: "Trip Fuel Cost Calculator", description: "Estimate fuel use and cost from distance, efficiency, fuel price, and travelers." },
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
