import { describe, expect, it } from "vitest";
import { objectsToCsv, parseCsv, validateTabularFile } from "./dataUtils";

describe("CSV helpers", () => {
  it("parses quoted commas, escaped quotes, and embedded newlines", () => {
    expect(parseCsv('name,note\r\nAda,"said ""hello"", then\nleft"\r\nBob,ready')).toEqual([
      ["name", "note"],
      ["Ada", 'said "hello", then\nleft'],
      ["Bob", "ready"],
    ]);
    expect(parseCsv('\uFEFFname,value\nAda,1')).toEqual([["name", "value"], ["Ada", "1"]]);
  });

  it("reports malformed quote placement and unclosed fields", () => {
    expect(() => parseCsv('a,"open')).toThrow("ยังไม่ปิด");
    expect(() => parseCsv('a,"closed"tail')).toThrow("ต่อท้าย");
    expect(() => parseCsv('a,ab"cd')).toThrow("กลางช่องข้อมูล");
  });

  it("escapes values when exporting and validates local table files", () => {
    expect(objectsToCsv([{ note: 'line 1, "quoted"\nline 2' }])).toBe('note\n"line 1, ""quoted""\nline 2"');
    expect(() => validateTabularFile({ name: "table.csv", size: 101, type: "text/csv" }, 100)).toThrow("เกิน");
    expect(() => validateTabularFile({ name: "payload.svg", size: 10, type: "image/svg+xml" }, 100)).toThrow("รองรับเฉพาะ");
    expect(() => validateTabularFile({ name: "empty.json", size: 0, type: "application/json" }, 100)).toThrow("ว่างเปล่า");
  });
});
