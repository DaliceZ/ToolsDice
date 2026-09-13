import { uiText } from "@/lib/ui-text";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Check, Clipboard, Download, GripVertical, LoaderCircle, UploadCloud } from 'lucide-react'
import { validateLocalFile } from '../../lib/tool-engines'

type ImageToolId = 'image-resize' | 'image-crop' | 'image-compressor' | 'jpg-to-png' | 'png-to-jpg' | 'image-to-webp' | 'webp-to-png' | 'remove-image-metadata' | 'image-to-base64'
type LoadedImage = { file: File; image: HTMLImageElement; url: string; width: number; height: number }
type Status = { working: boolean; message: string; error: string }
type CropRect = { x: number; y: number; width: number; height: number }
type CropDrag = { mode: 'draw' | 'move' | 'nw' | 'ne' | 'sw' | 'se'; startX: number; startY: number; initial: CropRect }

export function ImageToolPanel({ toolId, maxFileBytes = 104_857_600 }: { toolId: string; maxFileBytes?: number }) {
  if (toolId === 'base64-to-image') return <Base64ToImage maxFileBytes={maxFileBytes} />
  if (toolId === 'favicon-generator') return <FaviconGenerator maxFileBytes={maxFileBytes} />
  return <ImageWorkbench toolId={toolId as ImageToolId} maxFileBytes={maxFileBytes} />
}

