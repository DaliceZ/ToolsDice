import { uiText } from "@/lib/ui-text";
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Clipboard, Download, FilePlus2, GripVertical, LoaderCircle, RotateCcw, RotateCw, Trash2, UploadCloud } from 'lucide-react'
import { parsePageSelection, validateLocalFile } from '../../lib/tool-engines'

const PdfMaxBytesContext = createContext(104_857_600)

export function PdfToolPanel({ toolId }: { toolId: string }) {
  if (toolId === 'pdf-text') return <PdfText />
  if (toolId === 'merge-pdf') return <MergePdf />
  if (['reorder-pdf-pages', 'rotate-pdf-pages', 'delete-pdf-pages'].includes(toolId)) return <OrganizePdf mode={toolId as 'reorder-pdf-pages' | 'rotate-pdf-pages' | 'delete-pdf-pages'} />
  if (toolId === 'split-pdf') return <SplitPdf />
  if (toolId === 'compress-pdf') return <CompressPdf />
  if (toolId === 'pdf-to-images') return <PdfToImages />
  if (toolId === 'images-to-pdf') return <ImagesToPdf />
  if (toolId === 'page-number-pdf') return <PageNumbersPdf />
  if (toolId === 'add-watermark') return <WatermarkPdf />
  if (toolId === 'pdf-metadata') return <PdfMetadata />
  return null
}

const pdfModes = [
  ['merge-pdf', 'รวมไฟล์'],
  ['split-pdf', 'แยกหน้า'],
  ['reorder-pdf-pages', 'จัดลำดับหน้า'],
  ['rotate-pdf-pages', 'หมุนหน้า'],
  ['delete-pdf-pages', 'ลบหน้า'],
  ['compress-pdf', 'ลดขนาด'],
  ['pdf-to-images', 'PDF เป็น JPG'],
  ['images-to-pdf', 'รูปภาพเป็น PDF'],
  ['page-number-pdf', 'ใส่เลขหน้า'],
  ['add-watermark', 'ใส่ลายน้ำ'],
  ['pdf-text', 'คัดลอกข้อความ'],
  ['pdf-metadata', 'ดูข้อมูล PDF'],
] as const

export function PdfWorkspacePanel({ maxFileBytes = 104_857_600 }: { maxFileBytes?: number }) {
  const [toolId, setToolId] = useState<string>(pdfModes[0][0])
  return <PdfMaxBytesContext.Provider value={maxFileBytes}>
    <div className="grid gap-3">
      <div className="tool-surface extended-surface pdf-mode-picker">
        <Field label={uiText("งานที่ต้องการทำ")}>
          <select value={toolId} onChange={(event) => setToolId(event.target.value)}>
            {pdfModes.map(([id, label]) => <option value={id} key={id}>{uiText(label)}</option>)}
          </select>
        </Field>
        <p className="helper-text">{uiText("ไฟล์จะถูกอ่านและประมวลผลในเบราว์เซอร์")}</p>
      </div>
      <PdfToolPanel toolId={toolId} />
    </div>
  </PdfMaxBytesContext.Provider>
}

function PdfText() {
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState('all')
  const [text, setText] = useState('')
  const task = useTask()
  const extract = () => task.run(async () => {
    if (!file) throw new Error('กรุณาเลือกไฟล์ PDF')
    const [pdfjs, workerModule] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ])
    pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default
    const loading = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true })
    const document = await loading.promise
    const selection = pages.trim().toLowerCase() === 'all'
      ? Array.from({ length: document.numPages }, (_, index) => index)
      : parsePageSelection(pages, document.numPages)
    const sections: string[] = []
    for (const [index, pageIndex] of selection.entries()) {
      task.progress(`กำลังอ่านหน้า ${index + 1} จาก ${selection.length}`)
      const page = await document.getPage(pageIndex + 1)
      const content = await page.getTextContent()
      sections.push(`หน้า ${pageIndex + 1}\n${content.items.map((item) => 'str' in item ? item.str : '').join(' ')}`)
      page.cleanup()
    }
    await loading.destroy()
    setText(sections.join('\n\n'))
    return `อ่านข้อความสำเร็จ ${selection.length} หน้า`
  }, 'ดึงข้อความไม่สำเร็จ กรุณาตรวจไฟล์ PDF และช่วงหน้าที่เลือก')
  return <Surface>
    <FilePicker files={file ? [file] : []} accept="application/pdf,.pdf" label={uiText("เลือก PDF ที่มีชั้นข้อความ")} detail="PDF ที่เป็นภาพสแกนอาจไม่มีข้อความให้คัดลอก" onFiles={(files) => { setFile(files[0] ?? null); setText('') }} />
    <Field label={uiText("หน้าที่ต้องการอ่าน")}><input value={pages} onChange={(event) => setPages(event.target.value)} placeholder={uiText("all หรือ 1-3,5")} /></Field>
    <Action task={task} disabled={!file} onClick={extract} label={uiText("ดึงข้อความ")} />
    {text && <label className="editor output-editor"><span>{uiText("ข้อความจาก PDF ")}<CopyButton value={text} /><button className="copy-button" type="button" onClick={() => downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'pdf-text.txt')}>{uiText("ดาวน์โหลด")}</button></span><textarea value={text} readOnly /></label>}
    <Status task={task} />
  </Surface>
}

