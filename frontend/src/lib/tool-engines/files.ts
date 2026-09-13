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

export type LocalFileKind = "image" | "pdf";

export function validateLocalFile(
  file: Pick<File, "name" | "size" | "type">,
  kind: LocalFileKind,
  maxBytes: number,
): void {
  if (file.size <= 0) throw new Error("ไฟล์นี้ว่างเปล่า กรุณาเลือกไฟล์อื่น");
  if (file.size > maxBytes) {
    const maxMegabytes = Math.max(1, Math.floor(maxBytes / 1024 / 1024));
    throw new Error(`ไฟล์มีขนาดเกิน ${maxMegabytes} MB กรุณาเลือกไฟล์ที่เล็กกว่า`);
  }

  const extension = file.name.split(".").pop()?.toLocaleLowerCase("en") ?? "";
  const valid =
    kind === "pdf"
      ? file.type === "application/pdf" || (!file.type && extension === "pdf")
      : ["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        (!file.type && ["jpg", "jpeg", "png", "webp"].includes(extension));
  if (!valid) {
    throw new Error(
      kind === "pdf"
        ? "รองรับเฉพาะไฟล์ PDF กรุณาเลือกไฟล์ .pdf"
        : "รองรับเฉพาะ JPG, PNG และ WebP กรุณาเลือกไฟล์ชนิดที่รองรับ",
    );
  }
}