function ImageWorkbench({ toolId, maxFileBytes }: { toolId: ImageToolId; maxFileBytes: number }) {
  const [source, setSource] = useState<LoadedImage | null>(null)
  const [width, setWidth] = useState(1200)
  const [height, setHeight] = useState(800)
  const [resizeScale, setResizeScale] = useState(100)
  const [lockRatio, setLockRatio] = useState(true)
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: 800, height: 800 })
  const [quality, setQuality] = useState(.86)
  const [maxDimension, setMaxDimension] = useState(1920)
  const [background, setBackground] = useState('#ffffff')
  const [result, setResult] = useState<{ url: string; blob: Blob; name: string; width: number; height: number } | null>(null)
  const [status, setStatus] = useState<Status>({ working: false, message: '', error: '' })
  const cropStageRef = useRef<HTMLDivElement>(null)
  const cropDragRef = useRef<CropDrag | null>(null)
  const conversionVersion = useRef(0)

  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url) }, [source])
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url) }, [result])

  const accept = toolId === 'jpg-to-png' ? 'image/jpeg,.jpg,.jpeg' : toolId === 'webp-to-png' ? 'image/webp,.webp' : 'image/*'
  const onFile = async (file?: File) => {
    if (!file) return
    setStatus({ working: true, message: 'กำลังอ่านรูปภาพ...', error: '' })
    try {
      const next = await loadImage(file, maxFileBytes)
      setResult(null)
      setSource(next)
      setWidth(next.width); setHeight(next.height)
      setResizeScale(100)
      const square = Math.min(next.width, next.height)
      setCrop({ x: Math.floor((next.width - square) / 2), y: Math.floor((next.height - square) / 2), width: square, height: square })
      setStatus({ working: false, message: `${next.width} × ${next.height} px · ${formatBytes(file.size)}`, error: '' })
    } catch (reason) { setStatus({ working: false, message: '', error: messageOf(reason, 'อ่านไฟล์รูปภาพไม่สำเร็จ') }) }
  }

  const changeWidth = (next: number) => {
    setWidth(next)
    if (lockRatio && source) setHeight(Math.max(1, Math.round(next * source.height / source.width)))
  }
  const changeHeight = (next: number) => {
    setHeight(next)
    if (lockRatio && source) setWidth(Math.max(1, Math.round(next * source.width / source.height)))
  }

  const changeScale = (next: number) => {
    setResizeScale(next)
    if (!source) return
    setWidth(clamp(source.width * next / 100, 1, 12000))
    setHeight(clamp(source.height * next / 100, 1, 12000))
  }

  const cropPoint = (event: PointerEvent<HTMLDivElement>) => {
    if (!source || !cropStageRef.current) return { x: 0, y: 0 }
    const bounds = cropStageRef.current.getBoundingClientRect()
    return {
      x: clamp((event.clientX - bounds.left) / bounds.width * source.width, 0, source.width - 1),
      y: clamp((event.clientY - bounds.top) / bounds.height * source.height, 0, source.height - 1),
    }
  }

  const startCropDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!source) return
    event.preventDefault()
    const point = cropPoint(event)
    const target = event.target as HTMLElement
    const handle = target.dataset.cropHandle as CropDrag['mode'] | undefined
    const mode: CropDrag['mode'] = handle ?? (target.closest('.image-crop-selection') ? 'move' : 'draw')
    cropDragRef.current = { mode, startX: point.x, startY: point.y, initial: crop }
    event.currentTarget.setPointerCapture(event.pointerId)
    if (mode === 'draw') setCrop({ x: point.x, y: point.y, width: 1, height: 1 })
  }

  const moveCropDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!source || !cropDragRef.current) return
    const point = cropPoint(event)
    const drag = cropDragRef.current
    if (drag.mode === 'draw') {
      setCrop({
        x: Math.min(drag.startX, point.x),
        y: Math.min(drag.startY, point.y),
        width: Math.max(1, Math.abs(point.x - drag.startX)),
        height: Math.max(1, Math.abs(point.y - drag.startY)),
      })
      return
    }
    if (drag.mode === 'move') {
      setCrop({
        ...drag.initial,
        x: clamp(drag.initial.x + point.x - drag.startX, 0, source.width - drag.initial.width),
        y: clamp(drag.initial.y + point.y - drag.startY, 0, source.height - drag.initial.height),
      })
      return
    }
    const dx = point.x - drag.startX
    const dy = point.y - drag.startY
    const left = drag.initial.x + (drag.mode.includes('w') ? dx : 0)
    const right = drag.initial.x + drag.initial.width + (drag.mode.includes('e') ? dx : 0)
    const top = drag.initial.y + (drag.mode.includes('n') ? dy : 0)
    const bottom = drag.initial.y + drag.initial.height + (drag.mode.includes('s') ? dy : 0)
    setCrop({ x: Math.min(left, right), y: Math.min(top, bottom), width: Math.max(1, Math.abs(right - left)), height: Math.max(1, Math.abs(bottom - top)) })
  }

  const endCropDrag = (event: PointerEvent<HTMLDivElement>) => {
    cropDragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const nudgeCrop = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!source || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    const step = event.shiftKey ? 10 : 1
    setCrop((current) => ({
      ...current,
      x: clamp(current.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0), 0, source.width - current.width),
      y: clamp(current.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0), 0, source.height - current.height),
    }))
  }

  const convert = useCallback(async () => {
    if (!source) return
    const version = ++conversionVersion.current
    setStatus({ working: true, message: 'กำลังประมวลผลบนอุปกรณ์ของคุณ...', error: '' })
    try {
      let canvas: HTMLCanvasElement
      let mime = 'image/png'
      let extension = 'png'
      if (toolId === 'image-crop') {
        const safeCrop = {
          x: clamp(crop.x, 0, source.width - 1), y: clamp(crop.y, 0, source.height - 1),
          width: clamp(crop.width, 1, source.width - clamp(crop.x, 0, source.width - 1)),
          height: clamp(crop.height, 1, source.height - clamp(crop.y, 0, source.height - 1)),
        }
        canvas = drawCanvas(source.image, safeCrop.width, safeCrop.height, [safeCrop.x, safeCrop.y, safeCrop.width, safeCrop.height])
      } else {
        const scale = toolId === 'image-compressor' ? Math.min(1, maxDimension / Math.max(source.width, source.height)) : 1
        const outputWidth = toolId === 'image-resize' ? clamp(width, 1, 12000) : Math.max(1, Math.round(source.width * scale))
        const outputHeight = toolId === 'image-resize' ? clamp(height, 1, 12000) : Math.max(1, Math.round(source.height * scale))
        const fill = ['png-to-jpg'].includes(toolId) ? background : undefined
        canvas = drawCanvas(source.image, outputWidth, outputHeight, undefined, fill)
      }
      if (toolId === 'image-compressor') { mime = 'image/webp'; extension = 'webp' }
      if (toolId === 'png-to-jpg') { mime = 'image/jpeg'; extension = 'jpg' }
      if (toolId === 'image-to-webp') { mime = 'image/webp'; extension = 'webp' }
      if (toolId === 'jpg-to-png' || toolId === 'webp-to-png') { mime = 'image/png'; extension = 'png' }
      if (toolId === 'remove-image-metadata') {
        mime = source.file.type === 'image/png' ? 'image/png' : source.file.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
        extension = mime.split('/')[1].replace('jpeg', 'jpg')
      }
      const blob = await canvasBlob(canvas, mime, quality)
      if (version !== conversionVersion.current) return
      extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || extension
      const url = URL.createObjectURL(blob)
      const name = `${stripExtension(source.file.name)}-${toolId}.${extension}`
      setResult({ url, blob, name, width: canvas.width, height: canvas.height })
      setStatus({ working: false, message: `${canvas.width} × ${canvas.height} px · ${formatBytes(blob.size)}`, error: '' })
    } catch (reason) {
      if (version === conversionVersion.current) setStatus({ working: false, message: '', error: messageOf(reason, 'ประมวลผลรูปภาพไม่สำเร็จ') })
    }
  }, [background, crop, height, maxDimension, quality, source, toolId, width])

  useEffect(() => {
    if (!source || toolId === 'image-to-base64') return
    const timer = window.setTimeout(() => { void convert() }, 180)
    return () => { window.clearTimeout(timer); conversionVersion.current += 1 }
  }, [convert, source, toolId])

  if (toolId === 'image-to-base64') return <ImageToBase64 source={source} status={status} onFile={onFile} />

  return <Surface>
    <ImagePicker source={source} accept={accept} onFile={onFile} />
    {source && <>
      {toolId === 'image-resize' && <>
        <Field label={`${uiText("ปรับขนาดภาพ")} · ${resizeScale}%`}>
          <input aria-label={uiText("ปรับขนาดภาพ")} type="range" min="10" max="200" step="5" value={resizeScale} onChange={(event) => changeScale(Number(event.target.value))} />
        </Field>
        <div className="field-grid two">
          <Field label={uiText("ความกว้าง (px)")}><input type="number" min="1" max="12000" value={width} onChange={(event) => changeWidth(Number(event.target.value))} /></Field>
          <Field label={uiText("ความสูง (px)")}><input type="number" min="1" max="12000" value={height} onChange={(event) => changeHeight(Number(event.target.value))} /></Field>
        </div>
        <Toggle checked={lockRatio} onChange={setLockRatio} label={uiText("ล็อกอัตราส่วนภาพ")} />
      </>}
      {toolId === 'image-compressor' && <><Field label={uiText("ด้านยาวสูงสุด (px)")}><select value={maxDimension} onChange={(event) => setMaxDimension(Number(event.target.value))}><option value={1920}>1920 px</option><option value={1280}>1280 px</option><option value={800}>800 px</option></select></Field><Field label={`คุณภาพ WebP ${Math.round(quality * 100)}%`}><input type="range" min=".35" max="1" step=".01" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></Field></>}
      {toolId === 'image-crop' && <>
        <p className="helper-text">{uiText("ลากบนภาพเพื่อเลือกส่วนที่ต้องการครอบ จับตรงกลางเพื่อย้าย หรือจับจุดมุมเพื่อปรับขนาด")}</p>
        <div
          ref={cropStageRef}
          className="image-crop-stage"
          style={{ width: `min(100%, ${Math.round(Math.min(900, source.width / source.height * 384))}px)`, aspectRatio: `${source.width} / ${source.height}` }}
          role="group"
          aria-label={uiText("พื้นที่ครอบภาพ ลากเพื่อเลือกและปรับกรอบ")}
          tabIndex={0}
          onPointerDown={startCropDrag}
          onPointerMove={moveCropDrag}
          onPointerUp={endCropDrag}
          onPointerCancel={endCropDrag}
          onKeyDown={nudgeCrop}
        >
          <img className="image-crop-source" src={source.url} alt={uiText("ภาพต้นฉบับสำหรับครอบ")} draggable={false} />
          <div className="image-crop-selection" style={{ left: `${crop.x / source.width * 100}%`, top: `${crop.y / source.height * 100}%`, width: `${crop.width / source.width * 100}%`, height: `${crop.height / source.height * 100}%` }} aria-hidden="true">
            <GripVertical className="crop-move-grip" size={18} />
            {(['nw', 'ne', 'sw', 'se'] as const).map((handle) => <span key={handle} className={`crop-handle crop-handle-${handle}`} data-crop-handle={handle} />)}
          </div>
        </div>
        <p className="crop-dimensions" aria-live="polite">{crop.width.toLocaleString()} × {crop.height.toLocaleString()} px</p>
      </>}
      {['png-to-jpg'].includes(toolId) && <Field label={uiText("สีพื้นหลัง")}><div className="color-inline"><input type="color" value={background} onChange={(event) => setBackground(event.target.value)} /><code>{background.toUpperCase()}</code></div></Field>}
      {['png-to-jpg', 'image-to-webp', 'remove-image-metadata'].includes(toolId) && <Field label={`คุณภาพ ${Math.round(quality * 100)}%`}><input type="range" min=".35" max="1" step=".01" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></Field>}
    </>}
    <StatusView status={status} />
    {result && <div className="image-result output-panel" aria-live="polite"><figure><figcaption className="image-preview-heading"><span>{uiText("ตัวอย่างผลลัพธ์")} · {result.width.toLocaleString()} × {result.height.toLocaleString()} px</span><button className="preview-download-button" type="button" aria-label={uiText("ดาวน์โหลดผลลัพธ์")} title={uiText("ดาวน์โหลดผลลัพธ์")} onClick={() => downloadBlob(result.blob, result.name)}><Download size={17} aria-hidden="true" /></button></figcaption><img src={result.url} alt={uiText("ผลลัพธ์รูปภาพ")} /></figure><div><strong>{result.name}</strong><span>{formatBytes(result.blob.size)}</span><button className="secondary-button" type="button" onClick={() => downloadBlob(result.blob, result.name)}><Download size={16} /> {uiText("ดาวน์โหลดรูปภาพ")}</button></div></div>}
  </Surface>
}