function MergePdf() {
  const [files, setFiles] = useState<File[]>([])
  const task = useTask()
  const move = (index: number, direction: -1 | 1) => setFiles((current) => moveItem(current, index, index + direction))
  const merge = () => task.run(async () => {
    const { PDFDocument } = await import('pdf-lib')
    const output = await PDFDocument.create()
    let pageTotal = 0
    for (const file of files) {
      task.progress(`กำลังรวม ${file.name}`)
      const source = await PDFDocument.load(await file.arrayBuffer())
      const pages = await output.copyPages(source, source.getPageIndices())
      pages.forEach((page) => output.addPage(page))
      pageTotal += pages.length
    }
    output.setTitle('Merged with ToolsDice')
    downloadBytes(await output.save({ useObjectStreams: true }), 'toolsdice-merged.pdf', 'application/pdf')
    return `รวมสำเร็จ ${files.length} ไฟล์ · ${pageTotal} หน้า`
  }, 'ไม่สามารถรวม PDF ได้ กรุณาตรวจว่าไฟล์ไม่ถูกล็อกด้วยรหัสผ่าน')

  return <Surface><FilePicker multiple files={files} accept="application/pdf,.pdf" label={uiText("เลือก PDF ที่ต้องการรวม")} detail="เพิ่มได้หลายไฟล์ · เรียงลำดับก่อนดาวน์โหลด" onFiles={setFiles} />{files.length > 0 && <SortableFiles files={files} onMove={move} onReorder={(from, to) => setFiles((current) => moveItem(current, from, to))} onRemove={(index) => setFiles((current) => current.filter((_, item) => item !== index))} />}<Action task={task} disabled={!files.length} onClick={merge} label={uiText("รวมและดาวน์โหลด PDF")} /><Status task={task} /></Surface>
}

type PageItem = { originalIndex: number; rotation: number; preview: string; width: number; height: number }

function OrganizePdf({ mode }: { mode: 'reorder-pdf-pages' | 'rotate-pdf-pages' | 'delete-pdf-pages' }) {
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageItem[]>([])
  const [loading, setLoading] = useState(false)
  const task = useTask()

  const loadVersion = useRef(0)
  const selectFile = (files: File[]) => {
    const next = files[0] ?? null
    const version = ++loadVersion.current
    setFile(next); setPages([])
    if (!next) { setLoading(false); return }
    setLoading(true)
    renderPdfThumbnails(next, (message) => { if (loadVersion.current === version) task.progress(message) })
      .then((items) => { if (loadVersion.current === version) setPages(items) })
      .catch((error: unknown) => { if (loadVersion.current === version) task.fail(messageOf(error, 'ไม่สามารถสร้างตัวอย่างหน้าได้')) })
      .finally(() => { if (loadVersion.current === version) setLoading(false) })
  }

  const save = () => task.run(async () => {
    if (!file || !pages.length) throw new Error('ต้องเหลืออย่างน้อย 1 หน้า')
    const { PDFDocument, degrees } = await import('pdf-lib')
    const source = await PDFDocument.load(await file.arrayBuffer())
    const output = await PDFDocument.create()
    for (const pageItem of pages) {
      const [page] = await output.copyPages(source, [pageItem.originalIndex])
      page.setRotation(degrees(normalizeRotation(page.getRotation().angle + pageItem.rotation)))
      output.addPage(page)
    }
    downloadBytes(await output.save({ useObjectStreams: true }), `organized-${safeBaseName(file.name)}.pdf`, 'application/pdf')
    return `บันทึกสำเร็จ ${pages.length} หน้า`
  }, 'ไม่สามารถบันทึกไฟล์นี้ได้')

  return <Surface>
    <FilePicker files={file ? [file] : []} accept="application/pdf,.pdf" label={uiText("เลือก PDF เพื่อจัดหน้า")} detail="ตัวอย่างทุกหน้าสร้างบนอุปกรณ์ของคุณ" showPdfPreview={false} onFiles={selectFile} />
    {loading && <InlineLoading text={task.message || 'กำลังสร้างตัวอย่างหน้า...'} />}
    {pages.length > 0 && <>
      <div className="page-organizer">
        {pages.map((page, index) => <article
          className="page-tile sortable-item"
          key={`${page.originalIndex}-${index}`}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', String(index))
          }}
          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move' }}
          onDrop={(event) => {
            event.preventDefault()
            const raw = event.dataTransfer.getData('text/plain')
            const from = Number(raw)
            if (raw && Number.isInteger(from)) setPages((current) => moveItem(current, from, index))
          }}
          aria-roledescription={uiText("หน้าที่ลากจัดลำดับได้")}
        >
          <div className="page-thumb"><img src={page.preview} alt={`${uiText("หน้า PDF")} ${page.originalIndex + 1}`} style={{ transform: `rotate(${page.rotation}deg)` }} /><span>{index + 1}</span></div>
          <div className="page-details"><GripVertical className="drag-handle" aria-hidden="true" size={17} /><div><strong>{uiText("หน้าเดิม ")}{page.originalIndex + 1}</strong><small>{Math.round(page.width)} × {Math.round(page.height)} pt</small></div></div>
          <div className="page-actions">
            <button type="button" disabled={index === 0} onClick={() => setPages((current) => moveItem(current, index, index - 1))} aria-label={uiText("เลื่อนขึ้น")}><ArrowLeft size={15} /></button>
            <button type="button" disabled={index === pages.length - 1} onClick={() => setPages((current) => moveItem(current, index, index + 1))} aria-label={uiText("เลื่อนลง")}><ArrowRight size={15} /></button>
            <button type="button" onClick={() => setPages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, rotation: normalizeRotation(item.rotation - 90) } : item))} aria-label={uiText("หมุนซ้าย")}><RotateCcw size={15} /></button>
            <button type="button" onClick={() => setPages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, rotation: normalizeRotation(item.rotation + 90) } : item))} aria-label={uiText("หมุนขวา")}><RotateCw size={15} /></button>
            <button className="danger" type="button" onClick={() => setPages((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={uiText("ลบหน้า")}><Trash2 size={15} /></button>
          </div>
        </article>)}
      </div>
      <p className="helper-text">{uiText(mode === 'reorder-pdf-pages' ? 'ลากหน้าไปยังตำแหน่งใหม่ หรือใช้ปุ่มลูกศรเพื่อเรียงหน้า' : mode === 'rotate-pdf-pages' ? 'ลากเพื่อเรียงหน้า หรือหมุนและลบหน้าได้ตามต้องการ' : 'ลากเพื่อเรียงหน้า หรือหมุนและลบหน้าที่ไม่ต้องการก่อนบันทึก')}</p>
      <Action task={task} disabled={!pages.length} onClick={save} label={uiText("บันทึก PDF ที่จัดแล้ว")} />
    </>}
    <Status task={task} />
  </Surface>
}

function SplitPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'ranges' | 'each'>('ranges')
  const [ranges, setRanges] = useState('1-3; 4-6')
  const task = useTask()
  const split = () => task.run(async () => {
    if (!file) throw new Error('กรุณาเลือก PDF')
    const { PDFDocument } = await import('pdf-lib')
    const source = await PDFDocument.load(await file.arrayBuffer())
    const groups = mode === 'each' ? source.getPageIndices().map((index) => [index]) : parseRangeGroups(ranges, source.getPageCount())
    if (!groups.length) throw new Error('ช่วงหน้าไม่ถูกต้อง ใช้ ; คั่นไฟล์ เช่น 1-3; 4-6')
    const outputs: Record<string, Uint8Array> = {}
    for (let index = 0; index < groups.length; index += 1) {
      task.progress(`กำลังสร้างไฟล์ ${index + 1} จาก ${groups.length}`)
      const output = await PDFDocument.create()
      const pages = await output.copyPages(source, groups[index])
      pages.forEach((page) => output.addPage(page))
      outputs[`pages-${groups[index].map((page) => page + 1).join('-')}.pdf`] = await output.save({ useObjectStreams: true })
    }
    if (groups.length === 1) downloadBytes(outputs[Object.keys(outputs)[0]], `split-${safeBaseName(file.name)}.pdf`, 'application/pdf')
    else { const { zipSync } = await import('fflate'); downloadBytes(zipSync(outputs, { level: 6 }), `split-${safeBaseName(file.name)}.zip`, 'application/zip') }
    return `แยกสำเร็จ ${groups.length} ไฟล์`
  }, 'ไม่สามารถแยก PDF ได้')
  return <Surface><FilePicker files={file ? [file] : []} accept="application/pdf,.pdf" label={uiText("เลือก PDF ที่ต้องการแยก")} detail="ไฟล์ผลลัพธ์หลายรายการจะดาวน์โหลดเป็น ZIP" onFiles={(files) => setFile(files[0] ?? null)} /><Segmented value={mode} onChange={setMode} options={[['ranges', 'กำหนดช่วงหน้า'], ['each', 'แยกทุกหน้า']]} />{mode === 'ranges' && <Field label={uiText("ช่วงหน้า · ใช้ ; คั่นแต่ละไฟล์")}><input value={ranges} onChange={(event) => setRanges(event.target.value)} placeholder="1-3; 4-6; 8" /><small>{uiText("ตัวอย่าง 1-3; 4-6 จะได้ PDF 2 ไฟล์")}</small></Field>}<Action task={task} disabled={!file} onClick={split} label={uiText(mode === 'each' ? 'แยกทุกหน้าเป็น ZIP' : 'แยกและดาวน์โหลด')} /><Status task={task} /></Surface>
}

function CompressPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState<'small' | 'balanced' | 'quality'>('balanced')
  const task = useTask()
  const compress = () => task.run(async () => {
    if (!file) throw new Error('กรุณาเลือก PDF')
    const settings = quality === 'small' ? { scale: 1.05, jpeg: .5 } : quality === 'balanced' ? { scale: 1.45, jpeg: .7 } : { scale: 1.9, jpeg: .84 }
    const [pdfjs, workerModule, pdfLib] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url'), import('pdf-lib')])
    pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default
    const loading = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true })
    const source = await loading.promise
    const output = await pdfLib.PDFDocument.create()
    for (let number = 1; number <= source.numPages; number += 1) {
      task.progress(`กำลังบีบอัดหน้า ${number} จาก ${source.numPages}`)
      const page = await source.getPage(number)
      const base = page.getViewport({ scale: 1 })
      const rendered = await renderPageToJpeg(page, settings.scale, settings.jpeg)
      const embedded = await output.embedJpg(await rendered.arrayBuffer())
      const outputPage = output.addPage([base.width, base.height])
      outputPage.drawImage(embedded, { x: 0, y: 0, width: base.width, height: base.height })
      page.cleanup()
    }
    await loading.destroy()
    const bytes = await output.save({ useObjectStreams: true })
    downloadBytes(bytes, `compressed-${safeBaseName(file.name)}.pdf`, 'application/pdf')
    const reduction = Math.round((1 - bytes.length / file.size) * 100)
    return `${formatBytes(file.size)} → ${formatBytes(bytes.length)}${reduction > 0 ? ` · ลดลง ${reduction}%` : ' · ไฟล์ต้นฉบับบีบอัดมาดีอยู่แล้ว'}`
  }, 'ไม่สามารถลดขนาด PDF นี้ได้')
  return <Surface><FilePicker files={file ? [file] : []} accept="application/pdf,.pdf" label={uiText("เลือก PDF ที่ต้องการลดขนาด")} detail="ใช้การแปลงแต่ละหน้าเป็นภาพใหม่บนอุปกรณ์ของคุณ" onFiles={(files) => setFile(files[0] ?? null)} /><div className="notice-box warning"><strong>{uiText("โปรดทราบ")}</strong><p>{uiText("วิธีนี้ลดขนาดได้มาก แต่ข้อความจะกลายเป็นภาพและค้นหาหรือคัดลอกไม่ได้ เหมาะกับไฟล์สำหรับส่งหรืออ่าน")}</p></div><Segmented value={quality} onChange={setQuality} options={[['small', 'เล็กที่สุด'], ['balanced', 'สมดุล'], ['quality', 'คมชัด']]} /><Action task={task} disabled={!file} onClick={compress} label={uiText("ลดขนาดและดาวน์โหลด")} /><Status task={task} /></Surface>
}

function PdfToImages() {
  const [file, setFile] = useState<File | null>(null)
  const [range, setRange] = useState('all')
  const [quality, setQuality] = useState(88)
  const task = useTask()
  const convert = () => task.run(async () => {
    if (!file) throw new Error('กรุณาเลือก PDF')
    const [pdfjs, workerModule] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')])
    pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default
    const loading = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true })
    const document = await loading.promise
    const indices = range.trim().toLowerCase() === 'all' ? Array.from({ length: document.numPages }, (_, index) => index) : parsePageRange(range, document.numPages)
    if (!indices.length) throw new Error('ช่วงหน้าไม่ถูกต้อง')
    const outputs: Record<string, Uint8Array> = {}
    for (let item = 0; item < indices.length; item += 1) {
      task.progress(`กำลังแปลงหน้า ${item + 1} จาก ${indices.length}`)
      const page = await document.getPage(indices[item] + 1)
      const blob = await renderPageToJpeg(page, 2, quality / 100)
      outputs[`page-${String(indices[item] + 1).padStart(3, '0')}.jpg`] = new Uint8Array(await blob.arrayBuffer())
      page.cleanup()
    }
    await loading.destroy()
    if (indices.length === 1) downloadBytes(outputs[Object.keys(outputs)[0]], `page-${indices[0] + 1}.jpg`, 'image/jpeg')
    else { const { zipSync } = await import('fflate'); downloadBytes(zipSync(outputs, { level: 1 }), `${safeBaseName(file.name)}-jpg.zip`, 'application/zip') }
    return `แปลงสำเร็จ ${indices.length} หน้า`
  }, 'ไม่สามารถแปลง PDF นี้เป็นภาพได้')
  return <Surface><FilePicker files={file ? [file] : []} accept="application/pdf,.pdf" label={uiText("เลือก PDF ที่ต้องการแปลง")} detail="หลายหน้าจะดาวน์โหลดเป็น ZIP" onFiles={(files) => setFile(files[0] ?? null)} /><div className="field-grid two"><Field label={uiText("หน้าที่ต้องการ")}><input value={range} onChange={(event) => setRange(event.target.value)} placeholder={uiText("all หรือ 1-3, 5")} /></Field><Field label={`คุณภาพ JPG ${quality}%`}><input type="range" min="45" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></Field></div><Action task={task} disabled={!file} onClick={convert} label={uiText("แปลงเป็น JPG")} /><Status task={task} /></Surface>
}

