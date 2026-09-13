import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fallbackConfig } from "./api";
import { categories, tools, toolById } from "./tool-registry";
import { sourceToolCoverage } from "./tool-coverage";

describe("source catalog coverage", () => {
  it("maps all 87 retained source entries to valid local tool routes and modes", () => {
    const sourceIds = sourceToolCoverage.map((entry) => entry.sourceId);
    const retained = sourceToolCoverage.filter((entry) => entry.targetId !== null);
    expect(sourceIds).toHaveLength(90);
    expect(new Set(sourceIds).size).toBe(90);
    expect(retained).toHaveLength(87);
    for (const entry of retained) {
      expect(entry.mode, entry.sourceId).toBeTruthy();
      expect(toolById.has(entry.targetId!), entry.sourceId).toBe(true);
    }
    expect(sourceToolCoverage.filter((entry) => entry.targetId === null).map((entry) => entry.sourceId).sort()).toEqual([
      "burn-note", "short-link", "youtube-converter",
    ]);
  });

  it("exposes one unique target card per route in the nine chosen categories", () => {
    const targetIds = tools.map((tool) => tool.id);
    expect(targetIds).toHaveLength(70);
    expect(new Set(targetIds).size).toBe(targetIds.length);
    expect(toolById.size).toBe(targetIds.length);
    expect(categories).toEqual([
      "ทั้งหมด", "PDF", "ข้อความ", "รูปภาพ", "นักพัฒนา", "ตัวแปลง",
      "ข้อมูล", "ตัวสร้าง", "วันและเวลา", "คำนวณ",
    ]);
    expect(tools.some((tool) => /youtube|short-link|burn-note/iu.test(tool.id))).toBe(false);
  });

  it("keeps public runtime configuration aligned with the frontend registry", () => {
    const expected = tools.map((tool) => tool.id).sort();
    expect([...fallbackConfig.enabledToolIds].sort()).toEqual(expected);
    const apiSource = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../../backend/src/app.ts"), "utf8");
    const list = /const toolIds = \[([\s\S]*?)\] as const/u.exec(apiSource)?.[1];
    expect(list).toBeTruthy();
    const configured = [...(list ?? "").matchAll(/"([a-z0-9-]+)"/gu)].map((match) => match[1]).sort();
    expect(configured).toEqual(expected);
  });
});