function ImageToBase64({ source, status, onFile }: { source: LoadedImage | null; status: Status; onFile: (file?: File) => void }) {
  const [value, setValue] = useState('')
  const outputId = useId()
  useEffect(() => {
    if (!source) return
    const reader = new FileReader()
    reader.onload = () => setValue(String(reader.result ?? ''))
    reader.readAsDataURL(source.file)
  }, [source])
  return <Surface><ImagePicker source={source} accept="image/*" onFile={onFile} /><StatusView status={status} />{value && <div className="editor output-editor"><div className="editor-heading"><label htmlFor={outputId}>Data URL</label><div className="editor-actions"><CopyButton value={value} /></div></div><textarea id={outputId} className="base64-output" aria-label="Data URL" readOnly value={value} /></div>}</Surface>
}

function Base64ToImage({ maxFileBytes }: { maxFileBytes: number }) {
  const [value, setValue] = useState('')
  const tooLong = value.length > Math.ceil(maxFileBytes * 4 / 3) + 256
  const parsed = useMemo(() => tooLong ? null : parseDataUrl(value), [tooLong, value])
  const tooLarge = tooLong || Boolean(parsed && parsed.blob.size > maxFileBytes)
  const filename = parsed ? `decoded-image.${extensionForMime(parsed.mime)}` : "";
  return <Surface><label className="editor"><span>{uiText("Base64 หรือ Data URL")}</span><textarea className="base64-output" value={value} onChange={(event) => setValue(event.target.value)} placeholder="data:image/png;base64,..." /></label>{value && !parsed && !tooLarge && <div className="inline-status error"><p>{uiText("ไม่พบข้อมูลรูปภาพ PNG, JPEG หรือ WebP Base64 ที่ถูกต้อง")}</p></div>}{tooLarge && <div className="inline-status error"><p>{uiText("รูปภาพมีขนาดเกินขีดจำกัดที่รองรับ กรุณาใช้ข้อมูลรูปที่เล็กกว่า")}</p></div>}{parsed && !tooLarge && <div className="image-result output-panel"><figure><figcaption className="image-preview-heading"><span>{uiText("ตัวอย่างผลลัพธ์")}</span><button className="preview-download-button" type="button" aria-label={uiText("ดาวน์โหลดผลลัพธ์")} title={uiText("ดาวน์โหลดผลลัพธ์")} onClick={() => downloadBlob(parsed.blob, filename)}><Download size={17} aria-hidden="true" /></button></figcaption><img src={parsed.url} alt={uiText("รูปภาพจาก Base64")} /></figure><div><strong>{parsed.mime}</strong><span>{formatBytes(parsed.blob.size)}</span><button className="secondary-button" type="button" onClick={() => downloadBlob(parsed.blob, filename)}><Download size={16} /> {uiText("ดาวน์โหลด")}</button></div></div>}</Surface>
}