function ImagesToPdf() {
  const [files, setFiles] = useState<File[]>([])
  const [pageSize, setPageSize] = useState<'auto' | 'a4'>('a4')
  const [margin, setMargin] = useState(24)
  const task = useTask()
  const convert = () => task.run(async () => {
    const { PDFDocument } = await import('pdf-lib')
    const output = await PDFDocument.create()
    for (let index = 0; index < files.length; index += 1) {
      task.progress(`กำลังเพิ่มภาพ ${index + 1} จาก ${files.length}`)
      const file = files[index]
      const pngBytes = file.type === 'image/jpeg' ? null : await imageFileToPngBytes(file)
      const image = file.type === 'image/jpeg' ? await output.embedJpg(await file.arrayBuffer()) : await output.embedPng(pngBytes!)
      const dimensions = image.scale(1)
      const landscape = dimensions.width > dimensions.height
      const [pageWidth, pageHeight] = pageSize === 'a4' ? (landscape ? [841.89, 595.28] : [595.28, 841.89]) : [dimensions.width * .75 + margin * 2, dimensions.height * .75 + margin * 2]
      const page = output.addPage([pageWidth, pageHeight])
      const scale = Math.min((pageWidth - margin * 2) / dimensions.width, (pageHeight - margin * 2) / dimensions.height)
      const width = dimensions.width * scale; const height = dimensions.height * scale
      page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height })
    }
    downloadBytes(await output.save({ useObjectStreams: true }), 'images-to-pdf.pdf', 'application/pdf')
    return `สร้าง PDF สำเร็จ ${files.length} หน้า`
  }, 'ไม่สามารถสร้าง PDF จากรูปเหล่านี้ได้')
  return <Surface><FilePicker multiple files={files} accept="image/jpeg,image/png,image/webp" label={uiText("เลือก JPG, PNG หรือ WebP")} detail="เรียงตามลำดับด้านล่าง · หนึ่งภาพต่อหนึ่งหน้า" onFiles={setFiles} />{files.length > 0 && <SortableFiles files={files} onMove={(index, direction) => setFiles((current) => moveItem(current, index, index + direction))} onReorder={(from, to) => setFiles((current) => moveItem(current, from, to))} onRemove={(index) => setFiles((current) => current.filter((_, item) => item !== index))} />}<div className="field-grid two"><Field label={uiText("ขนาดหน้า")}><select value={pageSize} onChange={(event) => setPageSize(event.target.value as 'auto' | 'a4')}><option value="a4">{uiText("A4 ตามแนวภาพ")}</option><option value="auto">{uiText("พอดีกับภาพ")}</option></select></Field><Field label={`ขอบ ${margin} pt`}><input type="range" min="0" max="72" value={margin} onChange={(event) => setMargin(Number(event.target.value))} /></Field></div><Action task={task} disabled={!files.length} onClick={convert} label={uiText("สร้างและดาวน์โหลด PDF")} /><Status task={task} /></Surface>
}

function PageNumbersPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [position, setPosition] = useState('bottom-center')
  const [format, setFormat] = useState('Page {n} of {total}')
  const [start, setStart] = useState(1)
  const [size, setSize] = useState(11)
  const task = useTask()
  const addNumbers = () => task.run(async () => {
    if (!file) throw new Error('กรุณาเลือก PDF')
    if (/[^\x20-\x7E]/.test(format)) throw new Error('รูปแบบเลขหน้ารองรับตัวอักษรอังกฤษและตัวเลขเท่านั้น')
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
    const document = await PDFDocument.load(await file.arrayBuffer())
    const font = await document.embedFont(StandardFonts.Helvetica)
    const pages = document.getPages()
    pages.forEach((page, index) => {
      const text = format.replaceAll('{n}', String(start + index)).replaceAll('{total}', String(start + pages.length - 1))
      const width = font.widthOfTextAtSize(text, size)
      const { width: pageWidth, height: pageHeight } = page.getSize()
      const x = position.endsWith('left') ? 28 : position.endsWith('right') ? pageWidth - width - 28 : (pageWidth - width) / 2
      const y = position.startsWith('top') ? pageHeight - size - 24 : 24
      page.drawText(text, { x, y, size, font, color: rgb(.24, .27, .31) })
    })
    downloadBytes(await document.save({ useObjectStreams: true }), `numbered-${safeBaseName(file.name)}.pdf`, 'application/pdf')
    return `ใส่เลขหน้าสำเร็จ ${pages.length} หน้า`
  }, 'ไม่สามารถใส่เลขหน้าได้')
  return <Surface><FilePicker files={file ? [file] : []} accept="application/pdf,.pdf" label={uiText("เลือก PDF สำหรับใส่เลขหน้า")} detail="รองรับเอกสารทุกขนาดหน้า" onFiles={(files) => setFile(files[0] ?? null)} /><div className="field-grid two"><Field label={uiText("รูปแบบ")}><input value={format} onChange={(event) => setFormat(event.target.value)} /><small>{uiText("ใช้ ")}{'{n}'} {uiText("สำหรับเลขหน้า และ ")}{'{total}'} {uiText("สำหรับหน้าสุดท้าย")}</small></Field><Field label={uiText("ตำแหน่ง")}><select value={position} onChange={(event) => setPosition(event.target.value)}><option value="bottom-left">{uiText("ล่างซ้าย")}</option><option value="bottom-center">{uiText("ล่างกลาง")}</option><option value="bottom-right">{uiText("ล่างขวา")}</option><option value="top-left">{uiText("บนซ้าย")}</option><option value="top-center">{uiText("บนกลาง")}</option><option value="top-right">{uiText("บนขวา")}</option></select></Field><Field label={uiText("เลขเริ่มต้น")}><input type="number" value={start} onChange={(event) => setStart(Number(event.target.value))} /></Field><Field label={`ขนาด ${size} pt`}><input type="range" min="8" max="24" value={size} onChange={(event) => setSize(Number(event.target.value))} /></Field></div><Action task={task} disabled={!file} onClick={addNumbers} label={uiText("ใส่เลขหน้าและดาวน์โหลด")} /><Status task={task} /></Surface>
}

function WatermarkPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(24)
  const [angle, setAngle] = useState(-35)
  const [size, setSize] = useState(42)
  const [color, setColor] = useState('#d04a52')
  const task = useTask()
  const watermark = () => task.run(async () => {
    if (!file || !text.trim()) throw new Error('กรุณาเลือกไฟล์และใส่ข้อความ')
    const { PDFDocument, degrees } = await import('pdf-lib')
    const document = await PDFDocument.load(await file.arrayBuffer())
    const png = await textToPng(text, size, color)
    const image = await document.embedPng(png)
    document.getPages().forEach((page) => {
      const { width, height } = page.getSize()
      const scale = Math.min(1, width * .68 / image.width)
      const drawWidth = image.width * scale; const drawHeight = image.height * scale
      page.drawImage(image, { x: (width - drawWidth) / 2, y: (height - drawHeight) / 2, width: drawWidth, height: drawHeight, rotate: degrees(angle), opacity: opacity / 100 })
    })
    downloadBytes(await document.save({ useObjectStreams: true }), `watermarked-${safeBaseName(file.name)}.pdf`, 'application/pdf')
    return `ใส่ลายน้ำสำเร็จ ${document.getPageCount()} หน้า`
  }, 'ไม่สามารถใส่ลายน้ำได้')
  return <Surface><FilePicker files={file ? [file] : []} accept="application/pdf,.pdf" label={uiText("เลือก PDF สำหรับใส่ลายน้ำ")} detail="ข้อความภาษาไทยและอังกฤษจะถูกสร้างเป็นภาพโปร่งใส" onFiles={(files) => setFile(files[0] ?? null)} /><Field label={uiText("ข้อความลายน้ำ")}><input value={text} onChange={(event) => setText(event.target.value)} maxLength={80} /></Field><div className="field-grid two"><Field label={`ความทึบ ${opacity}%`}><input type="range" min="5" max="80" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} /></Field><Field label={`มุม ${angle}°`}><input type="range" min="-90" max="90" value={angle} onChange={(event) => setAngle(Number(event.target.value))} /></Field><Field label={`ขนาด ${size}px`}><input type="range" min="20" max="96" value={size} onChange={(event) => setSize(Number(event.target.value))} /></Field><Field label={uiText("สี")}><input className="color-input" type="color" value={color} onChange={(event) => setColor(event.target.value)} /></Field></div><Action task={task} disabled={!file || !text.trim()} onClick={watermark} label={uiText("ใส่ลายน้ำและดาวน์โหลด")} /><Status task={task} /></Surface>
}

type PdfInfo = { pages: number; title: string; author: string; subject: string; keywords: string; creator: string; producer: string; created: string; modified: string; encrypted: string; sizes: string[] }

function PdfMetadata() {
  const [file, setFile] = useState<File | null>(null)
  const [info, setInfo] = useState<PdfInfo | null>(null)
  const task = useTask()
  const selectFile = (files: File[]) => {
    const next = files[0] ?? null
    setFile(next); setInfo(null)
    if (!next) return
    void task.run(async () => {
      const { PDFDocument } = await import('pdf-lib')
      const document = await PDFDocument.load(await next.arrayBuffer(), { updateMetadata: false })
      const sizes = [...new Set(document.getPages().map((page) => { const { width, height } = page.getSize(); return `${Math.round(width)} × ${Math.round(height)} pt` }))]
      setInfo({ pages: document.getPageCount(), title: document.getTitle() || '—', author: document.getAuthor() || '—', subject: document.getSubject() || '—', keywords: document.getKeywords() || '—', creator: document.getCreator() || '—', producer: document.getProducer() || '—', created: formatDate(document.getCreationDate()), modified: formatDate(document.getModificationDate()), encrypted: document.isEncrypted ? 'ใช่' : 'ไม่', sizes })
      return `อ่านข้อมูลสำเร็จ ${document.getPageCount()} หน้า`
    }, 'ไม่สามารถอ่านข้อมูล PDF นี้ได้')
  }
  const rows = info ? [['จำนวนหน้า', String(info.pages)], ['ขนาดหน้า', info.sizes.join(', ')], ['ชื่อเรื่อง', info.title], ['ผู้เขียน', info.author], ['หัวข้อ', info.subject], ['Keywords', info.keywords], ['Creator', info.creator], ['Producer', info.producer], ['วันที่สร้าง', info.created], ['วันที่แก้ไข', info.modified], ['เข้ารหัส', info.encrypted]] : []
  return <Surface><FilePicker files={file ? [file] : []} accept="application/pdf,.pdf" label={uiText("เลือก PDF เพื่อดูข้อมูล")} detail="อ่านเฉพาะข้อมูลภายในไฟล์บนอุปกรณ์ของคุณ" onFiles={selectFile} />{task.working && <InlineLoading text={task.message} />}{info && <div className="metadata-grid output-panel">{rows.map(([label, value]) => <div key={label}><span>{uiText(label)}</span><strong>{value}</strong></div>)}</div>}<Status task={task} /></Surface>
}

type TaskState = ReturnType<typeof useTask>

function useTask() {
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const progress = (value: string) => setMessage(value)
  const fail = (value: string) => { setError(value); setMessage('') }
  const run = async (action: () => Promise<string>, fallback: string) => {
    setWorking(true); setError(''); setMessage('กำลังเตรียมไฟล์...')
    try { setMessage(await action()) } catch (reason) { fail(messageOf(reason, fallback)) } finally { setWorking(false) }
  }
  return { working, message, error, progress, fail, run }
}

