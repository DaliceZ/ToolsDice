/// <reference lib="webworker" />
import { degrees, PDFDocument } from "pdf-lib";

type PdfFile = { name: string; bytes: ArrayBuffer };
type Request = {
  files: PdfFile[];
  operation: "merge" | "split" | "reorder" | "rotate";
  pages: number[];
  rotation: number;
};

self.onmessage = async (event: MessageEvent<Request>) => {
  try {
    const { files, operation, pages, rotation } = event.data;
    if (!files.length) throw new Error("กรุณาเลือกไฟล์ PDF");
    const output = await PDFDocument.create();
    if (operation === "merge") {
      for (const file of files) {
        const source = await PDFDocument.load(file.bytes);
        const copied = await output.copyPages(source, source.getPageIndices());
        copied.forEach((page) => output.addPage(page));
      }
    } else {
      const source = await PDFDocument.load(files[0].bytes);
      const indexes = operation === "rotate" ? source.getPageIndices() : pages;
      const copied = await output.copyPages(source, indexes);
      copied.forEach((page) => {
        if (operation === "rotate")
          page.setRotation(
            degrees((page.getRotation().angle + rotation) % 360),
          );
        output.addPage(page);
      });
    }
    const bytes = await output.save();
    self.postMessage(
      { ok: true, bytes: bytes.buffer },
      { transfer: [bytes.buffer] },
    );
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : "ประมวลผล PDF ไม่สำเร็จ",
    });
  }
};