function FaviconGenerator({ maxFileBytes }: { maxFileBytes: number }) {
  const [source, setSource] = useState<LoadedImage | null>(null)
  const [initials, setInitials] = useState('DT')
  const [color, setColor] = useState('#4f8cff')
  const [status, setStatus] = useState<Status>({ working: false, message: '', error: '' })
  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url) }, [source])
  const onFile = async (file?: File) => {
    if (!file) return
    try { const next = await loadImage(file, maxFileBytes); setSource((current) => { if (current) URL.revokeObjectURL(current.url); return next }) } catch (reason) { setStatus({ working: false, message: '', error: messageOf(reason, 'อ่านรูปภาพไม่สำเร็จ') }) }
  }
  const generate = async () => {
    setStatus({ working: true, message: 'กำลังสร้างไอคอน...', error: '' })
    try {
      const files: Record<string, Uint8Array> = {}
      for (const size of [16, 32, 48, 180, 192, 512]) {
        const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size
        const context = canvas.getContext('2d'); if (!context) throw new Error('เบราว์เซอร์ไม่รองรับ Canvas')
        if (source) context.drawImage(source.image, 0, 0, size, size)
        else { context.fillStyle = color; context.fillRect(0, 0, size, size); context.fillStyle = '#fff'; context.font = `800 ${Math.round(size * .42)}px system-ui`; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(initials.trim().slice(0, 3).toUpperCase() || 'DT', size / 2, size / 2 + size * .02) }
        files[`favicon-${size}x${size}.png`] = new Uint8Array(await (await canvasBlob(canvas, 'image/png')).arrayBuffer())
      }
      const { zipSync } = await import('fflate')
      downloadBlob(new Blob([zipSync(files)], { type: 'application/zip' }), 'toolsdice-favicons.zip')
      setStatus({ working: false, message: 'สร้าง Favicon 6 ขนาดและดาวน์โหลด ZIP แล้ว', error: '' })
    } catch (reason) { setStatus({ working: false, message: '', error: messageOf(reason, 'สร้าง Favicon ไม่สำเร็จ') }) }
  }
  return <Surface><ImagePicker source={source} accept="image/*" onFile={onFile} optional /><div className="favicon-preview output-panel"><div className="image-preview-heading"><span>{uiText("ตัวอย่าง Favicon")}</span><button className="preview-download-button" type="button" aria-label={uiText("ดาวน์โหลดผลลัพธ์")} title={uiText("ดาวน์โหลดผลลัพธ์")} disabled={status.working} onClick={() => void generate()}><Download size={17} aria-hidden="true" /></button></div><div style={{ backgroundColor: color }}>{source ? <img src={source.url} alt={uiText("ตัวอย่างไอคอน")}/>:<strong>{initials.trim().slice(0, 3).toUpperCase() || 'DT'}</strong>}</div><small>{source ? `${source.width} × ${source.height} px` : uiText("ตัวอย่างอักษรย่อ")}</small></div><div className="field-grid two"><Field label={uiText("อักษรย่อ (ใช้เมื่อไม่เลือกรูป)")}><input maxLength={3} value={initials} onChange={(event) => setInitials(event.target.value)} /></Field><Field label={uiText("สีพื้นหลัง")}><div className="color-inline"><input type="color" value={color} onChange={(event) => setColor(event.target.value)} /><code>{color.toUpperCase()}</code></div></Field></div><button className="primary-button full" type="button" disabled={status.working} onClick={() => void generate()}>{status.working ? <LoaderCircle className="spin" size={18} /> : <Download size={18} />} {uiText("สร้างชุด Favicon")}</button><StatusView status={status} /></Surface>
}

