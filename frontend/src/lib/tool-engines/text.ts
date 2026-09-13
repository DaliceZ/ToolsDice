import { diffWordsWithSpace } from "diff";

export type TransformMode =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "trim"
  | "collapse";

export function transformText(input: string, mode: TransformMode): string {
  if (mode === "upper") return input.toLocaleUpperCase();
  if (mode === "lower") return input.toLocaleLowerCase();
  if (mode === "title")
    return input
      .toLocaleLowerCase()
      .replace(/(^|\s)\p{L}/gu, (value) => value.toLocaleUpperCase());
  if (mode === "sentence")
    return input
      .toLocaleLowerCase()
      .replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (value) =>
        value.toLocaleUpperCase(),
      );
  if (mode === "trim")
    return input
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim();
  return input
    .split(/\r?\n/u)
    .map((line) => line.replace(/[ \t]+/gu, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function textStatistics(input: string) {
  const words = countWords(input);
  return {
    characters: countCharacters(input),
    charactersNoSpaces: countCharacters(input.replace(/\s/gu, "")),
    words,
    lines: input ? input.split(/\r?\n/u).length : 0,
    paragraphs: countParagraphs(input),
    readingTimeMinutes: readingTimeMinutes(words),
    bytes: new TextEncoder().encode(input).length,
  };
}

type SegmenterLike = {
  segment: (input: string) => Iterable<{
    segment: string;
    isWordLike?: boolean;
  }>;
};

type SegmenterConstructor = new (
  locales?: string | string[],
  options?: { granularity: "word" | "grapheme" },
) => SegmenterLike;

function getSegmenter(granularity: "word" | "grapheme") {
  const constructor = (Intl as typeof Intl & {
    Segmenter?: SegmenterConstructor;
  }).Segmenter;
  return constructor ? new constructor("th", { granularity }) : null;
}

export function countWords(input: string): number {
  if (!input.trim()) return 0;
  const segmenter = getSegmenter("word");
  if (segmenter) {
    return Array.from(segmenter.segment(input)).filter(
      (part) => part.isWordLike,
    ).length;
  }
  return input.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
}

export function countCharacters(input: string): number {
  const segmenter = getSegmenter("grapheme");
  return segmenter ? Array.from(segmenter.segment(input)).length : [...input].length;
}

export function countParagraphs(input: string): number {
  return input.trim() ? input.trim().split(/\n\s*\n/u).length : 0;
}

export function readingTimeMinutes(words: number): number {
  return words ? Math.max(1, Math.ceil(words / 200)) : 0;
}

export type LineSortMode = "az" | "za" | "numeric" | "random";

export function removeDuplicateLines(input: string): string {
  const seen = new Set<string>();
  return input
    .split(/\r?\n/u)
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .join("\n");
}

export function sortLines(input: string, mode: LineSortMode): string {
  const lines = input.split(/\r?\n/u);
  if (!input) return "";
  if (mode === "random") {
    for (let index = lines.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [lines[index], lines[target]] = [lines[target], lines[index]];
    }
    return lines.join("\n");
  }
  const sorted = [...lines].sort((left, right) => {
    if (mode === "numeric") {
      const leftNumber = Number(left.trim());
      const rightNumber = Number(right.trim());
      if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber))
        return leftNumber - rightNumber;
    }
    return left.localeCompare(right, "th", {
      numeric: true,
      sensitivity: "base",
    });
  });
  return (mode === "za" ? sorted.reverse() : sorted).join("\n");
}