function Surface({ children }: { children: React.ReactNode }) { return <div className="tool-surface extended-surface">{children}</div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{uiText(label)}</span>{children}</label> }
function CopyButton({ value }: { value: string }) { const [copied, setCopied] = useState(false); return <button className="copy-button" type="button" onClick={() => { void navigator.clipboard.writeText(value).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500) }) }}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? uiText('คัดลอกแล้ว') : uiText('คัดลอก')}</button> }
function Action({ task, disabled, onClick, label }: { task: TaskState; disabled?: boolean; onClick: () => void; label: string }) { return <button className="primary-button full" type="button" disabled={disabled || task.working} onClick={onClick}>{task.working ? <LoaderCircle className="spin" size={18} /> : <Download size={18} />}{task.working ? uiText(task.message) : uiText(label)}</button> }
function Status({ task }: { task: TaskState }) { return task.error ? <div className="inline-status error"><strong>{uiText("ทำรายการไม่สำเร็จ")}</strong><p>{uiText(task.error)}</p></div> : task.message && !task.working ? <div className="inline-status success"><Check size={17} /><p>{uiText(task.message)}</p></div> : null }
function InlineLoading({ text }: { text: string }) { return <div className="inline-status"><LoaderCircle className="spin" size={17} /><p>{uiText(text)}</p></div> }

function FilePicker({ files, multiple, accept, label, detail, onFiles, showPdfPreview = true }: { files: File[]; multiple?: boolean; accept: string; label: string; detail: string; onFiles: (files: File[]) => void; showPdfPreview?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const maxBytes = useContext(PdfMaxBytesContext)
  const receive = (candidates: File[]) => {
    try {
      const kind = accept.toLowerCase().includes('pdf') ? 'pdf' : 'image'
      for (const file of candidates) validateLocalFile(file, kind, maxBytes)
      setError('')
      onFiles(candidates)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'ไฟล์ชนิดหรือขนาดไม่รองรับ')
      onFiles([])
    }
  }
  const pdfFiles = showPdfPreview && accept.toLowerCase().includes('pdf') ? files : []
  return <>
    <button className="drop-zone" type="button" onClick={() => input.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); const dropped = Array.from(event.dataTransfer.files); receive(multiple ? dropped : dropped.slice(0, 1)) }}>
      <UploadCloud size={31} />
      <strong>{files.length ? `${files.length} ${uiText('ไฟล์พร้อมใช้งาน')}` : uiText(label)}</strong>
      <span>{files.length ? `${files.map((file) => file.name).join(', ')} · ${formatBytes(files.reduce((sum, file) => sum + file.size, 0))}` : uiText(detail)}</span>
    </button>
    <input ref={input} className="sr-only" type="file" accept={accept} multiple={multiple} onChange={(event) => { receive(Array.from(event.target.files ?? [])); event.currentTarget.value = '' }} />
    {pdfFiles.length > 0 && <div className="pdf-upload-previews" aria-label={uiText("ตัวอย่าง PDF ที่เลือก")}>
      {pdfFiles.map((file) => <PdfFilePreview key={`${file.name}-${file.size}-${file.lastModified}`} file={file} />)}
    </div>}
    {error && <div role="alert" className="inline-status error"><p>{uiText(error)}</p></div>}
  </>
}

function SortableFiles({ files, onMove, onReorder, onRemove }: { files: File[]; onMove: (index: number, direction: -1 | 1) => void; onReorder: (from: number, to: number) => void; onRemove: (index: number) => void }) {
  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || from >= files.length || to < 0 || to >= files.length) return
    onReorder(from, to)
  }
  return <div className="file-list sortable-file-list">{files.map((file, index) => <div
    className="sortable-item"
    key={`${file.name}-${file.lastModified}-${index}`}
    draggable
    onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(index)) }}
    onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move' }}
    onDrop={(event) => { event.preventDefault(); const raw = event.dataTransfer.getData('text/plain'); if (raw) reorder(Number(raw), index) }}
  >
    <GripVertical className="drag-handle" aria-hidden="true" size={17} />
    <FilePlus2 size={18} />
    <span><strong>{index + 1}. {file.name}</strong><small>{formatBytes(file.size)}</small></span>
    <div><button type="button" disabled={index === 0} onClick={() => onMove(index, -1)} aria-label={uiText("เลื่อนขึ้น")}><ArrowUp size={15} /></button><button type="button" disabled={index === files.length - 1} onClick={() => onMove(index, 1)} aria-label={uiText("เลื่อนลง")}><ArrowDown size={15} /></button><button type="button" onClick={() => onRemove(index)} aria-label={uiText("ลบ")}><Trash2 size={15} /></button></div>
  </div>)}</div>
}