function ImagePicker({ source, accept, onFile, optional }: { source: LoadedImage | null; accept: string; onFile: (file?: File) => void; optional?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return <><button className="drop-zone image-drop" type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); onFile(event.dataTransfer.files[0]) }}><input ref={inputRef} type="file" accept={accept} hidden onChange={(event) => { onFile(event.target.files?.[0]); event.currentTarget.value = '' }} />{source ? <><img src={source.url} alt={uiText("รูปภาพต้นฉบับ")} /><span><strong>{source.file.name}</strong><small>{source.width} × {source.height} px · {formatBytes(source.file.size)}</small></span></> : <><UploadCloud size={25} /><span><strong>{uiText("เลือกหรือลากรูปภาพมาที่นี่")}</strong><small>{uiText(optional ? 'ไม่เลือกรูปก็สร้างจากอักษรย่อได้' : 'ไฟล์อยู่บนอุปกรณ์ของคุณตลอดการทำงาน')}</small></span></>}</button></>
}

function Surface({ children }: { children: React.ReactNode }) { return <div className="tool-surface extended-surface">{children}</div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{uiText(label)}</span>{children}</label> }
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) { return <label className="toggle-line"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span><Check size={13} /></span>{uiText(label)}</label> }
function StatusView({ status }: { status: Status }) { return status.error ? <div className="inline-status error"><p>{uiText(status.error)}</p></div> : status.message ? <div className={`inline-status ${status.working ? '' : 'success'}`}>{status.working ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}<p>{uiText(status.message)}</p></div> : null }
function CopyButton({ value }: { value: string }) { const [copied, setCopied] = useState(false); return <button className="copy-button" type="button" onClick={(event) => { event.preventDefault(); void navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1500) }}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? uiText('คัดลอกแล้ว') : uiText('คัดลอก')}</button> }

