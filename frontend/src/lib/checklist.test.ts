import { describe, expect, it } from "vitest";
import { parseChecklistJson, serializeChecklist, validateChecklistFileSize } from "./checklist";

describe("local Checklist JSON", () => {
  it("round trips valid items without changing their fields", () => {
    const items = [{ id: "task-1", text: "อ่านหนังสือ", done: true }];
    expect(parseChecklistJson(serializeChecklist(items))).toEqual(items);
  });

  it("rejects malformed, duplicate, overlong, and unsupported-version data", () => {
    expect(() => parseChecklistJson("{" )).toThrow("อ่านไม่ได้");
    expect(() => parseChecklistJson('{"version":2,"items":[]}')).toThrow("เวอร์ชัน 1");
    expect(() => parseChecklistJson(JSON.stringify({ version: 1, items: [
      { id: "same", text: "หนึ่ง", done: false },
      { id: "same", text: "สอง", done: false },
    ] }))).toThrow("รายการที่ 2");
    expect(() => parseChecklistJson(JSON.stringify({ version: 1, items: [{ id: "x", text: "x".repeat(501), done: false }] }))).toThrow("รายการที่ 1");
  });

  it("limits explicit JSON import by file size", () => {
    validateChecklistFileSize(1024);
    expect(() => validateChecklistFileSize(1_048_577)).toThrow("1 MB");
    expect(() => validateChecklistFileSize(0)).toThrow("ว่างเปล่า");
  });
});
