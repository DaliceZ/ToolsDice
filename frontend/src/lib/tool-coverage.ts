import type { ToolId } from "./tool-registry";

export type SourceCategory =
  | "PDF" | "ข้อความ" | "รูปภาพ" | "นักพัฒนา" | "ตัวแปลง"
  | "ข้อมูล" | "ตัวสร้าง" | "วันและเวลา" | "แชร์" | "คำนวณ";

export type SourceToolCoverage = {
  sourceId: string;
  category: SourceCategory;
  targetId: ToolId | null;
  mode: string | null;
  exclusion?: string;
};

/** One row per source catalog entry; grouped routes name the exact target mode. */
export const sourceToolCoverage: SourceToolCoverage[] = [
  { sourceId: "merge-pdf", category: "PDF", targetId: "pdf-workspace", mode: "merge-pdf" },
  { sourceId: "reorder-pdf-pages", category: "PDF", targetId: "pdf-workspace", mode: "reorder-pdf-pages" },
  { sourceId: "rotate-pdf-pages", category: "PDF", targetId: "pdf-workspace", mode: "rotate-pdf-pages" },
  { sourceId: "delete-pdf-pages", category: "PDF", targetId: "pdf-workspace", mode: "delete-pdf-pages" },
  { sourceId: "split-pdf", category: "PDF", targetId: "pdf-workspace", mode: "split-pdf" },
  { sourceId: "compress-pdf", category: "PDF", targetId: "pdf-workspace", mode: "compress-pdf" },
  { sourceId: "pdf-to-images", category: "PDF", targetId: "pdf-workspace", mode: "pdf-to-images" },
  { sourceId: "images-to-pdf", category: "PDF", targetId: "pdf-workspace", mode: "images-to-pdf" },
  { sourceId: "page-number-pdf", category: "PDF", targetId: "pdf-workspace", mode: "page-number-pdf" },
  { sourceId: "add-watermark", category: "PDF", targetId: "pdf-workspace", mode: "add-watermark" },
  { sourceId: "pdf-text", category: "PDF", targetId: "pdf-workspace", mode: "pdf-text" },
  { sourceId: "pdf-metadata", category: "PDF", targetId: "pdf-workspace", mode: "pdf-metadata" },

  { sourceId: "word-counter", category: "ข้อความ", targetId: "text-word-count", mode: "word-count" },
  { sourceId: "character-counter", category: "ข้อความ", targetId: "text-character-count", mode: "character-count" },
  { sourceId: "text-case", category: "ข้อความ", targetId: "text-transformer", mode: "case-conversion" },
  { sourceId: "remove-duplicate-lines", category: "ข้อความ", targetId: "text-remove-duplicates", mode: "deduplicate-lines" },
  { sourceId: "sort-lines", category: "ข้อความ", targetId: "text-sort-lines", mode: "sort-lines" },
  { sourceId: "trim-spaces", category: "ข้อความ", targetId: "text-whitespace", mode: "trim-and-collapse" },
  { sourceId: "find-replace", category: "ข้อความ", targetId: "text-find-replace", mode: "find-and-replace" },
  { sourceId: "text-diff", category: "ข้อความ", targetId: "text-diff", mode: "diff" },
  { sourceId: "markdown-preview", category: "ข้อความ", targetId: "text-markdown", mode: "safe-preview" },
  { sourceId: "text-to-slug", category: "ข้อความ", targetId: "text-slug", mode: "slug" },
  { sourceId: "remove-empty-lines", category: "ข้อความ", targetId: "text-remove-empty", mode: "remove-empty" },
  { sourceId: "reverse-text", category: "ข้อความ", targetId: "text-reverse", mode: "characters-words-lines" },
  { sourceId: "text-statistics", category: "ข้อความ", targetId: "text-statistics", mode: "statistics" },
  { sourceId: "wrong-keyboard", category: "ข้อความ", targetId: "text-keyboard", mode: "keyboard-layout" },
  { sourceId: "baht-text", category: "ข้อความ", targetId: "text-money", mode: "baht-words" },
  { sourceId: "text-cleaner", category: "ข้อความ", targetId: "text-clean", mode: "clean-html-and-text" },

  { sourceId: "image-resize", category: "รูปภาพ", targetId: "image-resize", mode: "resize" },
  { sourceId: "image-crop", category: "รูปภาพ", targetId: "image-crop", mode: "crop" },
  { sourceId: "image-compressor", category: "รูปภาพ", targetId: "image-compressor", mode: "compress" },
  { sourceId: "jpg-to-png", category: "รูปภาพ", targetId: "jpg-to-png", mode: "convert" },
  { sourceId: "png-to-jpg", category: "รูปภาพ", targetId: "png-to-jpg", mode: "convert" },
  { sourceId: "image-to-webp", category: "รูปภาพ", targetId: "image-to-webp", mode: "convert" },
  { sourceId: "webp-to-png", category: "รูปภาพ", targetId: "webp-to-png", mode: "convert" },
  { sourceId: "remove-image-metadata", category: "รูปภาพ", targetId: "remove-image-metadata", mode: "strip-metadata" },
  { sourceId: "image-to-base64", category: "รูปภาพ", targetId: "image-to-base64", mode: "encode" },
  { sourceId: "base64-to-image", category: "รูปภาพ", targetId: "base64-to-image", mode: "decode" },
  { sourceId: "color-picker", category: "รูปภาพ", targetId: "color-picker", mode: "hex-rgb-hsl" },
  { sourceId: "favicon-generator", category: "รูปภาพ", targetId: "favicon-generator", mode: "png-icon-set" },

  { sourceId: "json-formatter", category: "นักพัฒนา", targetId: "json-toolkit", mode: "format-minify-indent-sort-keys" },
  { sourceId: "json-validator", category: "นักพัฒนา", targetId: "json-toolkit", mode: "validate" },
  { sourceId: "json-viewer", category: "นักพัฒนา", targetId: "json-toolkit", mode: "view-tree" },
  { sourceId: "jwt-decoder", category: "นักพัฒนา", targetId: "jwt-decoder", mode: "decode-header-payload" },
  { sourceId: "regex-tester", category: "นักพัฒนา", targetId: "regex-tester", mode: "flags-and-matches" },
  { sourceId: "cron-helper", category: "นักพัฒนา", targetId: "cron-helper", mode: "validate-explain" },
  { sourceId: "sql-formatter", category: "นักพัฒนา", targetId: "sql-formatter", mode: "format" },
  { sourceId: "html-beautifier", category: "นักพัฒนา", targetId: "html-beautifier", mode: "beautify" },
  { sourceId: "css-beautifier", category: "นักพัฒนา", targetId: "css-beautifier", mode: "beautify" },
  { sourceId: "javascript-beautifier", category: "นักพัฒนา", targetId: "javascript-beautifier", mode: "beautify" },
  { sourceId: "html-minifier", category: "นักพัฒนา", targetId: "html-minifier", mode: "minify" },
  { sourceId: "css-minifier", category: "นักพัฒนา", targetId: "css-minifier", mode: "minify" },
  { sourceId: "javascript-minifier", category: "นักพัฒนา", targetId: "javascript-minifier", mode: "minify" },
  { sourceId: "url-parser", category: "นักพัฒนา", targetId: "url-toolkit", mode: "parse-url" },

  { sourceId: "json-to-yaml", category: "ตัวแปลง", targetId: "json-yaml", mode: "json-to-yaml" },
  { sourceId: "yaml-to-json", category: "ตัวแปลง", targetId: "json-yaml", mode: "yaml-to-json" },
  { sourceId: "csv-to-json", category: "ตัวแปลง", targetId: "csv-json", mode: "csv-to-json" },
  { sourceId: "json-to-csv", category: "ตัวแปลง", targetId: "csv-json", mode: "json-to-csv" },
  { sourceId: "base64-encode", category: "ตัวแปลง", targetId: "base64", mode: "encode" },
  { sourceId: "base64-decode", category: "ตัวแปลง", targetId: "base64", mode: "decode" },
  { sourceId: "url-encode", category: "ตัวแปลง", targetId: "url-toolkit", mode: "encode" },
  { sourceId: "url-decode", category: "ตัวแปลง", targetId: "url-toolkit", mode: "decode" },
  { sourceId: "timestamp-converter", category: "ตัวแปลง", targetId: "timestamp-converter", mode: "seconds-milliseconds-and-local-time" },
  { sourceId: "color-converter", category: "ตัวแปลง", targetId: "color-picker", mode: "hex-rgb-hsl" },
  { sourceId: "number-base-converter", category: "ตัวแปลง", targetId: "number-base-converter", mode: "binary-octal-decimal-hex" },
  { sourceId: "unit-converter", category: "ตัวแปลง", targetId: "unit-converter", mode: "distance-weight-temperature-area" },
  { sourceId: "youtube-converter", category: "ตัวแปลง", targetId: null, mode: null, exclusion: "ต้องเรียก API ภายนอก" },

  { sourceId: "csv-viewer", category: "ข้อมูล", targetId: "csv-workspace", mode: "csv-viewer" },
  { sourceId: "csv-to-table", category: "ข้อมูล", targetId: "csv-workspace", mode: "csv-to-table" },
  { sourceId: "remove-duplicate-rows", category: "ข้อมูล", targetId: "csv-workspace", mode: "remove-duplicate-rows" },
  { sourceId: "sort-table", category: "ข้อมูล", targetId: "csv-workspace", mode: "sort-table" },
  { sourceId: "filter-table", category: "ข้อมูล", targetId: "csv-workspace", mode: "filter-table" },
  { sourceId: "column-extractor", category: "ข้อมูล", targetId: "csv-workspace", mode: "column-extractor" },
  { sourceId: "table-to-json", category: "ข้อมูล", targetId: "csv-workspace", mode: "table-to-json" },
  { sourceId: "table-to-csv", category: "ข้อมูล", targetId: "csv-workspace", mode: "table-to-csv" },

  { sourceId: "uuid-generator", category: "ตัวสร้าง", targetId: "hash-uuid", mode: "uuid-v4" },
  { sourceId: "password-generator", category: "ตัวสร้าง", targetId: "password-generator", mode: "password-options" },
  { sourceId: "random-string-generator", category: "ตัวสร้าง", targetId: "random-string-generator", mode: "custom-character-set" },
  { sourceId: "qr-generator", category: "ตัวสร้าง", targetId: "qr-generator", mode: "text-url-wifi-phone" },
  { sourceId: "hash-generator", category: "ตัวสร้าง", targetId: "hash-uuid", mode: "sha-text-or-file" },
  { sourceId: "lorem-generator", category: "ตัวสร้าง", targetId: "lorem-generator", mode: "words-or-paragraphs" },
  { sourceId: "random-number-generator", category: "ตัวสร้าง", targetId: "random-number-generator", mode: "range-and-unique" },

  { sourceId: "date-difference", category: "วันและเวลา", targetId: "date-calculator", mode: "date-difference-and-workdays" },
  { sourceId: "thai-year", category: "วันและเวลา", targetId: "thai-year", mode: "be-ce" },
  { sourceId: "pomodoro", category: "วันและเวลา", targetId: "pomodoro", mode: "focus-and-break" },
  { sourceId: "shared-checklist", category: "แชร์", targetId: "checklist", mode: "local-checklist-import-export" },
  { sourceId: "short-link", category: "แชร์", targetId: null, mode: null, exclusion: "ต้องใช้บริการสร้างลิงก์และจัดเก็บลิงก์" },
  { sourceId: "burn-note", category: "แชร์", targetId: null, mode: null, exclusion: "ต้องส่งและจัดเก็บข้อความบนเซิร์ฟเวอร์" },
  { sourceId: "split-bill", category: "คำนวณ", targetId: "split-bill", mode: "service-vat-tip-per-person" },
  { sourceId: "bmi-tdee", category: "คำนวณ", targetId: "bmi-tdee", mode: "adult-bmi-tdee" },
];