function loadImage(file: File, maxFileBytes: number) {
  return new Promise<LoadedImage>((resolve, reject) => {
    try { validateLocalFile(file, 'image', maxFileBytes) } catch (reason) { reject(reason); return }
    const url = URL.createObjectURL(file); const image = new Image()
    image.onload = () => resolve({ file, image, url, width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('ไม่สามารถเปิดรูปภาพนี้ได้')) }
    image.src = url
  })
}
function drawCanvas(image: HTMLImageElement, width: number, height: number, source?: [number, number, number, number], fill?: string) { const canvas = document.createElement('canvas'); canvas.width = Math.round(width); canvas.height = Math.round(height); const context = canvas.getContext('2d'); if (!context) throw new Error('เบราว์เซอร์ไม่รองรับ Canvas'); if (fill) { context.fillStyle = fill; context.fillRect(0, 0, canvas.width, canvas.height) } if (source) context.drawImage(image, ...source, 0, 0, canvas.width, canvas.height); else context.drawImage(image, 0, 0, canvas.width, canvas.height); return canvas }
function canvasBlob(canvas: HTMLCanvasElement, mime: string, quality = .9) { return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('สร้างไฟล์รูปภาพไม่สำเร็จ')), mime, quality)) }
function parseDataUrl(value: string) {
  try {
    const trimmed = value.trim()
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/i.exec(trimmed)
    if (trimmed.startsWith('data:') && !match) return null
    const payload = (match?.[2] ?? trimmed).replace(/\s+/g, '')
    if (!payload || !/^[a-z\d+/]+={0,2}$/i.test(payload)) return null
    const binary = atob(payload)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const detected = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      ? 'image/png'
      : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
        ? 'image/jpeg'
        : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
          ? 'image/webp'
          : ''
    const mime = match?.[1].toLowerCase() ?? detected
    if (!mime || mime !== detected) return null
    const blob = new Blob([bytes], { type: mime })
    return { blob, mime, url: `data:${mime};base64,${payload}` }
  } catch { return null }
}
function extensionForMime(mime: string) { return mime.split('/')[1]?.replace('jpeg', 'jpg').replace('svg+xml', 'svg') || 'png' }
function stripExtension(name: string) { return name.replace(/\.[^.]+$/, '') || 'image' }
function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1024 ** 2).toFixed(2)} MB` }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, Number.isFinite(value) ? Math.round(value) : min)) }
function messageOf(reason: unknown, fallback: string) { return reason instanceof Error && reason.message ? reason.message : fallback }