export function removeEmptyLines(input: string): string {
  return input
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

export function replaceText(
  input: string,
  search: string,
  replacement: string,
  caseSensitive = true,
): { output: string; count: number } {
  if (!search) return { output: input, count: 0 };
  if (caseSensitive) {
    const count = input.split(search).length - 1;
    return { output: input.split(search).join(replacement), count };
  }
  const lowerInput = input.toLocaleLowerCase();
  const lowerSearch = search.toLocaleLowerCase();
  let cursor = 0;
  let count = 0;
  let output = "";
  while (cursor < input.length) {
    const found = lowerInput.indexOf(lowerSearch, cursor);
    if (found < 0) {
      output += input.slice(cursor);
      break;
    }
    output += input.slice(cursor, found) + replacement;
    count += 1;
    cursor = found + search.length;
  }
  return { output, count };
}

export type ReverseMode = "characters" | "words" | "lines";

export function reverseText(input: string, mode: ReverseMode): string {
  if (mode === "characters") {
    const segmenter = getSegmenter("grapheme");
    const characters = segmenter
      ? Array.from(segmenter.segment(input), (part) => part.segment)
      : [...input];
    return characters.reverse().join("");
  }
  if (mode === "words") {
    return input.trim() ? input.trim().split(/\s+/u).reverse().join(" ") : "";
  }
  return input.split(/\r?\n/u).reverse().join("\n");
}

export function textToSlug(input: string): string {
  return input
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

const englishKeyboard = {
  "1": "ๅ",
  "2": "/",
  "3": "-",
  "4": "ภ",
  "5": "ถ",
  "6": "ุ",
  "7": "ึ",
  "8": "ค",
  "9": "ต",
  "0": "จ",
  "-": "ข",
  "=": "ช",
  q: "ๆ",
  w: "ไ",
  e: "ำ",
  r: "พ",
  t: "ะ",
  y: "ั",
  u: "ี",
  i: "ร",
  o: "น",
  p: "ย",
  "[": "บ",
  "]": "ล",
  a: "ฟ",
  s: "ห",
  d: "ก",
  f: "ด",
  g: "เ",
  h: "้",
  j: "่",
  k: "า",
  l: "ส",
  ";": "ว",
  "'": "ง",
  z: "ผ",
  x: "ป",
  c: "แ",
  v: "อ",
  b: "ิ",
  n: "ื",
  m: "ท",
  ",": "ม",
  ".": "ใ",
  "/": "ฝ",
} as const;

const thaiKeyboard = Object.fromEntries(
  Object.entries(englishKeyboard).map(([english, thai]) => [thai, english]),
) as Record<string, string>;

export function switchKeyboardLanguage(input: string): string {
  const englishHits = [...input].filter((character) => character in englishKeyboard).length;
  const thaiHits = [...input].filter((character) => character in thaiKeyboard).length;
  const toThai = englishHits >= thaiHits;
  return [...input]
    .map((character) =>
      toThai
        ? englishKeyboard[character as keyof typeof englishKeyboard] ?? character
        : thaiKeyboard[character] ?? character,
    )
    .join("");
}

const thaiDigits = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const thaiPositions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

function readThaiUnderMillion(value: string): string {
  const digits = value.padStart(6, "0").slice(-6).split("").map(Number);
  let output = "";
  digits.forEach((digit, index) => {
    if (!digit) return;
    const position = 5 - index;
    if (position === 1) {
      output += digit === 1 ? "สิบ" : digit === 2 ? "ยี่สิบ" : `${thaiDigits[digit]}สิบ`;
      return;
    }
    if (position === 0 && digit === 1 && output) {
      output += "เอ็ด";
      return;
    }
    output += `${digit === 1 && position > 0 ? "หนึ่ง" : thaiDigits[digit]}${thaiPositions[position]}`;
  });
  return output;
}

export function readThaiNumber(value: string): string {
  const normalized = value.replace(/^0+(?=\d)/u, "");
  if (!normalized || /^0+$/u.test(normalized)) return thaiDigits[0];
  if (normalized.length > 6) {
    const high = normalized.slice(0, -6);
    const low = normalized.slice(-6);
    return `${readThaiNumber(high)}ล้าน${/^0+$/u.test(low) ? "" : readThaiUnderMillion(low)}`;
  }
  return readThaiUnderMillion(normalized);
}

export function thaiMoneyToWords(input: string): string {
  const normalized = input.trim();
  const match = normalized.match(/^(-?)([\d,]+)(?:\.(\d+))?$/u);
  if (!match) throw new Error("กรุณาระบุจำนวนเงินเป็นตัวเลข เช่น 1250.50");
  const [, sign, formattedInteger, decimal = ""] = match;
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/u.test(formattedInteger))
    throw new Error("เครื่องหมายจุลภาคต้องคั่นหลักพัน เช่น 1,250.50");
  if (decimal.length > 2) throw new Error("จำนวนสตางค์ต้องมีไม่เกิน 2 หลัก");
  const integer = formattedInteger.replace(/,/gu, "");
  const baht = readThaiNumber(integer);
  const satang = decimal.padEnd(2, "0");
  const satangValue = Number(satang);
  return `${sign ? "ลบ" : ""}${baht}บาท${satangValue ? `${readThaiNumber(satang)}สตางค์` : "ถ้วน"}`;
}

export function cleanTextAndHtml(input: string): string {
  return input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, "")
    .replace(/<[^>]*>/gu, "")
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "")
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}\n]/gu, "")
    .replace(/[ \t]+/gu, " ")
    .replace(/\s+([,.;:!?%])/gu, "$1")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; language: string; text: string }
  | { type: "rule" };

export function parseMarkdown(input: string): MarkdownBlock[] {
  const lines = input.replace(/\r\n/gu, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const fence = line.match(/^```\s*([\w-]*)\s*$/u);
    if (fence) {
      index += 1;
      const code: string[] = [];
      while (index < lines.length && !/^```\s*$/u.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: "code", language: fence[1] ?? "", text: code.join("\n") });
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/u);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length as 1 | 2 | 3, text: heading[2] });
      index += 1;
      continue;
    }
    if (/^(?:---+|\*\*\*+|___+)\s*$/u.test(line)) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }
    const list = line.match(/^\s*([-*+] |\d+[.)] )(.+)$/u);
    if (list) {
      const ordered = /^\d/.test(list[1]);
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].match(ordered ? /^\s*\d+[.)] (.+)$/u : /^\s*[-*+] (.+)$/u);
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    if (/^>\s?/u.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/u.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/u, ""));
        index += 1;
      }
      blocks.push({ type: "quote", text: quote.join("\n") });
      continue;
    }
    const paragraph: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(?:#{1,3}\s|```|>\s?|\s*[-*+] |\s*\d+[.)] )/u.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join("\n") });
  }
  return blocks;
}

export const compareText = (before: string, after: string) =>
  diffWordsWithSpace(before, after);
