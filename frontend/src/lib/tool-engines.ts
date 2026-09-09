import { diffWordsWithSpace } from "diff";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

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
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function textStatistics(input: string) {
  return {
    characters: [...input].length,
    charactersNoSpaces: [...input.replace(/\s/gu, "")].length,
    words: input.trim() ? input.trim().split(/\s+/u).length : 0,
    lines: input ? input.split(/\r?\n/u).length : 0,
    bytes: new TextEncoder().encode(input).length,
  };
}

export const compareText = (before: string, after: string) =>
  diffWordsWithSpace(before, after);

export function parseTimestamp(input: string): Date {
  const trimmed = input.trim();
  const numeric = Number(trimmed);
  const date =
    trimmed && Number.isFinite(numeric)
      ? new Date(Math.abs(numeric) < 100_000_000_000 ? numeric * 1000 : numeric)
      : new Date(trimmed);
  if (!trimmed || Number.isNaN(date.getTime()))
    throw new Error("รูปแบบวันเวลาหรือ timestamp ไม่ถูกต้อง");
  return date;
}

export function formatInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone,
  }).format(date);
}

export function formatJson(input: string, minify = false): string {
  if (!input.trim()) return "";
  return JSON.stringify(JSON.parse(input), null, minify ? 0 : 2);
}

export function convertStructured(
  input: string,
  direction: "json-to-yaml" | "yaml-to-json",
): string {
  if (!input.trim()) return "";
  return direction === "json-to-yaml"
    ? stringifyYaml(JSON.parse(input), { indent: 2 })
    : JSON.stringify(parseYaml(input), null, 2);
}

export function base64Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function base64Decode(input: string): string {
  const normalized = input.replace(/\s/g, "");
  const binary = atob(normalized);
  return new TextDecoder("utf-8", { fatal: true }).decode(
    Uint8Array.from(binary, (char) => char.charCodeAt(0)),
  );
}

export function parsePageSelection(input: string, pageCount: number): number[] {
  if (!input.trim()) throw new Error("กรุณาระบุหมายเลขหน้า");
  const pages: number[] = [];
  for (const part of input.split(",").map((item) => item.trim())) {
    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error(`ช่วงหน้า “${part}” ไม่ถูกต้อง`);
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end < start || end > pageCount)
      throw new Error(`หน้าต้องอยู่ระหว่าง 1-${pageCount}`);
    for (let page = start; page <= end; page += 1)
      if (!pages.includes(page - 1)) pages.push(page - 1);
  }
  return pages;
}

export async function sha(
  input: string,
  algorithm: "SHA-256" | "SHA-384" | "SHA-512",
): Promise<string> {
  const digest = await crypto.subtle.digest(
    algorithm,
    new TextEncoder().encode(input),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function parseQuery(input: string): string {
  const query = input.includes("?")
    ? input.slice(input.indexOf("?") + 1)
    : input.replace(/^\?/, "");
  const params = new URLSearchParams(query);
  return JSON.stringify(
    Array.from(params.entries()).map(([key, value]) => ({ key, value })),
    null,
    2,
  );
}

export function buildQuery(input: string): string {
  const rows = JSON.parse(input) as Array<{ key: string; value: string }>;
  if (!Array.isArray(rows))
    throw new Error("ข้อมูลต้องเป็น JSON array ของ key และ value");
  const params = new URLSearchParams();
  for (const row of rows) params.append(String(row.key), String(row.value));
  return params.toString();
}

export async function hashText(
  input: string,
  algorithm: "SHA-256" | "SHA-384" | "SHA-512",
): Promise<string> {
  const digest = await crypto.subtle.digest(
    algorithm,
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
