import { ChoiceMenu, type Choice } from "@/components/ChoiceMenu";
import { uiText } from "@/lib/ui-text";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Download,
  FilePlus2,
  FileText,
  GripVertical,
  Hash,
  LoaderCircle,
  Move,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  UploadCloud,
  X,
  ZoomIn,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { parsePageSelection, validateLocalFile } from "../../lib/tool-engines";

const PdfMaxBytesContext = createContext(104_857_600);

export function PdfToolPanel({ toolId }: { toolId: string }) {
  if (toolId === "pdf-text") return <PdfText />;
  if (toolId === "merge-pdf") return <MergePdf />;
  if (toolId === "manage-pdf-pages") return <OrganizePdf />;
  if (toolId === "split-pdf") return <SplitPdf />;
  if (toolId === "compress-pdf") return <CompressPdf />;
  if (toolId === "pdf-to-images") return <PdfToImages />;
  if (toolId === "images-to-pdf") return <ImagesToPdf />;
  if (toolId === "page-number-pdf") return <PageNumbersPdf />;
  if (toolId === "add-watermark") return <WatermarkPdf />;
  if (toolId === "pdf-metadata") return <PdfMetadata />;
  return null;
}

export function PdfWorkspacePanel({
  toolId = "merge-pdf",
  maxFileBytes = 104_857_600,
}: {
  toolId?: string;
  maxFileBytes?: number;
}) {
  return (
    <PdfMaxBytesContext.Provider value={maxFileBytes}>
      <PdfToolPanel toolId={toolId} />
    </PdfMaxBytesContext.Provider>
  );
}

function PdfText() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState("");
  const [text, setText] = useState("");
  const outputId = useId();
  const task = useTask();
  const extract = () =>
    task.run(async (signal) => {
      if (!file) throw new Error("กรุณาเลือกไฟล์ PDF");
      const opened = await loadPdfDocument(file, signal);
      const sections: string[] = [];
      let selection: number[] = [];
      try {
        const document = opened.document;
        selection =
          !pages.trim() || pages.trim().toLowerCase() === "all"
            ? Array.from({ length: document.numPages }, (_, index) => index)
            : parsePageSelection(pages, document.numPages);
        for (const [index, pageIndex] of selection.entries()) {
          throwIfAborted(signal);
          task.progress(`กำลังอ่านหน้า ${index + 1} จาก ${selection.length}`);
          const page = await document.getPage(pageIndex + 1);
          const content = await page.getTextContent();
          sections.push(
            `หน้า ${pageIndex + 1}\n${content.items.map((item) => ("str" in item ? item.str : "")).join(" ")}`,
          );
          page.cleanup();
        }
      } finally {
        await opened.close();
      }
      throwIfAborted(signal);
      setText(sections.join("\n\n"));
      return `ข้อความหน้า PDF ดึงสำเร็จ ${selection.length} หน้า`;
    }, "ดึงข้อความไม่สำเร็จ กรุณาตรวจไฟล์ PDF และช่วงหน้าที่เลือก");
  return (
    <Surface>
      <FilePicker
        files={file ? [file] : []}
        accept="application/pdf,.pdf"
        label={uiText("เลือก PDF ที่มีชั้นข้อความ")}
        detail="PDF ที่เป็นภาพสแกนอาจไม่มีข้อความให้คัดลอก"
        onFiles={(files) => {
          setFile(files[0] ?? null);
          setText("");
        }}
      />
      <Field label={uiText("หน้าที่ต้องการอ่าน")}>
        <input
          value={pages}
          onChange={(event) => setPages(event.target.value)}
          placeholder={uiText("เว้นว่างเพื่ออ่านทุกหน้า เช่น 1-3,5")}
        />
      </Field>
      <Action
        task={task}
        disabled={!file}
        onClick={extract}
        label={uiText("ดึงข้อความ")}
      />
      {text && (
        <div className="editor output-editor">
          <div className="editor-heading">
            <label htmlFor={outputId}>{uiText("ข้อความจาก PDF")}</label>
            <div className="editor-actions">
              <CopyButton value={text} />
              <button
                className="copy-button"
                type="button"
                onClick={() =>
                  downloadBlob(
                    new Blob([text], { type: "text/plain;charset=utf-8" }),
                    "pdf-text.txt",
                  )
                }
              >
                <Download size={15} />
                {uiText("ดาวน์โหลด")}
              </button>
            </div>
          </div>
          <textarea
            id={outputId}
            aria-label={uiText("ข้อความจาก PDF")}
            value={text}
            readOnly
          />
        </div>
      )}
      <Status task={task} />
    </Surface>
  );
}

