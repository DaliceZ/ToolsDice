export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type ChecklistFile = {
  version: 1;
  items: ChecklistItem[];
};

const maximumItems = 500;
const maximumTextLength = 500;

export function parseChecklistJson(input: string): ChecklistItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input) as unknown;
  } catch {
    throw new Error("ไฟล์ JSON อ่านไม่ได้ กรุณาตรวจรูปแบบแล้วลองนำเข้าอีกครั้ง");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("version" in parsed) ||
    parsed.version !== 1 ||
    !("items" in parsed) ||
    !Array.isArray(parsed.items)
  ) {
    throw new Error("ไฟล์นี้ไม่ใช่ Checklist JSON เวอร์ชัน 1");
  }
  if (parsed.items.length > maximumItems)
    throw new Error(`นำเข้าได้ไม่เกิน ${maximumItems} รายการต่อครั้ง`);

  const ids = new Set<string>();
  return parsed.items.map((item, index) => {
    if (
      !item ||
      typeof item !== "object" ||
      !("id" in item) ||
      typeof item.id !== "string" ||
      !/^[\w-]{1,64}$/u.test(item.id) ||
      ids.has(item.id) ||
      !("text" in item) ||
      typeof item.text !== "string" ||
      !item.text.trim() ||
      item.text.length > maximumTextLength ||
      !("done" in item) ||
      typeof item.done !== "boolean"
    ) {
      throw new Error(`รูปแบบรายการที่ ${index + 1} ไม่ถูกต้อง`);
    }
    ids.add(item.id);
    return { id: item.id, text: item.text, done: item.done };
  });
}

export function serializeChecklist(items: ChecklistItem[]): string {
  return JSON.stringify({ version: 1, items } satisfies ChecklistFile, null, 2);
}

export function validateChecklistFileSize(size: number, maxBytes = 1_048_576): void {
  if (size <= 0) throw new Error("ไฟล์นี้ว่างเปล่า กรุณาเลือกไฟล์อื่น");
  if (size > maxBytes) throw new Error("ไฟล์ Checklist ต้องมีขนาดไม่เกิน 1 MB");
}
