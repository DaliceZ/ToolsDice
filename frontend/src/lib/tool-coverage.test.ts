import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fallbackConfig } from "./api";
import { categories, tools, toolById } from "./tool-registry";
import { sourceToolCoverage } from "./tool-coverage";

describe("source catalog coverage", () => {
  it("maps all 59 retained source entries to valid local tool routes and modes", () => {
    const sourceIds = sourceToolCoverage.map((entry) => entry.sourceId);
    const retained = sourceToolCoverage.filter((entry) => entry.targetId !== null);
    expect(sourceIds).toHaveLength(90);
    expect(new Set(sourceIds).size).toBe(90);
    expect(retained).toHaveLength(59);
    for (const entry of retained) {
      expect(entry.mode, entry.sourceId).toBeTruthy();
      expect(toolById.has(entry.targetId!), entry.sourceId).toBe(true);
    }
    expect(sourceToolCoverage.filter((entry) => entry.targetId === null).map((entry) => entry.sourceId).sort()).toEqual([
      "burn-note", "column-extractor", "cron-helper", "csv-to-json", "csv-to-table",
      "csv-viewer", "filter-table", "json-to-csv", "json-to-yaml", "json-viewer",
      "markdown-preview", "pomodoro", "remove-duplicate-rows", "remove-empty-lines",
      "shared-checklist", "short-link", "sort-lines", "sort-table", "table-to-csv",
      "table-to-json", "text-case", "text-cleaner", "text-statistics", "text-to-slug",
      "timestamp-converter", "trim-spaces", "url-decode", "url-encode", "url-parser",
      "yaml-to-json", "youtube-converter",
    ]);
  });

  it("exposes the seven text tools in the configured order", () => {
    expect(tools.filter((tool) => tool.category === "ข้อความ").map((tool) => tool.id)).toEqual([
      "text-keyboard",
      "text-find-replace",
      "text-diff",
      "text-money",
      "text-reverse",
      "text-word-count",
      "text-remove-duplicates",
    ]);
  });

  it("exposes one unique target card per route in the chosen categories", () => {
    const targetIds = tools.map((tool) => tool.id);
    expect(targetIds).toHaveLength(52);
    expect(new Set(targetIds).size).toBe(targetIds.length);
    expect(toolById.size).toBe(targetIds.length);
    expect(categories).toEqual([
      "ทั้งหมด", "PDF", "ข้อความ", "รูปภาพ", "นักพัฒนา", "ตัวแปลง",
      "ตัวสร้าง", "วันและเวลา", "คำนวณ",
    ]);
    expect(tools.some((tool) => /youtube|short-link|burn-note/iu.test(tool.id))).toBe(false);
    expect(tools.filter((tool) => tool.category === "นักพัฒนา").map((tool) => tool.id)).toEqual([
      "api-client", "jwt-decoder", "regex-tester", "code-formatter",
    ]);
    expect(tools.filter((tool) => tool.category === "ตัวแปลง").map((tool) => tool.id)).toEqual([
      "currency-converter", "thai-year", "unit-converter", "number-base-converter", "base64",
    ]);
    expect(tools.filter((tool) => tool.category === "ตัวสร้าง").map((tool) => tool.id)).toEqual([
      "qr-generator", "random-number-generator", "password-generator", "random-picker",
      "hash-uuid", "random-string-generator", "lorem-generator",
    ]);
    expect(tools.filter((tool) => tool.category === "วันและเวลา").map((tool) => tool.id)).toEqual([
      "date-calculator", "timezone-converter",
    ]);
    expect(tools.filter((tool) => tool.category === "คำนวณ").map((tool) => tool.id)).toEqual([
      "split-bill", "bmi-tdee", "loan-calculator", "savings-calculator", "trip-cost-calculator",
    ]);
  });

  it("keeps public runtime configuration aligned with the frontend registry", () => {
    const expected = tools.map((tool) => tool.id).sort();
    expect([...fallbackConfig.enabledToolIds].sort()).toEqual(expected);
    const apiSource = readFileSync(
      resolve(
        dirname(fileURLToPath(import.meta.url)),
        "../../../backend/src/application.ts",
      ),
      "utf8",
    );
    const list = /const toolIds = \[([\s\S]*?)\] as const/u.exec(apiSource)?.[1];
    expect(list).toBeTruthy();
    const configured = [...(list ?? "").matchAll(/"([a-z0-9-]+)"/gu)].map((match) => match[1]).sort();
    expect(configured).toEqual(expected);
  });
});