function MergePdf() {
  const nextSourceId = useRef(0);
  const [sources, setSources] = useState<MergePdfSource[]>([]);
  const [arrangePages, setArrangePages] = useState(false);
  const [mergedPages, setMergedPages] = useState<MergePageItem[]>([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [pagesMessage, setPagesMessage] = useState("");
  const [pagesError, setPagesError] = useState("");
  const [viewer, setViewer] = useState<MergePageItem | null>(null);
  const task = useTask();
  const files = sources.map((source) => source.file);
  const addFiles = (incoming: File[]) => {
    if (!incoming.length) return;
    const additions = incoming.map((file) => ({
      id: nextSourceId.current++,
      file,
    }));
    setSources((current) => [
      ...current,
      ...additions,
    ]);
  };
  const removeFile = (index: number) => {
    const removed = sources[index];
    if (!removed) return;
    setSources((current) => current.filter((source) => source.id !== removed.id));
    setMergedPages((current) =>
      current.filter((page) => page.sourceId !== removed.id),
    );
    if (viewer?.sourceId === removed.id) setViewer(null);
  };

  useEffect(() => {
    if (!arrangePages || !sources.length) {
      setMergedPages([]);
      setPagesLoading(false);
      setPagesMessage("");
      setPagesError("");
      return;
    }

    let active = true;
    let controller: AbortController | null = null;
    const render = () => {
      controller?.abort();
      if (document.hidden) {
        setPagesLoading(false);
        setPagesMessage("ตัวอย่างจะทำงานต่อเมื่อกลับมาที่แท็บนี้");
        return;
      }
      controller = new AbortController();
      const signal = controller.signal;
      setPagesLoading(true);
      setPagesMessage("กำลังสร้างตัวอย่างหน้า...");
      setPagesError("");
      void (async () => {
        try {
          const renderedPages: MergePageItem[] = [];
          for (const source of sources) {
            throwIfAborted(signal);
            const result = await renderPdfThumbnails(
              source.file,
              () => {},
              Number.POSITIVE_INFINITY,
              signal,
            );
            renderedPages.push(
              ...result.pages.map((page) => ({
                ...page,
                id: `${source.id}:${page.originalIndex}`,
                sourceId: source.id,
                sourceFile: source.file,
                sourcePageCount: result.pageCount,
              })),
            );
          }
          if (!active || signal.aborted) return;
          setMergedPages((current) => {
            const refreshedById = new Map(
              renderedPages.map((page) => [page.id, page]),
            );
            const retained = current
              .map((page) => refreshedById.get(page.id))
              .filter((page): page is MergePageItem => Boolean(page));
            const retainedIds = new Set(retained.map((page) => page.id));
            const appended = renderedPages.filter(
              (page) => !retainedIds.has(page.id),
            );
            return [...retained, ...appended];
          });
          setPagesMessage("");
        } catch (reason) {
          if (!active || signal.aborted) return;
          setPagesError(
            messageOf(reason, "ไม่สามารถแสดงตัวอย่าง PDF ได้"),
          );
        } finally {
          if (active && !signal.aborted) setPagesLoading(false);
        }
      })();
    };

    document.addEventListener("visibilitychange", render);
    render();
    return () => {
      active = false;
      controller?.abort();
      document.removeEventListener("visibilitychange", render);
    };
  }, [arrangePages, sources]);

  const pagesReady =
    sources.length > 0 &&
    !pagesLoading &&
    !pagesError &&
    sources.every((source) =>
      mergedPages.some((page) => page.sourceId === source.id),
    );
  const merge = () =>
    task.run(async (signal) => {
      const { PDFDocument } = await import("pdf-lib");
      const output = await PDFDocument.create();
      let pageTotal = 0;
      if (arrangePages) {
        const sourceDocuments = new Map<
          number,
          Awaited<ReturnType<typeof PDFDocument.load>>
        >();
        for (const source of sources) {
          throwIfAborted(signal);
          task.progress("กำลังอ่าน " + source.file.name);
          sourceDocuments.set(
            source.id,
            await PDFDocument.load(await source.file.arrayBuffer()),
          );
        }
        for (const page of mergedPages) {
          throwIfAborted(signal);
          const source = sourceDocuments.get(page.sourceId);
          if (!source) throw new Error("ไม่พบไฟล์ต้นฉบับของหน้าที่เลือก");
          const [copiedPage] = await output.copyPages(source, [page.originalIndex]);
          output.addPage(copiedPage);
        }
        pageTotal = mergedPages.length;
      } else {
        for (const source of sources) {
          throwIfAborted(signal);
          task.progress("กำลังรวม " + source.file.name);
          const sourceDocument = await PDFDocument.load(
            await source.file.arrayBuffer(),
          );
          throwIfAborted(signal);
          const pages = await output.copyPages(
            sourceDocument,
            sourceDocument.getPageIndices(),
          );
          pages.forEach((page) => output.addPage(page));
          pageTotal += pages.length;
        }
      }
      throwIfAborted(signal);
      output.setTitle("Merged with ToolsDice");
      downloadBytes(
        await output.save({ useObjectStreams: true }),
        "toolsdice-merged.pdf",
        "application/pdf",
      );
      return "รวมสำเร็จ " + sources.length + " ไฟล์ · " + pageTotal + " หน้า";
    }, "ไม่สามารถรวม PDF ได้ กรุณาตรวจว่าไฟล์ไม่ถูกล็อกด้วยรหัสผ่าน");

  return (
    <Surface>
      <FilePicker
        multiple
        compact
        files={files}
        accept="application/pdf,.pdf"
        label={uiText("เลือก PDF ที่ต้องการรวม")}
        addMoreLabel={uiText("เพิ่ม PDF")}
        detail="เพิ่มได้หลายไฟล์ · เรียงลำดับก่อนดาวน์โหลด"
        onFiles={addFiles}
        showSelectedFiles={false}
        showPdfPreview={!arrangePages}
        onPreviewDownload={merge}
        previewDownloadDisabled={
          !files.length || (arrangePages && !pagesReady) || task.working
        }
      />
      {files.length > 0 && (
        <section className="pdf-manage-section merge-file-section">
          <h3>{uiText("จัดการไฟล์ PDF")}</h3>
          <SortableFiles
            files={files}
            allowMove={!arrangePages}
            onMove={(index, direction) =>
              setSources((current) => moveItem(current, index, index + direction))
            }
            onReorder={(from, to) =>
              setSources((current) => moveItem(current, from, to))
            }
            onRemove={removeFile}
          />
        </section>
      )}
      {files.length > 0 && (
        <section className="merge-arrangement-option">
          <label className="toggle-line">
            <input
              type="checkbox"
              checked={arrangePages}
              onChange={(event) => setArrangePages(event.currentTarget.checked)}
              aria-label={uiText("จัดเรียงหน้าก่อนรวม")}
            />
            <span>{uiText("จัดเรียงหน้าก่อนรวม")}</span>
          </label>
          <p className="helper-text">
            {uiText("เปิดเพื่อย้ายและจัดลำดับหน้าข้ามไฟล์ PDF ได้")}
          </p>
        </section>
      )}
      {arrangePages && files.length > 0 && (
        <section className="merge-page-section">
          <div className="pdf-section-heading">
            <h3>{uiText("ลำดับหน้าของไฟล์ที่จะรวม")}</h3>
            <div className="pdf-preview-heading-actions">
              <p>
                {mergedPages.length} {uiText("หน้าสำหรับไฟล์รวม")}
                {pagesReady ? ` · ${sources.length} ${uiText("ไฟล์ในชุด")}` : ""}
              </p>
              <PreviewDownloadButton
                onClick={merge}
                disabled={!files.length || !pagesReady || task.working}
              />
            </div>
          </div>
          {pagesLoading && (
            <InlineLoading text={pagesMessage || "กำลังสร้างตัวอย่างหน้า..."} />
          )}
          {!pagesLoading && pagesMessage && (
            <p className="helper-text" role="status">
              {uiText(pagesMessage)}
            </p>
          )}
          {pagesError && (
            <div className="inline-status error" role="alert">
              <p>{uiText(pagesError)}</p>
            </div>
          )}
          {mergedPages.length > 0 && (
            <div className="pdf-page-workarea">
              <div className="page-organizer merge-page-organizer">
                {mergedPages.map((page, index) => (
                  <article
                    className="page-tile sortable-item merge-page-tile"
                    key={page.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", String(index));
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const raw = event.dataTransfer.getData("text/plain");
                      const from = Number(raw);
                      if (raw && Number.isInteger(from))
                        setMergedPages((current) => moveItem(current, from, index));
                    }}
                    aria-roledescription={uiText("หน้าที่ลากจัดลำดับได้")}
                  >
                    <button
                      className="page-thumb page-preview-trigger"
                      type="button"
                      aria-label={
                        `${uiText("ขยายตัวอย่างหน้า PDF")} ${index + 1} · ${page.sourceFile.name}`
                      }
                      onClick={() => setViewer(page)}
                    >
                      <img
                        src={page.preview}
                        alt={`${page.sourceFile.name} · ${uiText("หน้า PDF")} ${page.originalIndex + 1}`}
                      />
                      <span>{index + 1}</span>
                      <ZoomIn size={16} />
                    </button>
                    <div className="page-details">
                      <GripVertical
                        className="drag-handle"
                        aria-hidden="true"
                        size={17}
                      />
                      <div>
                        <strong>
                          {index + 1}. {page.sourceFile.name}
                        </strong>
                        <small>
                          {uiText("หน้าเดิม ")}
                          {page.originalIndex + 1} · {Math.round(page.width)} ×{" "}
                          {Math.round(page.height)} pt
                        </small>
                      </div>
                    </div>
                    <div className="page-actions merge-page-actions">
                      <div
                        className="page-action-group"
                        role="group"
                        aria-label={`${uiText("จัดเรียง")} · ${page.sourceFile.name} · ${uiText("หน้า ")}${page.originalIndex + 1}`}
                      >
                        <span className="page-action-group-label">
                          {uiText("ลำดับผลลัพธ์")}
                        </span>
                        <div className="page-action-buttons">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() =>
                              setMergedPages((current) =>
                                moveItem(current, index, index - 1),
                              )
                            }
                            aria-label={`${uiText("เลื่อนขึ้น")} · ${uiText("หน้า ")}${index + 1}`}
                          >
                            <ArrowUp size={14} />
                            <span>{uiText("ขึ้น")}</span>
                          </button>
                          <button
                            type="button"
                            disabled={index === mergedPages.length - 1}
                            onClick={() =>
                              setMergedPages((current) =>
                                moveItem(current, index, index + 1),
                              )
                            }
                            aria-label={`${uiText("เลื่อนลง")} · ${uiText("หน้า ")}${index + 1}`}
                          >
                            <ArrowDown size={14} />
                            <span>{uiText("ลง")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
          {pagesReady && (
            <p className="helper-text">
              {uiText("ลากหน้าหรือใช้ปุ่มขึ้นลงเพื่อจัดลำดับข้ามไฟล์")}
            </p>
          )}
        </section>
      )}
      <Action
        task={task}
        disabled={!files.length || (arrangePages && !pagesReady)}
        onClick={merge}
        label={uiText("รวมและดาวน์โหลด PDF")}
      />
      <Status task={task} />
      {viewer && (
        <PdfPageViewer
          file={viewer.sourceFile}
          pageNumber={viewer.originalIndex + 1}
          pageCount={viewer.sourcePageCount}
          onClose={() => setViewer(null)}
        />
      )}
    </Surface>
  );
}

type MergePdfSource = { id: number; file: File };

type PageItem = {
  originalIndex: number;
  rotation: number;
  preview: string;
  width: number;
  height: number;
};

type MergePageItem = PageItem & {
  id: string;
  sourceId: number;
  sourceFile: File;
  sourcePageCount: number;
};

function OrganizePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [sourcePageCount, setSourcePageCount] = useState(0);
  const [viewerPage, setViewerPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");
  const task = useTask();

  const selectFile = (files: File[]) => {
    const next = files[0] ?? null;
    setFile(next);
    setPages([]);
    setSourcePageCount(0);
    setViewerPage(null);
    setPreviewError("");
  };

  useEffect(() => {
    if (!file) {
      setLoading(false);
      setPreviewMessage("");
      return;
    }
    let active = true;
    let controller: AbortController | null = null;
    const render = () => {
      controller?.abort();
      if (document.hidden) {
        setLoading(false);
        setPreviewMessage(uiText("ตัวอย่างจะทำงานต่อเมื่อกลับมาที่แท็บนี้"));
        return;
      }
      controller = new AbortController();
      const signal = controller.signal;
      setLoading(true);
      setPreviewError("");
      setPreviewMessage(uiText("กำลังสร้างตัวอย่างหน้า..."));
      renderPdfThumbnails(
        file,
        (message) => {
          if (active && !signal.aborted) setPreviewMessage(message);
        },
        Number.POSITIVE_INFINITY,
        signal,
      )
        .then(({ pages: items, pageCount }) => {
          if (active && !signal.aborted) {
            setPages(items);
            setSourcePageCount(pageCount);
            setPreviewMessage("");
          }
        })
        .catch((error: unknown) => {
          if (active && !signal.aborted)
            setPreviewError(messageOf(error, "ไม่สามารถสร้างตัวอย่างหน้าได้"));
        })
        .finally(() => {
          if (active && !signal.aborted) setLoading(false);
        });
    };
    document.addEventListener("visibilitychange", render);
    render();
    return () => {
      active = false;
      controller?.abort();
      document.removeEventListener("visibilitychange", render);
    };
  }, [file]);

  const save = () =>
    task.run(async (signal) => {
      if (!file || !pages.length) throw new Error("ต้องเหลืออย่างน้อย 1 หน้า");
      const { PDFDocument, degrees } = await import("pdf-lib");
      const source = await PDFDocument.load(await file.arrayBuffer());
      throwIfAborted(signal);
      const output = await PDFDocument.create();
      for (const pageItem of pages) {
        throwIfAborted(signal);
        const [page] = await output.copyPages(source, [pageItem.originalIndex]);
        page.setRotation(
          degrees(
            normalizeRotation(page.getRotation().angle + pageItem.rotation),
          ),
        );
        output.addPage(page);
      }
      downloadBytes(
        await output.save({ useObjectStreams: true }),
        `organized-${safeBaseName(file.name)}.pdf`,
        "application/pdf",
      );
      return `บันทึกสำเร็จ ${pages.length} หน้า`;
    }, "ไม่สามารถบันทึกไฟล์นี้ได้");

  return (
    <Surface>
      <FilePicker
        files={file ? [file] : []}
        accept="application/pdf,.pdf"
        label={uiText("เลือก PDF เพื่อจัดหน้า")}
        detail="ตัวอย่างทุกหน้าสร้างบนอุปกรณ์ของคุณ"
        showPdfPreview={false}
        onFiles={selectFile}
      />
      {file && (
        <div className="pdf-section-heading">
          <h3>{uiText("ตัวอย่าง")}</h3>
          <div className="pdf-preview-heading-actions">
            <p>
              {sourcePageCount
                ? sourcePageCount + " " + uiText("หน้า")
                : uiText("กำลังเตรียมตัวอย่างหน้า PDF")}
            </p>
            <PreviewDownloadButton
              onClick={save}
              disabled={!pages.length || loading || task.working}
            />
          </div>
        </div>
      )}
      {loading && (
        <InlineLoading text={previewMessage || "กำลังสร้างตัวอย่างหน้า..."} />
      )}
      {!loading && previewMessage && (
        <p className="helper-text" role="status">
          {previewMessage}
        </p>
      )}
      {previewError && (
        <div className="inline-status error" role="alert">
          <p>{uiText(previewError)}</p>
        </div>
      )}
      {pages.length > 0 && (
        <>
          <section className="pdf-page-workarea">
            <div className="page-organizer">
              {pages.map((page, index) => (
                <article
                  className="page-tile sortable-item"
                  key={`${page.originalIndex}-${index}`}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", String(index));
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const raw = event.dataTransfer.getData("text/plain");
                    const from = Number(raw);
                    if (raw && Number.isInteger(from))
                      setPages((current) => moveItem(current, from, index));
                  }}
                  aria-roledescription={uiText("หน้าที่ลากจัดลำดับได้")}
                >
                  <button
                    className="page-thumb page-preview-trigger"
                    type="button"
                    aria-label={
                      uiText("ขยายตัวอย่างหน้า PDF") + " " + (index + 1)
                    }
                    onClick={() => setViewerPage(page.originalIndex + 1)}
                  >
                    <img
                      src={page.preview}
                      alt={uiText("หน้า PDF") + " " + (page.originalIndex + 1)}
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                    />
                    <span>{index + 1}</span>
                    <ZoomIn size={16} />
                  </button>
                  <div className="page-details">
                    <GripVertical
                      className="drag-handle"
                      aria-hidden="true"
                      size={17}
                    />
                    <div>
                      <strong>
                        {uiText("หน้าเดิม ")}
                        {page.originalIndex + 1}
                      </strong>
                      <small>
                        {Math.round(page.width)} × {Math.round(page.height)} pt
                      </small>
                    </div>
                  </div>
                  <div
                    className="page-actions page-control-toolbar"
                    role="group"
                    aria-label={uiText("จัดการหน้า PDF")}
                  >
                    <button
                      type="button"
                      disabled={index === 0}
                      title={uiText("เลื่อนขึ้น")}
                      onClick={() =>
                        setPages((current) =>
                          moveItem(current, index, index - 1),
                        )
                      }
                      aria-label={uiText("เลื่อนขึ้น")}
                    >
                      <ArrowUp size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={index === pages.length - 1}
                      title={uiText("เลื่อนลง")}
                      onClick={() =>
                        setPages((current) =>
                          moveItem(current, index, index + 1),
                        )
                      }
                      aria-label={uiText("เลื่อนลง")}
                    >
                      <ArrowDown size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      title={uiText("หมุนซ้าย")}
                      onClick={() =>
                        setPages((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  rotation: normalizeRotation(
                                    item.rotation - 90,
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                      aria-label={uiText("หมุนซ้าย")}
                    >
                      <RotateCcw size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      title={uiText("หมุนขวา")}
                      onClick={() =>
                        setPages((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  rotation: normalizeRotation(
                                    item.rotation + 90,
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                      aria-label={uiText("หมุนขวา")}
                    >
                      <RotateCw size={16} aria-hidden="true" />
                    </button>
                    <button
                      className="danger page-action-delete"
                      type="button"
                      title={uiText("ลบหน้า")}
                      onClick={() =>
                        setPages((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      aria-label={uiText("ลบหน้า")}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <p className="helper-text">
            {uiText(
              "ลากหน้าเพื่อเรียงใหม่ หรือใช้ปุ่มแยกกันเพื่อเลื่อน หมุน และลบแต่ละหน้า",
            )}
          </p>
          <Action
            task={task}
            disabled={!pages.length}
            onClick={save}
            label={uiText("บันทึก PDF ที่จัดแล้ว")}
          />
          {viewerPage !== null && file && (
            <PdfPageViewer
              file={file}
              pageNumber={viewerPage}
              pageCount={sourcePageCount}
              onClose={() => setViewerPage(null)}
            />
          )}
        </>
      )}
      <Status task={task} />
    </Surface>
  );
}

function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"ranges" | "each">("ranges");
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState<PageRangeRow[]>([{ from: "1", to: "" }]);
  const task = useTask();
  const split = () =>
    task.run(async (signal) => {
      if (!file) throw new Error("กรุณาเลือก PDF");
      const { PDFDocument } = await import("pdf-lib");
      const source = await PDFDocument.load(await file.arrayBuffer());
      throwIfAborted(signal);
      const groups =
        mode === "each"
          ? source.getPageIndices().map((index) => [index])
          : pageRangeRowsToGroups(ranges, source.getPageCount());
      const outputs: Record<string, Uint8Array> = {};
      for (let index = 0; index < groups.length; index += 1) {
        throwIfAborted(signal);
        task.progress(`กำลังสร้างไฟล์ ${index + 1} จาก ${groups.length}`);
        const output = await PDFDocument.create();
        const pages = await output.copyPages(source, groups[index]);
        pages.forEach((page) => output.addPage(page));
        outputs[
          `pages-${groups[index].map((page) => page + 1).join("-")}.pdf`
        ] = await output.save({ useObjectStreams: true });
      }
      if (groups.length === 1)
        downloadBytes(
          outputs[Object.keys(outputs)[0]],
          `split-${safeBaseName(file.name)}.pdf`,
          "application/pdf",
        );
      else {
        const { zipSync } = await import("fflate");
        downloadBytes(
          zipSync(outputs, { level: 6 }),
          `split-${safeBaseName(file.name)}.zip`,
          "application/zip",
        );
      }
      return `แยกสำเร็จ ${groups.length} ไฟล์`;
    }, "ไม่สามารถแยก PDF ได้");
  return (
    <Surface>
      <FilePicker
        files={file ? [file] : []}
        accept="application/pdf,.pdf"
        label={uiText("เลือก PDF ที่ต้องการแยก")}
        detail="ไฟล์ผลลัพธ์หลายรายการจะดาวน์โหลดเป็น ZIP"
        onFiles={(files) => {
          setFile(files[0] ?? null);
          setPageCount(0);
          setRanges([{ from: "1", to: "" }]);
        }}
        onPdfPageCount={setPageCount}
        onPreviewDownload={split}
        previewDownloadDisabled={!file || task.working}
      />
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          ["ranges", "กำหนดช่วงหน้า"],
          ["each", "แยกทุกหน้า"],
        ]}
      />
      {mode === "ranges" && (
        <>
          <div className="pdf-section-heading">
            <h3>{uiText("กำหนดช่วงหน้า")}</h3>
            <p>{uiText("แต่ละช่วงจะได้ PDF แยกหนึ่งไฟล์")}</p>
          </div>
          <PageRangesEditor
            rows={ranges}
            onChange={setRanges}
            pageCount={pageCount}
          />
        </>
      )}
      <Action
        task={task}
        disabled={!file}
        onClick={split}
        label={uiText(
          mode === "each" ? "แยกทุกหน้าเป็น ZIP" : "แยกและดาวน์โหลด",
        )}
      />
      <Status task={task} />
    </Surface>
  );
}

function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<"small" | "balanced" | "quality">(
    "balanced",
  );
  const task = useTask();
  const compress = () =>
    task.run(async (signal) => {
      if (!file) throw new Error("กรุณาเลือก PDF");
      const settings =
        quality === "small"
          ? { scale: 1.05, jpeg: 0.5 }
          : quality === "balanced"
            ? { scale: 1.45, jpeg: 0.7 }
            : { scale: 1.9, jpeg: 0.84 };
      const [opened, pdfLib] = await Promise.all([
        loadPdfDocument(file, signal),
        import("pdf-lib"),
      ]);
      const source = opened.document;
      const output = await pdfLib.PDFDocument.create();
      try {
        for (let number = 1; number <= source.numPages; number += 1) {
          throwIfAborted(signal);
          task.progress(`กำลังบีบอัดหน้า ${number} จาก ${source.numPages}`);
          const page = await source.getPage(number);
          const base = page.getViewport({ scale: 1 });
          const rendered = await renderPageToJpeg(
            page,
            settings.scale,
            settings.jpeg,
            signal,
          );
          const embedded = await output.embedJpg(await rendered.arrayBuffer());
          const outputPage = output.addPage([base.width, base.height]);
          outputPage.drawImage(embedded, {
            x: 0,
            y: 0,
            width: base.width,
            height: base.height,
          });
          page.cleanup();
        }
      } finally {
        await opened.close();
      }
      throwIfAborted(signal);
      const bytes = await output.save({ useObjectStreams: true });
      downloadBytes(
        bytes,
        `compressed-${safeBaseName(file.name)}.pdf`,
        "application/pdf",
      );
      const reduction = Math.round((1 - bytes.length / file.size) * 100);
      return `${formatBytes(file.size)} → ${formatBytes(bytes.length)}${reduction > 0 ? ` · ลดลง ${reduction}%` : " · ไฟล์ต้นฉบับบีบอัดมาดีอยู่แล้ว"}`;
    }, "ไม่สามารถลดขนาด PDF นี้ได้");
  return (
    <Surface>
      <FilePicker
        files={file ? [file] : []}
        accept="application/pdf,.pdf"
        label={uiText("เลือก PDF ที่ต้องการลดขนาด")}
        detail="ใช้การแปลงแต่ละหน้าเป็นภาพใหม่บนอุปกรณ์ของคุณ"
        onFiles={(files) => setFile(files[0] ?? null)}
        onPreviewDownload={compress}
        previewDownloadDisabled={!file || task.working}
      />
      <div className="notice-box warning">
        <strong>{uiText("โปรดทราบ")}</strong>
        <p>
          {uiText(
            "วิธีนี้ลดขนาดได้มาก แต่ข้อความจะกลายเป็นภาพและค้นหาหรือคัดลอกไม่ได้ เหมาะกับไฟล์สำหรับส่งหรืออ่าน",
          )}
        </p>
      </div>
      <Segmented
        value={quality}
        onChange={setQuality}
        options={[
          ["small", "เล็กที่สุด"],
          ["balanced", "สมดุล"],
          ["quality", "คมชัด"],
        ]}
      />
      <Action
        task={task}
        disabled={!file}
        onClick={compress}
        label={uiText("ลดขนาดและดาวน์โหลด")}
      />
      <Status task={task} />
    </Surface>
  );
}

function PdfToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [selection, setSelection] = useState<"all" | "selected">("all");
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState<PageRangeRow[]>([{ from: "1", to: "" }]);
  const [quality, setQuality] = useState(88);
  const task = useTask();
  const convert = () =>
    task.run(async (signal) => {
      if (!file) throw new Error("กรุณาเลือก PDF");
      const opened = await loadPdfDocument(file, signal);
      const outputs: Record<string, Uint8Array> = {};
      let indices: number[] = [];
      try {
        const document = opened.document;
        indices =
          selection === "all"
            ? Array.from({ length: document.numPages }, (_, index) => index)
            : pageRangeRowsToGroups(ranges, document.numPages).flat();
        if (!indices.length) throw new Error("ช่วงหน้าไม่ถูกต้อง");
        for (let item = 0; item < indices.length; item += 1) {
          throwIfAborted(signal);
          task.progress(`กำลังแปลงหน้า ${item + 1} จาก ${indices.length}`);
          const page = await document.getPage(indices[item] + 1);
          const blob = await renderPageToJpeg(page, 2, quality / 100, signal);
          outputs[`page-${String(indices[item] + 1).padStart(3, "0")}.jpg`] =
            new Uint8Array(await blob.arrayBuffer());
          page.cleanup();
        }
      } finally {
        await opened.close();
      }
      throwIfAborted(signal);
      if (indices.length === 1)
        downloadBytes(
          outputs[Object.keys(outputs)[0]],
          `page-${indices[0] + 1}.jpg`,
          "image/jpeg",
        );
      else {
        const { zipSync } = await import("fflate");
        downloadBytes(
          zipSync(outputs, { level: 1 }),
          `${safeBaseName(file.name)}-jpg.zip`,
          "application/zip",
        );
      }
      return `แปลงสำเร็จ ${indices.length} หน้า`;
    }, "ไม่สามารถแปลง PDF นี้เป็นภาพได้");
  return (
    <Surface>
      <FilePicker
        files={file ? [file] : []}
        accept="application/pdf,.pdf"
        label={uiText("เลือก PDF ที่ต้องการแปลง")}
        detail="หลายหน้าจะดาวน์โหลดเป็น ZIP"
        onFiles={(files) => {
          setFile(files[0] ?? null);
          setPageCount(0);
          setRanges([{ from: "1", to: "" }]);
        }}
        onPdfPageCount={setPageCount}
        onPreviewDownload={convert}
        previewDownloadDisabled={!file || task.working}
      />
      <div className="field-grid two">
        <PdfChoiceField
          label="หน้าที่ต้องการแปลง"
          value={selection}
          icon={FileText}
          choices={[
            {
              value: "all",
              label: uiText("ทุกหน้า"),
              compact: uiText("ทุกหน้า"),
            },
            {
              value: "selected",
              label: uiText("เลือกหน้าเอง"),
              compact: uiText("เลือกหน้าเอง"),
            },
          ]}
          onSelect={(value) => setSelection(value as typeof selection)}
        />
        <Field label={uiText("คุณภาพ JPG") + " " + quality + "%"}>
          <input
            type="range"
            min="45"
            max="100"
            value={quality}
            onChange={(event) => setQuality(Number(event.target.value))}
          />
        </Field>
      </div>
      {selection === "selected" && (
        <PageRangesEditor
          rows={ranges}
          onChange={setRanges}
          pageCount={pageCount}
        />
      )}
      <Action
        task={task}
        disabled={!file}
        onClick={convert}
        label={uiText("แปลงเป็น JPG")}
      />
      <Status task={task} />
    </Surface>
  );
}

function ImagesToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<"auto" | "a4">("a4");
  const [margin, setMargin] = useState(24);
  const task = useTask();
  const convert = () =>
    task.run(async (signal) => {
      const { PDFDocument } = await import("pdf-lib");
      const output = await PDFDocument.create();
      for (let index = 0; index < files.length; index += 1) {
        throwIfAborted(signal);
        task.progress(`กำลังเพิ่มภาพ ${index + 1} จาก ${files.length}`);
        const file = files[index];
        const pngBytes =
          file.type === "image/jpeg" ? null : await imageFileToPngBytes(file);
        const image =
          file.type === "image/jpeg"
            ? await output.embedJpg(await file.arrayBuffer())
            : await output.embedPng(pngBytes!);
        const dimensions = image.scale(1);
        const landscape = dimensions.width > dimensions.height;
        const [pageWidth, pageHeight] =
          pageSize === "a4"
            ? landscape
              ? [841.89, 595.28]
              : [595.28, 841.89]
            : [
                dimensions.width * 0.75 + margin * 2,
                dimensions.height * 0.75 + margin * 2,
              ];
        const page = output.addPage([pageWidth, pageHeight]);
        const scale = Math.min(
          (pageWidth - margin * 2) / dimensions.width,
          (pageHeight - margin * 2) / dimensions.height,
        );
        const width = dimensions.width * scale;
        const height = dimensions.height * scale;
        page.drawImage(image, {
          x: (pageWidth - width) / 2,
          y: (pageHeight - height) / 2,
          width,
          height,
        });
      }
      downloadBytes(
        await output.save({ useObjectStreams: true }),
        "images-to-pdf.pdf",
        "application/pdf",
      );
      return `สร้าง PDF สำเร็จ ${files.length} หน้า`;
    }, "ไม่สามารถสร้าง PDF จากรูปเหล่านี้ได้");
  return (
    <Surface>
      <FilePicker
        multiple
        files={files}
        accept="image/jpeg,image/png,image/webp"
        label={uiText("เลือก JPG, PNG หรือ WebP")}
        detail="เรียงตามลำดับด้านล่าง · หนึ่งภาพต่อหนึ่งหน้า"
        onFiles={setFiles}
        showSelectedFiles={false}
      />
      {files.length > 0 && (
        <>
          <section className="image-to-pdf-preview">
            <div className="pdf-section-heading">
              <h3>{uiText("ตัวอย่าง")}</h3>
              <div className="pdf-preview-heading-actions">
                <p>
                  {files.length} {uiText("ภาพพร้อมสร้าง PDF")}
                </p>
                <PreviewDownloadButton
                  onClick={convert}
                  disabled={!files.length || task.working}
                />
              </div>
            </div>
            <ImagePreviewList files={files} />
          </section>
          <section className="pdf-manage-section">
            <h3>{uiText("จัดการรูปภาพ")}</h3>
            <SortableFiles
              files={files}
              onMove={(index, direction) =>
                setFiles((current) =>
                  moveItem(current, index, index + direction),
                )
              }
              onReorder={(from, to) =>
                setFiles((current) => moveItem(current, from, to))
              }
              onRemove={(index) =>
                setFiles((current) =>
                  current.filter((_, item) => item !== index),
                )
              }
            />
          </section>
        </>
      )}
      <div className="field-grid two">
        <PdfChoiceField
          label="ขนาดหน้า"
          value={pageSize}
          icon={FileText}
          choices={[
            {
              value: "a4",
              label: uiText("A4 ตามแนวภาพ"),
              compact: uiText("A4 ตามแนวภาพ"),
            },
            {
              value: "auto",
              label: uiText("พอดีกับภาพ"),
              compact: uiText("พอดีกับภาพ"),
            },
          ]}
          onSelect={(value) => setPageSize(value as "auto" | "a4")}
        />
        <Field label={"ขอบ " + margin + " pt"}>
          <input
            type="range"
            min="0"
            max="72"
            value={margin}
            onChange={(event) => setMargin(Number(event.target.value))}
          />
        </Field>
      </div>
      <Action
        task={task}
        disabled={!files.length}
        onClick={convert}
        label={uiText("สร้างและดาวน์โหลด PDF")}
      />
      <Status task={task} />
    </Surface>
  );
}

function PageNumbersPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [previewPageNumber, setPreviewPageNumber] = useState(1);
  const [position, setPosition] = useState("bottom-center");
  const [size, setSize] = useState(11);
  const [rules, setRules] = useState<NumberingRule[]>([
    { from: "1", to: "", start: "1", system: "numeric" },
  ]);
  const pagePreview = usePdfPagePreview(file, previewPageNumber);
  const pageCount = pagePreview.pageCount;
  const previewLabel = numberingLabelForPage(
    rules,
    previewPageNumber,
    pageCount,
  );
  const numberPreviewImage = useTextImagePreview(
    previewLabel,
    (size * 4) / 3,
    "#342720",
  );
  const [numberPreviewImageSize, setNumberPreviewImageSize] = useState({
    width: 0,
    height: 0,
  });
  const task = useTask();
  const addNumbers = () =>
    task.run(async (signal) => {
      if (!file) throw new Error("กรุณาเลือก PDF");
      const { PDFDocument } = await import("pdf-lib");
      const document = await PDFDocument.load(await file.arrayBuffer());
      const pages = document.getPages();
      const validRules = validateNumberingRules(rules, pages.length);
      const imageCache = new Map<
        string,
        { image: import("pdf-lib").PDFImage; width: number; height: number }
      >();
      for (let index = 0; index < pages.length; index += 1) {
        throwIfAborted(signal);
        const pageNumber = index + 1;
        const rule = validRules.find(
          (item) => pageNumber >= item.from && pageNumber <= item.to,
        );
        if (!rule) continue;
        const label = sequenceLabel(
          rule.system,
          rule.start + pageNumber - rule.from,
        );
        let cached = imageCache.get(label);
        if (!cached) {
          const png = await textToPng(label, (size * 4) / 3, "#342720");
          const image = await document.embedPng(png);
          cached = {
            image,
            width: image.width * 0.75,
            height: image.height * 0.75,
          };
          imageCache.set(label, cached);
        }
        const page = pages[index];
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const x = position.endsWith("left")
          ? 28
          : position.endsWith("right")
            ? pageWidth - cached.width - 28
            : (pageWidth - cached.width) / 2;
        const y = position.startsWith("top")
          ? pageHeight - cached.height - 24
          : 24;
        page.drawImage(cached.image, {
          x,
          y,
          width: cached.width,
          height: cached.height,
        });
      }
      throwIfAborted(signal);
      downloadBytes(
        await document.save({ useObjectStreams: true }),
        `numbered-${safeBaseName(file.name)}.pdf`,
        "application/pdf",
      );
      return `ใส่เลขหน้าสำเร็จ ${pages.length} หน้า`;
    }, "ไม่สามารถใส่เลขหน้าได้");
  const lastRule = rules[rules.length - 1];
  const lastRuleFrom = Number(lastRule?.from) || 1;
  const lastRuleEnd = lastRule?.to
    ? Number(lastRule.to)
    : pageCount
      ? Math.min(lastRuleFrom + 2, pageCount)
      : lastRuleFrom + 2;
  const canAddRule = !pageCount || lastRuleEnd < pageCount;
  const addRule = () =>
    setRules((current) => {
      const next = [...current];
      const last = next[next.length - 1];
      const start = Math.max(1, Number(last?.from) || 1);
      const end = last?.to
        ? Number(last.to)
        : pageCount
          ? Math.min(start + 2, pageCount)
          : start + 2;
      if (last && !last.to)
        next[next.length - 1] = { ...last, to: String(end) };
      const from = end + 1;
      return [
        ...next,
        { from: String(from), to: "", start: "1", system: "numeric" },
      ];
    });
  const numberOverlayStyle = (() => {
    const page = pagePreview.page;
    if (!page || !numberPreviewImage) return undefined;
    const stampWidth = numberPreviewImageSize.width
      ? numberPreviewImageSize.width * 0.75
      : page.width * 0.12;
    const stampHeight = numberPreviewImageSize.height
      ? numberPreviewImageSize.height * 0.75
      : page.height * 0.025;
    const x = position.endsWith("left")
      ? 28
      : position.endsWith("right")
        ? page.width - stampWidth - 28
        : (page.width - stampWidth) / 2;
    const y = position.startsWith("top")
      ? page.height - stampHeight - 24
      : 24;
    return {
      left: `${((x + stampWidth / 2) / page.width) * 100}%`,
      top: `${((page.height - y - stampHeight / 2) / page.height) * 100}%`,
      width: `${(stampWidth / page.width) * 100}%`,
    };
  })();
  return (
    <Surface>
      <FilePicker
        files={file ? [file] : []}
        accept="application/pdf,.pdf"
        label={uiText("เลือก PDF สำหรับใส่เลขหน้า")}
        detail="รองรับเอกสารทุกขนาดหน้า"
        showPdfPreview={false}
        onFiles={(files) => {
          setFile(files[0] ?? null);
          setPreviewPageNumber(1);
          setRules([{ from: "1", to: "", start: "1", system: "numeric" }]);
        }}
      />
      <div className="pdf-section-heading">
        <h3>{uiText("กำหนดรูปแบบเลขหน้า")}</h3>
        <p>{uiText("เลือกตัวอักษร เลขเริ่มต้น และช่วงหน้าของแต่ละรูปแบบ")}</p>
      </div>
      <div className="numbering-rules">
        {rules.map((rule, index) => (
          <section className="numbering-rule" key={index}>
            <h4>{uiText("รูปแบบ") + " " + (index + 1)}</h4>
            <div className="field-grid two">
              <Field label={uiText("จากหน้า")}>
                <input
                  type="number"
                  min="1"
                  max={pageCount || undefined}
                  value={rule.from}
                  onChange={(event) =>
                    setRules((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, from: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </Field>
              <Field label={uiText("ถึงหน้า")}>
                <input
                  type="number"
                  min={rule.from || 1}
                  max={pageCount || undefined}
                  placeholder={uiText("หน้าสุดท้าย")}
                  value={rule.to}
                  onChange={(event) =>
                    setRules((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, to: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </Field>
              <PdfChoiceField
                label="รูปแบบตัวเลข"
                value={rule.system}
                icon={Hash}
                choices={[
                  {
                    value: "numeric",
                    label: `123 · ${uiText("ตัวเลข")}`,
                    compact: `123 · ${uiText("ตัวเลข")}`,
                  },
                  {
                    value: "upper",
                    label: `ABC · ${uiText("อักษรอังกฤษตัวพิมพ์ใหญ่")}`,
                    compact: `ABC · ${uiText("อักษรอังกฤษตัวพิมพ์ใหญ่")}`,
                  },
                  {
                    value: "lower",
                    label: `abc · ${uiText("อักษรอังกฤษตัวพิมพ์เล็ก")}`,
                    compact: `abc · ${uiText("อักษรอังกฤษตัวพิมพ์เล็ก")}`,
                  },
                  {
                    value: "thai",
                    label: `กขค · ${uiText("อักษรไทย")}`,
                    compact: `กขค · ${uiText("อักษรไทย")}`,
                  },
                ]}
                onSelect={(value) =>
                  setRules((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, system: value as NumberingSystem }
                        : item,
                    ),
                  )
                }
              />
              <Field label={uiText("ค่าเริ่มต้น")}>
                <input
                  type="number"
                  min="1"
                  value={rule.start}
                  onChange={(event) =>
                    setRules((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, start: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </Field>
            </div>
            {rules.length > 1 && (
              <button
                className="secondary-button numbering-remove"
                type="button"
                onClick={() =>
                  setRules((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                <Trash2 size={15} />
                {uiText("ลบรูปแบบนี้")}
              </button>
            )}
          </section>
        ))}
      </div>
      <button
        className="secondary-button add-range-button"
        type="button"
        onClick={addRule}
        disabled={!canAddRule}
      >
        <Plus size={16} />
        {uiText("เพิ่มช่วงรูปแบบ")}
      </button>
      <div className="field-grid two">
        <PdfChoiceField
          label="ตำแหน่ง"
          value={position}
          icon={Move}
          choices={[
            ["bottom-left", "ล่างซ้าย"],
            ["bottom-center", "ล่างกลาง"],
            ["bottom-right", "ล่างขวา"],
            ["top-left", "บนซ้าย"],
            ["top-center", "บนกลาง"],
            ["top-right", "บนขวา"],
          ].map(([value, label]) => ({
            value,
            label: uiText(label),
            compact: uiText(label),
          }))}
          onSelect={setPosition}
        />
        <Field label={uiText("ขนาดตัวอักษร") + ": " + size + " pt"}>
          <input
            type="range"
            min="8"
            max="24"
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          />
        </Field>
        <Field label={uiText("หน้าตัวอย่าง")}>
          <input
            type="number"
            min="1"
            max={pageCount || undefined}
            value={previewPageNumber}
            onChange={(event) =>
              setPreviewPageNumber(Math.max(1, Number(event.target.value) || 1))
            }
          />
        </Field>
      </div>
      {file && (
        <PdfPagePreviewPanel
          preview={pagePreview}
          pageNumber={previewPageNumber}
          onDownload={addNumbers}
          downloadDisabled={!file || task.working}
        >
          <>
            <div className="numbering-preview output-panel">
              <strong>{uiText("ตัวอย่างผลลัพธ์")}</strong>
              <p>
                {previewLabel || uiText("ไม่มีเลขหน้าสำหรับหน้านี้")}
              </p>
            </div>
            {pagePreview.page && (
              <div
                className="pdf-adjustment-preview-page"
                style={{
                  aspectRatio: `${pagePreview.page.width} / ${pagePreview.page.height}`,
                }}
              >
                <img
                  className="pdf-adjustment-page-image"
                  src={pagePreview.page.image}
                  alt={uiText("หน้า PDF") + " " + previewPageNumber}
                />
                {numberPreviewImage && numberOverlayStyle && (
                  <img
                    className="pdf-adjustment-stamp"
                    src={numberPreviewImage}
                    alt={previewLabel}
                    style={numberOverlayStyle}
                    onLoad={(event) =>
                      setNumberPreviewImageSize({
                        width: event.currentTarget.naturalWidth,
                        height: event.currentTarget.naturalHeight,
                      })
                    }
                  />
                )}
              </div>
            )}
          </>
        </PdfPagePreviewPanel>
      )}
      <Action
        task={task}
        disabled={!file}
        onClick={addNumbers}
        label={uiText("ใส่เลขหน้าและดาวน์โหลด")}
      />
      <Status task={task} />
    </Surface>
  );
}

function WatermarkPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(24);
  const [angle, setAngle] = useState(-35);
  const [size, setSize] = useState(42);
  const [color, setColor] = useState("#d04a52");
  const [previewPageNumber, setPreviewPageNumber] = useState(1);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [watermarkImageSize, setWatermarkImageSize] = useState({
    width: 0,
    height: 0,
  });
  const pageFrameRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const placementHelpId = useId();
  const pagePreview = usePdfPagePreview(file, previewPageNumber);
  const watermarkPreviewImage = useTextImagePreview(text.trim(), size, color);
  const task = useTask();
  const clampPosition = (x: number, y: number) => {
    const page = pagePreview.page;
    if (!page || !watermarkImageSize.width || !watermarkImageSize.height)
      return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
    const scale = Math.min(1, (page.width * 0.68) / watermarkImageSize.width);
    const width = watermarkImageSize.width * scale;
    const height = watermarkImageSize.height * scale;
    const radians = (angle * Math.PI) / 180;
    const rotatedWidth =
      Math.abs(width * Math.cos(radians)) +
      Math.abs(height * Math.sin(radians));
    const rotatedHeight =
      Math.abs(width * Math.sin(radians)) +
      Math.abs(height * Math.cos(radians));
    const insetX = Math.min(0.5, rotatedWidth / (2 * page.width));
    const insetY = Math.min(0.5, rotatedHeight / (2 * page.height));
    return {
      x: Math.min(1 - insetX, Math.max(insetX, x)),
      y: Math.min(1 - insetY, Math.max(insetY, y)),
    };
  };
  const pointerPosition = (clientX: number, clientY: number) => {
    const rect = pageFrameRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };
  const moveWatermarkFromPointer = (clientX: number, clientY: number) => {
    const point = pointerPosition(clientX, clientY);
    if (!point) return;
    setPosition(
      clampPosition(
        point.x + dragOffset.current.x,
        point.y + dragOffset.current.y,
      ),
    );
  };
  const onPreviewPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const point = pointerPosition(event.clientX, event.clientY);
    if (!point) return;
    const target = event.target;
    const grabbedWatermark =
      target instanceof Element && target.closest(".pdf-watermark-stamp");
    dragOffset.current = grabbedWatermark
      ? { x: position.x - point.x, y: position.y - point.y }
      : { x: 0, y: 0 };
    activePointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveWatermarkFromPointer(event.clientX, event.clientY);
  };
  const onPreviewPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointer.current === event.pointerId)
      moveWatermarkFromPointer(event.clientX, event.clientY);
  };
  const stopPreviewPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointer.current === event.pointerId)
      activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onPreviewKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.05 : 0.01;
    const changes: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const change = changes[event.key];
    if (!change) return;
    event.preventDefault();
    setPosition((current) =>
      clampPosition(current.x + change[0], current.y + change[1]),
    );
  };
  const watermarkWidth = pagePreview.page
    ? watermarkImageSize.width
      ? (Math.min(
          watermarkImageSize.width,
          pagePreview.page.width * 0.68,
        ) /
          pagePreview.page.width) *
        100
      : 68
    : 68;
  const watermark = () =>
    task.run(async (signal) => {
      if (!file || !text.trim()) throw new Error("กรุณาเลือกไฟล์และใส่ข้อความ");
      const { PDFDocument, degrees } = await import("pdf-lib");
      const document = await PDFDocument.load(await file.arrayBuffer());
      throwIfAborted(signal);
      const png = await textToPng(text.trim(), size, color);
      const image = await document.embedPng(png);
      for (const page of document.getPages()) {
        throwIfAborted(signal);
        const { width, height } = page.getSize();
        const scale = Math.min(1, (width * 0.68) / image.width);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const radians = (angle * Math.PI) / 180;
        const centerX = position.x * width;
        const centerY = height - position.y * height;
        const rotatedOffsetX =
          (drawWidth / 2) * Math.cos(radians) -
          (drawHeight / 2) * Math.sin(radians);
        const rotatedOffsetY =
          (drawWidth / 2) * Math.sin(radians) +
          (drawHeight / 2) * Math.cos(radians);
        page.drawImage(image, {
          x: centerX - rotatedOffsetX,
          y: centerY - rotatedOffsetY,
          width: drawWidth,
          height: drawHeight,
          rotate: degrees(angle),
          opacity: opacity / 100,
        });
      }
      throwIfAborted(signal);
      downloadBytes(
        await document.save({ useObjectStreams: true }),
        `watermarked-${safeBaseName(file.name)}.pdf`,
        "application/pdf",
      );
      return `ใส่ลายน้ำสำเร็จ ${document.getPageCount()} หน้า`;
    }, "ไม่สามารถใส่ลายน้ำได้");
  return (
    <Surface>
      <FilePicker
        files={file ? [file] : []}
        accept="application/pdf,.pdf"
        label={uiText("เลือก PDF สำหรับใส่ลายน้ำ")}
        detail="ข้อความภาษาไทยและอังกฤษจะถูกสร้างเป็นภาพโปร่งใส"
        showPdfPreview={false}
        onFiles={(files) => {
          setFile(files[0] ?? null);
          setPreviewPageNumber(1);
          setPosition({ x: 0.5, y: 0.5 });
        }}
      />
      <Field label={uiText("ข้อความลายน้ำ")}>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={80}
        />
      </Field>
      <div className="field-grid two">
        <Field label={`ความทึบ ${opacity}%`}>
          <input
            type="range"
            min="5"
            max="80"
            value={opacity}
            onChange={(event) => setOpacity(Number(event.target.value))}
          />
        </Field>
        <Field label={`มุม ${angle}°`}>
          <input
            type="range"
            min="-90"
            max="90"
            value={angle}
            onChange={(event) => setAngle(Number(event.target.value))}
          />
        </Field>
        <Field label={`ขนาด ${size}px`}>
          <input
            type="range"
            min="20"
            max="96"
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          />
        </Field>
        <Field label={uiText("สี")}>
          <input
            className="color-input"
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
        </Field>
        <Field label={uiText("หน้าตัวอย่าง")}>
          <input
            type="number"
            min="1"
            max={pagePreview.pageCount || undefined}
            value={previewPageNumber}
            onChange={(event) =>
              setPreviewPageNumber(Math.max(1, Number(event.target.value) || 1))
            }
          />
        </Field>
      </div>
      {file && (
        <PdfPagePreviewPanel
          preview={pagePreview}
          pageNumber={previewPageNumber}
          onDownload={watermark}
          downloadDisabled={!file || !text.trim() || task.working}
        >
          {pagePreview.page && (
            <div
              ref={pageFrameRef}
              className="pdf-adjustment-preview-page pdf-watermark-edit-page"
              style={{
                aspectRatio: `${pagePreview.page.width} / ${pagePreview.page.height}`,
              }}
              role="group"
              aria-label={uiText("ตำแหน่งลายน้ำ")}
              aria-describedby={placementHelpId}
              tabIndex={0}
              onPointerDown={onPreviewPointerDown}
              onPointerMove={onPreviewPointerMove}
              onPointerUp={stopPreviewPointer}
              onPointerCancel={stopPreviewPointer}
              onKeyDown={onPreviewKeyDown}
            >
              <img
                className="pdf-adjustment-page-image"
                src={pagePreview.page.image}
                alt={uiText("หน้า PDF") + " " + previewPageNumber}
                draggable={false}
              />
              {watermarkPreviewImage && (
                <img
                  className="pdf-adjustment-stamp pdf-watermark-stamp"
                  src={watermarkPreviewImage}
                  alt={text.trim()}
                  draggable={false}
                  style={{
                    left: `${position.x * 100}%`,
                    top: `${position.y * 100}%`,
                    width: `${watermarkWidth}%`,
                    opacity: opacity / 100,
                    transform: `translate(-50%, -50%) rotate(${-angle}deg)`,
                  }}
                  onLoad={(event) =>
                    setWatermarkImageSize({
                      width: event.currentTarget.naturalWidth,
                      height: event.currentTarget.naturalHeight,
                    })
                  }
                />
              )}
            </div>
          )}
        </PdfPagePreviewPanel>
      )}
      {file && (
        <div className="pdf-watermark-position-controls">
          <p className="helper-text" id={placementHelpId}>
            {uiText("ลากลายน้ำเพื่อย้ายตำแหน่ง")}
          </p>
          <span className="pdf-watermark-position-readout">
            {Math.round(position.x * 100)}% · {Math.round(position.y * 100)}%
          </span>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setPosition({ x: 0.5, y: 0.5 })}
          >
            {uiText("จัดกึ่งกลาง")}
          </button>
        </div>
      )}
      <Action
        task={task}
        disabled={!file || !text.trim()}
        onClick={watermark}
        label={uiText("ใส่ลายน้ำและดาวน์โหลด")}
      />
      <Status task={task} />
    </Surface>
  );
}

type PdfPagePreviewState = {
  page: { image: string; width: number; height: number } | null;
  pageCount: number;
  loading: boolean;
  message: string;
  error: string;
};

function usePdfPagePreview(file: File | null, pageNumber: number) {
  const [page, setPage] = useState<PdfPagePreviewState["page"]>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const previousFile = useRef<File | null>(null);
  useEffect(() => {
    const fileChanged = previousFile.current !== file;
    previousFile.current = file;
    if (fileChanged) setPageCount(0);
    if (!file) {
      setPage(null);
      setLoading(false);
      setMessage("");
      setError("");
      return;
    }
    let active = true;
    let controller: AbortController | null = null;
    const render = () => {
      controller?.abort();
      if (document.hidden) {
        setLoading(false);
        setMessage("ตัวอย่างจะทำงานต่อเมื่อกลับมาที่แท็บนี้");
        return;
      }
      controller = new AbortController();
      const signal = controller.signal;
      setPage(null);
      setLoading(true);
      setError("");
      setMessage("กำลังสร้างตัวอย่างหน้า...");
      renderPdfPagePreview(file, pageNumber, signal)
        .then((result) => {
          if (!active || signal.aborted) return;
          setPage({
            image: result.image,
            width: result.width,
            height: result.height,
          });
          setPageCount(result.pageCount);
          setMessage("");
        })
        .catch((reason: unknown) => {
          if (!active || signal.aborted) return;
          setError(messageOf(reason, "ไม่สามารถสร้างตัวอย่างหน้าได้"));
          setMessage("");
        })
        .finally(() => {
          if (active && !signal.aborted) setLoading(false);
        });
    };
    document.addEventListener("visibilitychange", render);
    render();
    return () => {
      active = false;
      controller?.abort();
      document.removeEventListener("visibilitychange", render);
    };
  }, [file, pageNumber]);
  return { page, pageCount, loading, message, error };
}

function PdfPagePreviewPanel({
  preview,
  pageNumber,
  children,
  onDownload,
  downloadDisabled = false,
}: {
  preview: PdfPagePreviewState;
  pageNumber: number;
  children: ReactNode;
  onDownload?: () => void;
  downloadDisabled?: boolean;
}) {
  return (
    <section className="pdf-adjustment-preview">
      <header className="pdf-section-heading">
        <h3>{uiText("ตัวอย่าง")}</h3>
        <div className="pdf-preview-heading-actions">
          {preview.pageCount > 0 && (
            <p>
              {uiText("หน้า")} {pageNumber} / {preview.pageCount}
            </p>
          )}
          {onDownload && (
            <PreviewDownloadButton
              onClick={onDownload}
              disabled={downloadDisabled}
            />
          )}
        </div>
      </header>
      {preview.loading && <InlineLoading text="กำลังสร้างตัวอย่างหน้า..." />}
      {!preview.loading && preview.message && (
        <p className="helper-text" role="status">
          {uiText(preview.message)}
        </p>
      )}
      {preview.error && (
        <div className="inline-status error" role="alert">
          <p>{uiText(preview.error)}</p>
        </div>
      )}
      {preview.page && children}
    </section>
  );
}

function useTextImagePreview(value: string, size: number, color: string) {
  const [image, setImage] = useState("");
  useEffect(() => {
    setImage("");
    if (!value.trim()) {
      return;
    }
    let active = true;
    let imageUrl = "";
    const timer = window.setTimeout(() => {
      textToPng(value, size, color)
        .then((png) => {
          if (!active) return;
          const copy = new Uint8Array(png);
          imageUrl = URL.createObjectURL(
            new Blob([copy.buffer], { type: "image/png" }),
          );
          setImage(imageUrl);
        })
        .catch(() => {
          if (active) setImage("");
        });
    }, 70);
    return () => {
      active = false;
      window.clearTimeout(timer);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [value, size, color]);
  return image;
}

type PdfInfo = {
  pages: number;
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  created: string;
  modified: string;
  encrypted: string;
  sizes: string[];
};

function PdfMetadata() {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<PdfInfo | null>(null);
  const task = useTask();
  const selectFile = (files: File[]) => {
    const next = files[0] ?? null;
    setFile(next);
    setInfo(null);
    if (!next) return;
    void task.run(async () => {
      const { PDFDocument } = await import("pdf-lib");
      const document = await PDFDocument.load(await next.arrayBuffer(), {
        updateMetadata: false,
      });
      const sizes = [
        ...new Set(
          document.getPages().map((page) => {
            const { width, height } = page.getSize();
            return `${Math.round(width)} × ${Math.round(height)} pt`;
          }),
        ),
      ];
      setInfo({
        pages: document.getPageCount(),
        title: document.getTitle() || "—",
        author: document.getAuthor() || "—",
        subject: document.getSubject() || "—",
        keywords: document.getKeywords() || "—",
        creator: document.getCreator() || "—",
        producer: document.getProducer() || "—",
        created: formatDate(document.getCreationDate()),
        modified: formatDate(document.getModificationDate()),
        encrypted: document.isEncrypted ? "ใช่" : "ไม่",
        sizes,
      });
      return `อ่านข้อมูลสำเร็จ ${document.getPageCount()} หน้า`;
    }, "ไม่สามารถอ่านข้อมูล PDF นี้ได้");
  };
  const rows = info
    ? [
        ["จำนวนหน้า", String(info.pages)],
        ["ขนาดหน้า", info.sizes.join(", ")],
        ["ชื่อเรื่อง", info.title],
        ["ผู้เขียน", info.author],
        ["หัวข้อ", info.subject],
        ["Keywords", info.keywords],
        ["Creator", info.creator],
        ["Producer", info.producer],
        ["วันที่สร้าง", info.created],
        ["วันที่แก้ไข", info.modified],
        ["เข้ารหัส", info.encrypted],
      ]
    : [];
  return (
    <Surface>
      <FilePicker
        files={file ? [file] : []}
        accept="application/pdf,.pdf"
        label={uiText("เลือก PDF เพื่อดูข้อมูล")}
        detail="อ่านเฉพาะข้อมูลภายในไฟล์บนอุปกรณ์ของคุณ"
        onFiles={selectFile}
      />
      {task.working && <InlineLoading text={task.message} />}
      {info && (
        <div className="metadata-grid output-panel">
          {rows.map(([label, value]) => (
            <div key={label}>
              <span>{uiText(label)}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}
      <Status task={task} />
    </Surface>
  );
}

type TaskState = ReturnType<typeof useTask>;

function PdfChoiceField({
  label,
  value,
  icon,
  choices,
  onSelect,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  choices: Choice[];
  onSelect: (value: string) => void;
}) {
  const localizedLabel = uiText(label);
  return (
    <div className="field">
      <span>{localizedLabel}</span>
      <ChoiceMenu
        className="pdf-setting-choice"
        label={localizedLabel}
        value={value}
        icon={icon}
        choices={choices}
        onSelect={onSelect}
      />
    </div>
  );
}

function useTask() {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const progress = (value: string) => setMessage(value);
  const fail = (value: string) => {
    setError(value);
    setMessage("");
  };
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  const run = async (
    action: (signal: AbortSignal) => Promise<string>,
    fallback: string,
  ) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const stopWhenHidden = () => {
      if (document.hidden) controller.abort();
    };
    document.addEventListener("visibilitychange", stopWhenHidden);
    setWorking(true);
    setError("");
    setMessage("กำลังเตรียมไฟล์...");
    try {
      throwIfAborted(controller.signal);
      setMessage(await action(controller.signal));
    } catch (reason) {
      if (controller.signal.aborted)
        fail("งานหยุดเมื่อออกจากแท็บหรือหน้าเว็บแล้ว กรุณาเริ่มใหม่");
      else fail(messageOf(reason, fallback));
    } finally {
      document.removeEventListener("visibilitychange", stopWhenHidden);
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setWorking(false);
      }
    }
  };
  return { working, message, error, progress, fail, run };
}

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="tool-surface extended-surface">{children}</div>;
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{uiText(label)}</span>
      {children}
    </label>
  );
}
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="copy-button"
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? <Check size={15} /> : <Clipboard size={15} />}
      {copied ? uiText("คัดลอกแล้ว") : uiText("คัดลอก")}
    </button>
  );
}
function Action({
  task,
  disabled,
  onClick,
  label,
}: {
  task: TaskState;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      className="primary-button full"
      type="button"
      disabled={disabled || task.working}
      onClick={onClick}
    >
      {task.working ? (
        <LoaderCircle className="spin" size={18} />
      ) : (
        <Download size={18} />
      )}
      {task.working ? uiText(task.message) : uiText(label)}
    </button>
  );
}

function PreviewDownloadButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  const label = uiText("ดาวน์โหลดผลลัพธ์");
  return (
    <button
      className="preview-download-button"
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onClick()}
    >
      <Download size={17} aria-hidden="true" />
    </button>
  );
}

function Status({ task }: { task: TaskState }) {
  return task.error ? (
    <div className="inline-status error">
      <strong>{uiText("ทำรายการไม่สำเร็จ")}</strong>
      <p>{uiText(task.error)}</p>
    </div>
  ) : task.message && !task.working ? (
    <div className="inline-status success">
      <Check size={17} />
      <p>{uiText(task.message)}</p>
    </div>
  ) : null;
}
function InlineLoading({ text }: { text: string }) {
  return (
    <div className="inline-status">
      <LoaderCircle className="spin" size={17} />
      <p>{uiText(text)}</p>
    </div>
  );
}

function FilePicker({
  files,
  multiple,
  compact = false,
  accept,
  label,
  addMoreLabel,
  detail,
  onFiles,
  showPdfPreview = true,
  showSelectedFiles = true,
  onPdfPageCount,
  onPreviewDownload,
  previewDownloadDisabled = false,
}: {
  files: File[];
  multiple?: boolean;
  compact?: boolean;
  accept: string;
  label: string;
  addMoreLabel?: string;
  detail: string;
  onFiles: (files: File[]) => void;
  showPdfPreview?: boolean;
  showSelectedFiles?: boolean;
  onPdfPageCount?: (count: number) => void;
  onPreviewDownload?: () => void;
  previewDownloadDisabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const maxBytes = useContext(PdfMaxBytesContext);
  const receive = (candidates: File[]) => {
    try {
      const kind = accept.toLowerCase().includes("pdf") ? "pdf" : "image";
      for (const file of candidates) validateLocalFile(file, kind, maxBytes);
      setError("");
      onFiles(candidates);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "ไฟล์ชนิดหรือขนาดไม่รองรับ",
      );
      onFiles([]);
    }
  };
  const pdfFiles =
    showPdfPreview && accept.toLowerCase().includes("pdf") ? files : [];
  return (
    <>
      <button
        className={compact ? "drop-zone compact" : "drop-zone"}
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const dropped = Array.from(event.dataTransfer.files);
          receive(multiple ? dropped : dropped.slice(0, 1));
        }}
      >
        <UploadCloud size={31} />
        <strong>
          {files.length
            ? addMoreLabel ?? `${files.length} ${uiText("ไฟล์พร้อมใช้งาน")}`
            : uiText(label)}
        </strong>
        <span>
          {files.length
            ? `${files.length} ${uiText("ไฟล์พร้อมใช้งาน")} · ${files.map((file) => file.name).join(", ")} · ${formatBytes(files.reduce((sum, file) => sum + file.size, 0))}`
            : uiText(detail)}
        </span>
      </button>
      <input
        ref={input}
        className="sr-only"
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(event) => {
          receive(Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }}
      />
      {pdfFiles.length > 0 && (
        <section
          className="pdf-upload-previews"
          aria-label={uiText("ตัวอย่าง PDF ที่เลือก")}
        >
          <div className="pdf-section-heading">
            <h3>{uiText("ตัวอย่าง")}</h3>
            {onPreviewDownload && (
              <PreviewDownloadButton
                onClick={onPreviewDownload}
                disabled={previewDownloadDisabled}
              />
            )}
          </div>
          {pdfFiles.map((file) => (
            <PdfFilePreview
              key={file.name + "-" + file.size + "-" + file.lastModified}
              file={file}
              onPageCount={onPdfPageCount}
            />
          ))}
        </section>
      )}
      {showSelectedFiles && files.length > 0 && (
        <div className="selected-file-list" aria-label={uiText("ไฟล์ที่เลือก")}>
          {files.map((file, index) => (
            <div
              className="selected-file-row"
              key={file.name + "-" + file.size + "-" + file.lastModified}
            >
              <span>
                <strong>{file.name}</strong>
                <small>{formatBytes(file.size)}</small>
              </span>
              <button
                className="secondary-button"
                type="button"
                aria-label={uiText("ลบไฟล์") + ": " + file.name}
                onClick={() =>
                  onFiles(files.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                <Trash2 size={15} />
                {uiText("ลบไฟล์")}
              </button>
            </div>
          ))}
        </div>
      )}
      {error && (
        <div role="alert" className="inline-status error">
          <p>{uiText(error)}</p>
        </div>
      )}
    </>
  );
}

function SortableFiles({
  files,
  allowMove = true,
  onMove,
  onReorder,
  onRemove,
}: {
  files: File[];
  allowMove?: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onReorder: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  const reorder = (from: number, to: number) => {
    if (
      from === to ||
      from < 0 ||
      from >= files.length ||
      to < 0 ||
      to >= files.length
    )
      return;
    onReorder(from, to);
  };
  return (
    <div className="file-list sortable-file-list">
      {files.map((file, index) => (
        <div
          className="sortable-item"
          key={`${file.name}-${file.lastModified}-${index}`}
          draggable={allowMove}
          onDragStart={(event) => {
            if (!allowMove) return;
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(index));
          }}
          onDragOver={(event) => {
            if (!allowMove) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={(event) => {
            if (!allowMove) return;
            event.preventDefault();
            const raw = event.dataTransfer.getData("text/plain");
            if (raw) reorder(Number(raw), index);
          }}
        >
          <GripVertical className="drag-handle" aria-hidden="true" size={17} />
          <FilePlus2 size={18} />
          <span>
            <strong>
              {index + 1}. {file.name}
            </strong>
            <small>{formatBytes(file.size)}</small>
          </span>
          <div>
            {allowMove && (
              <>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMove(index, -1)}
                  aria-label={uiText("เลื่อนขึ้น")}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  disabled={index === files.length - 1}
                  onClick={() => onMove(index, 1)}
                  aria-label={uiText("เลื่อนลง")}
                >
                  <ArrowDown size={15} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={uiText("ลบไฟล์") + ": " + file.name}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PdfFilePreview({
  file,
  onPageCount,
}: {
  file: File;
  onPageCount?: (count: number) => void;
}) {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [message, setMessage] = useState("กำลังสร้างตัวอย่าง PDF…");
  const [viewerPage, setViewerPage] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;
    const render = () => {
      controller?.abort();
      if (document.hidden) {
        setMessage(uiText("ตัวอย่างจะทำงานต่อเมื่อกลับมาที่แท็บนี้"));
        return;
      }
      controller = new AbortController();
      const signal = controller.signal;
      setPages([]);
      setPageCount(0);
      setMessage("กำลังสร้างตัวอย่าง PDF…");
      renderPdfThumbnails(file, () => {}, 3, signal)
        .then((result) => {
          if (!active || signal.aborted) return;
          setPages(result.pages);
          setPageCount(result.pageCount);
          onPageCount?.(result.pageCount);
          setMessage("");
        })
        .catch(() => {
          if (active && !signal.aborted)
            setMessage("ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้");
        });
    };
    document.addEventListener("visibilitychange", render);
    render();
    return () => {
      active = false;
      controller?.abort();
      document.removeEventListener("visibilitychange", render);
    };
  }, [file, onPageCount]);
  return (
    <section
      className="pdf-preview-card"
      aria-label={`${uiText("ตัวอย่าง PDF")} ${file.name}`}
    >
      <header>
        <strong>{file.name}</strong>
        <span>{formatBytes(file.size)}</span>
      </header>
      {message && (
        <p className="helper-text" role="status">
          {uiText(message)}
        </p>
      )}
      {pages.length > 0 && (
        <div className="pdf-preview-pages">
          {pages.map((page, index) => (
            <figure key={page.originalIndex}>
              <button
                className="pdf-preview-page-button"
                type="button"
                aria-label={uiText("ขยายตัวอย่างหน้า PDF") + " " + (index + 1)}
                onClick={() => setViewerPage(index + 1)}
              >
                <img
                  src={page.preview}
                  alt={uiText("หน้า PDF") + " " + (index + 1)}
                />
                <span>
                  {uiText("หน้า ")}
                  {index + 1}
                  <ZoomIn size={14} />
                </span>
              </button>
            </figure>
          ))}
        </div>
      )}
      {pageCount > 0 && (
        <div className="pdf-preview-footer">
          <span>
            {pageCount} {uiText("หน้า")}
          </span>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setViewerPage(1)}
          >
            <ZoomIn size={15} />
            {uiText("ดูทุกหน้าแบบขยาย")}
          </button>
        </div>
      )}
      {viewerPage !== null && (
        <PdfPageViewer
          file={file}
          pageNumber={viewerPage}
          pageCount={pageCount}
          onClose={() => setViewerPage(null)}
        />
      )}
    </section>
  );
}

function PdfPageViewer({
  file,
  pageNumber,
  pageCount,
  onClose,
}: {
  file: File;
  pageNumber: number;
  pageCount: number;
  onClose: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    setCurrentPage(pageNumber);
  }, [pageNumber]);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;
    const render = () => {
      controller?.abort();
      if (document.hidden) {
        setLoading(false);
        setImage("");
        onClose();
        return;
      }
      controller = new AbortController();
      const signal = controller.signal;
      setLoading(true);
      setError("");
      setImage("");
      renderPdfPageImage(file, currentPage, signal)
        .then((result) => {
          if (active && !signal.aborted) setImage(result);
        })
        .catch((reason: unknown) => {
          if (active && !signal.aborted)
            setError(messageOf(reason, "ไม่สามารถแสดงหน้าที่เลือกได้"));
        })
        .finally(() => {
          if (active && !signal.aborted) setLoading(false);
        });
    };
    document.addEventListener("visibilitychange", render);
    render();
    return () => {
      active = false;
      controller?.abort();
      document.removeEventListener("visibilitychange", render);
    };
  }, [file, currentPage, onClose]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft")
        setCurrentPage((current) => Math.max(1, current - 1));
      else if (event.key === "ArrowRight")
        setCurrentPage((current) => Math.min(pageCount, current + 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, pageCount]);
  const changePage = (value: number) => {
    if (Number.isInteger(value) && value >= 1 && value <= pageCount)
      setCurrentPage(value);
  };
  return createPortal(
    <div
      className="pdf-page-viewer-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="pdf-page-viewer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header>
          <div>
            <h2 id={titleId}>
              {uiText("ตัวอย่าง PDF")} · {file.name}
            </h2>
            <p>
              {uiText("หน้า")} {currentPage} / {pageCount}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="secondary-button"
            aria-label={uiText("ปิดตัวอย่าง")}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="pdf-page-viewer-stage">
          {loading && <InlineLoading text="กำลังสร้างตัวอย่างหน้า..." />}
          {error && (
            <div className="inline-status error" role="alert">
              <p>{uiText(error)}</p>
            </div>
          )}
          {image && (
            <img src={image} alt={uiText("หน้า PDF") + " " + currentPage} />
          )}
        </div>
        <footer>
          <button
            className="secondary-button"
            type="button"
            disabled={currentPage <= 1}
            onClick={() => changePage(currentPage - 1)}
          >
            <ChevronLeft size={17} />
            {uiText("ก่อนหน้า")}
          </button>
          <label>
            {uiText("ไปหน้าที่")}
            <input
              type="number"
              min="1"
              max={pageCount}
              value={currentPage}
              onChange={(event) => changePage(Number(event.target.value))}
            />
          </label>
          <button
            className="secondary-button"
            type="button"
            disabled={currentPage >= pageCount}
            onClick={() => changePage(currentPage + 1)}
          >
            {uiText("ถัดไป")}
            <ChevronRight size={17} />
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<[T, string]>;
}) {
  return (
    <div className="segmented wide">
      {options.map(([id, label]) => (
        <button
          className={value === id ? "active" : ""}
          type="button"
          onClick={() => onChange(id)}
          key={id}
        >
          {uiText(label)}
        </button>
      ))}
    </div>
  );
}

type PdfThumbnailsResult = { pages: PageItem[]; pageCount: number };

async function renderPdfThumbnails(
  file: File,
  progress: (message: string) => void,
  maxPages = Number.POSITIVE_INFINITY,
  signal?: AbortSignal,
): Promise<PdfThumbnailsResult> {
  const opened = await loadPdfDocument(file, signal);
  try {
    const pages: PageItem[] = [];
    for (
      let number = 1;
      number <= Math.min(opened.document.numPages, maxPages);
      number += 1
    ) {
      throwIfAborted(signal);
      progress(
        "กำลังสร้างตัวอย่างหน้า " + number + " จาก " + opened.document.numPages,
      );
      const page = await opened.document.getPage(number);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(0.5, 160 / base.width, 200 / base.height);
      const viewport = page.getViewport({ scale });
      const canvas = documentCanvas(viewport.width, viewport.height);
      await renderPdfCanvas(page, canvas, viewport, signal);
      throwIfAborted(signal);
      pages.push({
        originalIndex: number - 1,
        rotation: 0,
        preview: canvas.toDataURL("image/jpeg", 0.72),
        width: base.width,
        height: base.height,
      });
      page.cleanup();
      canvas.width = 1;
      canvas.height = 1;
    }
    return { pages, pageCount: opened.document.numPages };
  } finally {
    await opened.close();
  }
}

async function renderPdfPageImage(
  file: File,
  pageNumber: number,
  signal: AbortSignal,
) {
  const opened = await loadPdfDocument(file, signal);
  try {
    if (pageNumber < 1 || pageNumber > opened.document.numPages)
      throw new Error("หมายเลขหน้าไม่อยู่ในเอกสาร");
    const page = await opened.document.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 1600 / base.width, 1800 / base.height);
    const viewport = page.getViewport({ scale });
    const canvas = documentCanvas(viewport.width, viewport.height);
    await renderPdfCanvas(page, canvas, viewport, signal);
    throwIfAborted(signal);
    const image = canvas.toDataURL("image/jpeg", 0.88);
    page.cleanup();
    canvas.width = 1;
    canvas.height = 1;
    return image;
  } finally {
    await opened.close();
  }
}

async function renderPdfPagePreview(
  file: File,
  pageNumber: number,
  signal: AbortSignal,
) {
  const opened = await loadPdfDocument(file, signal);
  try {
    if (pageNumber < 1 || pageNumber > opened.document.numPages)
      throw new Error("หมายเลขหน้าไม่อยู่ในเอกสาร");
    const page = await opened.document.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(1.5, 900 / base.width, 1200 / base.height);
    const viewport = page.getViewport({ scale });
    const canvas = documentCanvas(viewport.width, viewport.height);
    try {
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas ไม่พร้อมใช้งาน");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await renderPdfCanvas(page, canvas, viewport, signal);
      throwIfAborted(signal);
      return {
        image: canvas.toDataURL("image/jpeg", 0.9),
        width: base.width,
        height: base.height,
        pageCount: opened.document.numPages,
      };
    } finally {
      page.cleanup();
      canvas.width = 1;
      canvas.height = 1;
    }
  } finally {
    await opened.close();
  }
}

async function loadPdfDocument(file: File, signal?: AbortSignal) {
  const [pdfjs, workerModule] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  throwIfAborted(signal);
  pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;
  const loading = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useSystemFonts: true,
  });
  let destroyed = false;
  const destroy = async () => {
    if (destroyed) return;
    destroyed = true;
    await loading.destroy();
  };
  const abortLoading = () => {
    void destroy();
  };
  signal?.addEventListener("abort", abortLoading, { once: true });
  try {
    const document = await loading.promise;
    throwIfAborted(signal);
    return {
      document,
      close: async () => {
        signal?.removeEventListener("abort", abortLoading);
        await destroy();
      },
    };
  } catch (reason) {
    signal?.removeEventListener("abort", abortLoading);
    await destroy();
    throw reason;
  }
}

async function renderPdfCanvas(
  page: import("pdfjs-dist").PDFPageProxy,
  canvas: HTMLCanvasElement,
  viewport: ReturnType<import("pdfjs-dist").PDFPageProxy["getViewport"]>,
  signal?: AbortSignal,
) {
  throwIfAborted(signal);
  const rendering = page.render({ canvas, viewport });
  const cancel = () => rendering.cancel();
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    await rendering.promise;
    throwIfAborted(signal);
  } finally {
    signal?.removeEventListener("abort", cancel);
    if (signal?.aborted) rendering.cancel();
  }
}

async function renderPageToJpeg(
  page: import("pdfjs-dist").PDFPageProxy,
  scale: number,
  quality: number,
  signal?: AbortSignal,
) {
  const viewport = page.getViewport({ scale });
  const canvas = documentCanvas(viewport.width, viewport.height);
  await renderPdfCanvas(page, canvas, viewport, signal);
  const result = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("สร้าง JPG ไม่สำเร็จ")),
      "image/jpeg",
      quality,
    ),
  );
  canvas.width = 1;
  canvas.height = 1;
  return result;
}

function documentCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);
  return canvas;
}
function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
function normalizeRotation(value: number) {
  return ((value % 360) + 360) % 360;
}

type PageRangeRow = { from: string; to: string };
type NumberingSystem = "numeric" | "upper" | "lower" | "thai";
type NumberingRule = {
  from: string;
  to: string;
  start: string;
  system: NumberingSystem;
};

function PageRangesEditor({
  rows,
  onChange,
  pageCount,
}: {
  rows: PageRangeRow[];
  onChange: (rows: PageRangeRow[]) => void;
  pageCount: number;
}) {
  const last = rows[rows.length - 1];
  const lastEnd = Number(last?.to || last?.from || 0);
  const canAdd = !pageCount || lastEnd < pageCount;
  return (
    <section
      className="page-ranges-editor"
      aria-label={uiText("เลือกช่วงหน้า")}
    >
      {rows.map((range, index) => (
        <div className="page-range-row" key={index}>
          <Field label={uiText("จากหน้า")}>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max={pageCount || undefined}
              value={range.from}
              aria-label={
                uiText("ช่วงที่") +
                " " +
                (index + 1) +
                " · " +
                uiText("จากหน้า")
              }
              onChange={(event) =>
                onChange(
                  rows.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, from: event.target.value }
                      : item,
                  ),
                )
              }
            />
          </Field>
          <span className="page-range-separator" aria-hidden="true">
            —
          </span>
          <Field label={uiText("ถึงหน้า")}>
            <input
              type="number"
              inputMode="numeric"
              min={range.from || 1}
              max={pageCount || undefined}
              value={range.to}
              placeholder={uiText("หน้าเดียว")}
              aria-label={
                uiText("ช่วงที่") +
                " " +
                (index + 1) +
                " · " +
                uiText("ถึงหน้า")
              }
              onChange={(event) =>
                onChange(
                  rows.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, to: event.target.value }
                      : item,
                  ),
                )
              }
            />
          </Field>
          <button
            className="range-remove-button"
            type="button"
            disabled={rows.length <= 1}
            aria-label={uiText("ลบช่วงที่") + " " + (index + 1)}
            onClick={() =>
              onChange(rows.filter((_, itemIndex) => itemIndex !== index))
            }
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <div className="page-range-footer">
        <button
          className="secondary-button add-range-button"
          type="button"
          disabled={!canAdd}
          onClick={() =>
            onChange([
              ...rows,
              { from: String(Math.max(1, lastEnd + 1)), to: "" },
            ])
          }
        >
          <Plus size={16} />
          {uiText("เพิ่มช่วง")}
        </button>
        <small>
          {pageCount
            ? pageCount + " " + uiText("หน้าทั้งหมด")
            : uiText("จำนวนหน้าจะแสดงหลังโหลดตัวอย่าง PDF")}
        </small>
      </div>
    </section>
  );
}

function pageRangeRowsToGroups(rows: PageRangeRow[], pageCount: number) {
  if (!rows.length) throw new Error("กรุณาเพิ่มช่วงหน้าที่ต้องการ");
  const selected = new Set<number>();
  return rows.map((range) => {
    const from = Number(range.from);
    const to = range.to.trim() ? Number(range.to) : from;
    if (
      !Number.isSafeInteger(from) ||
      from < 1 ||
      !Number.isSafeInteger(to) ||
      to < from ||
      to > pageCount
    )
      throw new Error(
        "ช่วงหน้าไม่ถูกต้อง · ระบุหน้าตั้งแต่ 1 ถึง " + pageCount,
      );
    const pages: number[] = [];
    for (let number = from; number <= to; number += 1) {
      if (selected.has(number))
        throw new Error("ช่วงหน้าซ้ำกัน · แก้ไขช่วงที่เลือกก่อนทำต่อ");
      selected.add(number);
      pages.push(number - 1);
    }
    return pages;
  });
}

function validateNumberingRules(rules: NumberingRule[], pageCount: number) {
  if (!rules.length) throw new Error("เพิ่มรูปแบบเลขหน้าอย่างน้อยหนึ่งช่วง");
  const used = new Set<number>();
  return rules.map((rule) => {
    const from = Number(rule.from);
    const to = rule.to.trim() ? Number(rule.to) : pageCount;
    const start = Number(rule.start);
    if (
      !Number.isSafeInteger(from) ||
      from < 1 ||
      from > pageCount ||
      !Number.isSafeInteger(to) ||
      to < from ||
      to > pageCount
    )
      throw new Error("ช่วงเลขหน้าไม่ถูกต้อง · ระบุหน้า 1 ถึง " + pageCount);
    if (!Number.isSafeInteger(start) || start < 1 || start > 999999)
      throw new Error("เลขเริ่มต้นต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึง 999999");
    for (let page = from; page <= to; page += 1) {
      if (used.has(page))
        throw new Error("ช่วงเลขหน้าซ้ำกัน · แก้ไขรูปแบบก่อนทำต่อ");
      used.add(page);
    }
    return { from, to, start, system: rule.system };
  });
}

function sequenceLabel(system: NumberingSystem, value: number) {
  if (system === "numeric") return String(value);
  const characters =
    system === "upper"
      ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      : system === "lower"
        ? "abcdefghijklmnopqrstuvwxyz"
        : "กขคฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ";
  let number = Math.max(1, Math.floor(value));
  let result = "";
  while (number > 0) {
    number -= 1;
    result = characters[number % characters.length] + result;
    number = Math.floor(number / characters.length);
  }
  return result;
}

function numberingLabelForPage(
  rules: NumberingRule[],
  pageNumber: number,
  pageCount: number,
) {
  if (!pageCount) return "";
  const rule = rules.find((item) => {
    const from = Number(item.from);
    const to = item.to.trim() ? Number(item.to) : pageCount;
    const start = Number(item.start);
    return (
      Number.isSafeInteger(from) &&
      Number.isSafeInteger(to) &&
      Number.isSafeInteger(start) &&
      from >= 1 &&
      to >= from &&
      to <= pageCount &&
      start >= 1 &&
      start <= 999999 &&
      pageNumber >= from &&
      pageNumber <= to
    );
  });
  if (!rule) return "";
  return sequenceLabel(
    rule.system,
    Number(rule.start) + pageNumber - Number(rule.from),
  );
}

function ImagePreviewList({ files }: { files: File[] }) {
  return (
    <div className="image-to-pdf-preview-grid">
      {files.map((file, index) => (
        <ImagePreviewCard
          key={file.name + "-" + file.size + "-" + file.lastModified}
          file={file}
          index={index}
        />
      ))}
    </div>
  );
}

function ImagePreviewCard({ file, index }: { file: File; index: number }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);
  return (
    <figure className="image-to-pdf-preview-card">
      {url ? (
        <img src={url} alt={file.name} />
      ) : (
        <div className="image-preview-placeholder" aria-hidden="true" />
      )}
      <figcaption>
        <strong>
          {index + 1}. {file.name}
        </strong>
        <small>{formatBytes(file.size)}</small>
      </figcaption>
    </figure>
  );
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted)
    throw new DOMException("Operation aborted", "AbortError");
}

async function imageFileToPngBytes(file: File) {
  const image = await loadImage(file);
  const canvas = documentCanvas(image.naturalWidth, image.naturalHeight);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas ไม่พร้อมใช้งาน");
  context.drawImage(image, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (output) =>
        output ? resolve(output) : reject(new Error("แปลงรูปไม่สำเร็จ")),
      "image/png",
    ),
  );
  return new Uint8Array(await blob.arrayBuffer());
}

async function textToPng(value: string, size: number, color: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas ไม่พร้อมใช้งาน");
  context.font = `800 ${size}px system-ui, sans-serif`;
  const metrics = context.measureText(value);
  canvas.width = Math.ceil(metrics.width + size);
  canvas.height = Math.ceil(size * 1.8);
  const output = canvas.getContext("2d");
  if (!output) throw new Error("Canvas ไม่พร้อมใช้งาน");
  output.font = `800 ${size}px system-ui, sans-serif`;
  output.textAlign = "center";
  output.textBaseline = "middle";
  output.fillStyle = color;
  output.fillText(value, canvas.width / 2, canvas.height / 2);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("สร้างลายน้ำไม่สำเร็จ")),
      "image/png",
    ),
  );
  return new Uint8Array(await blob.arrayBuffer());
}

async function loadImage(file: Blob) {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("อ่านรูปไม่สำเร็จ"));
      image.src = url;
    });
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
function safeBaseName(name: string) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[\\/:*?"<>|]/g, "-")
      .slice(0, 90) || "document"
  );
}
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}
function messageOf(reason: unknown, fallback: string) {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}
function formatDate(value?: Date) {
  return value
    ? new Intl.DateTimeFormat(
        document.documentElement.lang === "en" ? "en-US" : "th-TH",
        { dateStyle: "medium", timeStyle: "short" },
      ).format(value)
    : "—";
}
function downloadBytes(bytes: Uint8Array, filename: string, type: string) {
  const copy = new Uint8Array(bytes);
  downloadBlob(new Blob([copy.buffer], { type }), filename);
}
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