function PdfFilePreview({ file }: { file: File }) {
  const [pages, setPages] = useState<PageItem[]>([])
  const [message, setMessage] = useState('กำลังสร้างตัวอย่าง PDF…')
  useEffect(() => {
    let active = true
    setPages([])
    setMessage('กำลังสร้างตัวอย่าง PDF…')
    renderPdfThumbnails(file, () => {}, 3)
      .then((items) => { if (active) { setPages(items); setMessage('') } })
      .catch(() => { if (active) setMessage('ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้') })
    return () => { active = false }
  }, [file])
  return <section className="pdf-preview-card" aria-label={`${uiText("ตัวอย่าง PDF")} ${file.name}`}>
    <header><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></header>
    {message && <p className="helper-text" role="status">{uiText(message)}</p>}
    {pages.length > 0 && <div className="pdf-preview-pages">
      {pages.map((page, index) => <figure key={page.originalIndex}>
        <img src={page.preview} alt={`${uiText("หน้า PDF")} ${index + 1}`} />
        <figcaption>{uiText("หน้า ")}{index + 1}</figcaption>
      </figure>)}
    </div>}
  </section>
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (value: T) => void; options: Array<[T, string]> }) { return <div className="segmented wide">{options.map(([id, label]) => <button className={value === id ? 'active' : ''} type="button" onClick={() => onChange(id)} key={id}>{uiText(label)}</button>)}</div> }

async function renderPdfThumbnails(file: File, progress: (message: string) => void, maxPages = Number.POSITIVE_INFINITY): Promise<PageItem[]> {
  const [pdfjs, workerModule] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')])
  pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default
  const loading = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true })
  const document = await loading.promise
  const pages: PageItem[] = []
  for (let number = 1; number <= Math.min(document.numPages, maxPages); number += 1) {
    progress(`กำลังสร้างตัวอย่างหน้า ${number} จาก ${document.numPages}`)
    const page = await document.getPage(number)
    const base = page.getViewport({ scale: 1 })
    const scale = Math.min(1, 160 / base.width)
    const viewport = page.getViewport({ scale })
    const canvas = documentCanvas(viewport.width, viewport.height)
    await page.render({ canvas, viewport }).promise
    pages.push({ originalIndex: number - 1, rotation: 0, preview: canvas.toDataURL('image/jpeg', .72), width: base.width, height: base.height })
    page.cleanup()
  }
  await loading.destroy()
  return pages
}

async function renderPageToJpeg(page: import('pdfjs-dist').PDFPageProxy, scale: number, quality: number) {
  const viewport = page.getViewport({ scale })
  const canvas = documentCanvas(viewport.width, viewport.height)
  await page.render({ canvas, viewport }).promise
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('สร้าง JPG ไม่สำเร็จ')), 'image/jpeg', quality))
}

function documentCanvas(width: number, height: number) { const canvas = document.createElement('canvas'); canvas.width = Math.ceil(width); canvas.height = Math.ceil(height); return canvas }
function moveItem<T>(items: T[], from: number, to: number) { if (to < 0 || to >= items.length) return items; const next = [...items]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next }
function normalizeRotation(value: number) { return ((value % 360) + 360) % 360 }

function parsePageRange(value: string, max: number) {
  return parsePageSelection(value, max)
}
function parseRangeGroups(value: string, max: number) {
  const groups = value.split(';').map((group) => group.trim())
  if (!groups.length || groups.some((group) => !group))
    throw new Error('ทุกช่วงหน้าต้องมีหมายเลขหน้า เช่น 1-3; 4-6')
  return groups.map((group) => parsePageRange(group, max))
}

async function imageFileToPngBytes(file: File) {
  const image = await loadImage(file)
  const canvas = documentCanvas(image.naturalWidth, image.naturalHeight)
  const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas ไม่พร้อมใช้งาน')
  context.drawImage(image, 0, 0)
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((output) => output ? resolve(output) : reject(new Error('แปลงรูปไม่สำเร็จ')), 'image/png'))
  return new Uint8Array(await blob.arrayBuffer())
}

async function textToPng(value: string, size: number, color: string) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas ไม่พร้อมใช้งาน')
  context.font = `800 ${size}px system-ui, sans-serif`
  const metrics = context.measureText(value)
  canvas.width = Math.ceil(metrics.width + size)
  canvas.height = Math.ceil(size * 1.8)
  const output = canvas.getContext('2d'); if (!output) throw new Error('Canvas ไม่พร้อมใช้งาน')
  output.font = `800 ${size}px system-ui, sans-serif`; output.textAlign = 'center'; output.textBaseline = 'middle'; output.fillStyle = color; output.fillText(value, canvas.width / 2, canvas.height / 2)
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('สร้างลายน้ำไม่สำเร็จ')), 'image/png'))
  return new Uint8Array(await blob.arrayBuffer())
}

async function loadImage(file: Blob) { const url = URL.createObjectURL(file); try { return await new Promise<HTMLImageElement>((resolve, reject) => { const image = new window.Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('อ่านรูปไม่สำเร็จ')); image.src = url }) } finally { window.setTimeout(() => URL.revokeObjectURL(url), 0) } }
function safeBaseName(name: string) { return name.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, '-').slice(0, 90) || 'document' }
function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1024 ** 2).toFixed(2)} MB` }
function messageOf(reason: unknown, fallback: string) { return reason instanceof Error && reason.message ? reason.message : fallback }
function formatDate(value?: Date) { return value ? new Intl.DateTimeFormat(document.documentElement.lang === 'en' ? 'en-US' : 'th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(value) : '—' }
function downloadBytes(bytes: Uint8Array, filename: string, type: string) { const copy = new Uint8Array(bytes); downloadBlob(new Blob([copy.buffer], { type }), filename) }
function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
