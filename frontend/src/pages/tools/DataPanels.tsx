import { uiText } from "@/lib/ui-text";
import { useId, useMemo, useRef, useState } from 'react'
import { useLanguage } from '@/lib/language'
import { Check, Clipboard, Download, FileSpreadsheet, UploadCloud } from 'lucide-react'
import { objectsToCsv, parseCsv, validateTabularFile } from './dataUtils'

const dataModes = [
  ['csv-viewer', 'ดู ค้นหา และเรียง CSV'],
  ['csv-to-table', 'CSV เป็นตาราง'],
  ['remove-duplicate-rows', 'ลบแถวซ้ำ'],
  ['sort-table', 'เรียงตาราง'],
  ['filter-table', 'กรองตาราง'],
  ['column-extractor', 'แยกคอลัมน์'],
  ['table-to-json', 'ตารางเป็น JSON'],
  ['table-to-csv', 'ตารางเป็น CSV'],
] as const

export function DataWorkspacePanel({ maxFileBytes = 104_857_600 }: { maxFileBytes?: number }) {
  const { language } = useLanguage()
  const [toolId, setToolId] = useState<string>(dataModes[0][0])
  const selected = dataModes.find(([id]) => id === toolId)
  return <div className="grid gap-3">
    <div className="tool-surface extended-surface data-mode-picker">
      <label className="field"><span>{uiText("โหมดข้อมูล")}</span><select value={toolId} onChange={(event) => setToolId(event.target.value)}>{dataModes.map(([id, label]) => <option value={id} key={id}>{uiText(label)}</option>)}</select></label>
      <p className="helper-text">{selected ? uiText(selected[1]) : ""} {uiText("· วางข้อมูลหรือเปิดไฟล์จากอุปกรณ์ของคุณ")}</p>
    </div>
    <DataToolPanel toolId={toolId} maxFileBytes={maxFileBytes} language={language} />
  </div>
}

function DataToolPanel({ toolId, maxFileBytes, language }: { toolId: string; maxFileBytes: number; language: "th" | "en" }) {
  const locale = language === 'en' ? 'en-US' : 'th-TH'
  const [input, setInput] = useState('')
  const [fileError, setFileError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [query, setQuery] = useState('')
  const [column, setColumn] = useState('')
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')
  const outputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const parsed = useMemo(() => parseTabularInput(input, toolId), [input, toolId])
  const headers = parsed.headers
  const selectedColumn = headers.includes(column) ? column : headers[0] ?? ''

  const rows = useMemo(() => {
    let next = parsed.rows
    if (toolId === 'remove-duplicate-rows') {
      const seen = new Set<string>()
      next = next.filter((row) => { const key = selectedColumn ? row[selectedColumn] ?? '' : JSON.stringify(row); if (seen.has(key)) return false; seen.add(key); return true })
    }
    if (toolId === 'sort-table' || (toolId === 'csv-viewer' && column)) next = [...next].sort((a, b) => compareValues(a[selectedColumn] ?? '', b[selectedColumn] ?? '') * (direction === 'desc' ? -1 : 1))
    const filter = query.trim().toLocaleLowerCase('th')
    if (filter && ['csv-viewer', 'filter-table'].includes(toolId)) next = next.filter((row) => headers.some((header) => String(row[header] ?? '').toLocaleLowerCase('th').includes(filter)))
    return next
  }, [column, direction, headers, parsed.rows, query, selectedColumn, toolId])

  const output = useMemo(() => {
    if (toolId === 'column-extractor') return rows.map((row) => row[selectedColumn] ?? '').join('\n')
    if (toolId === 'table-to-json') return JSON.stringify(rows, null, 2)
    if (toolId === 'table-to-csv' || toolId === 'remove-duplicate-rows' || toolId === 'sort-table' || toolId === 'filter-table') return objectsToCsv(rows)
    return ''
  }, [rows, selectedColumn, toolId])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleRows = ['csv-viewer', 'csv-to-table'].includes(toolId) ? rows.slice((currentPage - 1) * pageSize, currentPage * pageSize) : rows.slice(0, 200)
  const upload = async (file?: File) => {
    if (!file) return
    try {
      validateTabularFile(file, maxFileBytes)
      setInput(await file.text())
      setFileError('')
      setPage(1)
    } catch (reason) {
      setFileError(reason instanceof Error ? reason.message : 'เปิดไฟล์ไม่สำเร็จ')
    }
  }

  return <div className="tool-surface extended-surface">
    <div className="data-input-head" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void upload(event.dataTransfer.files[0]) }}><div><strong>{uiText("ข้อมูลต้นทาง")}</strong><span>{uiText("รองรับ CSV, TSV และ JSON array · ไฟล์อ่านในเบราว์เซอร์")}</span></div><button className="secondary-button" type="button" onClick={() => inputRef.current?.click()}><UploadCloud size={16} /> {uiText("เปิดไฟล์")}</button><input ref={inputRef} type="file" accept=".csv,.tsv,.txt,.json,text/csv,application/json" hidden onChange={(event) => { void upload(event.target.files?.[0]); event.currentTarget.value = '' }} /></div>
    <label className="editor"><span>{uiText("วางข้อมูล")}</span><textarea className="data-source" value={input} placeholder={uiText("วาง CSV, TSV หรือ JSON array ที่นี่…")} onChange={(event) => { setInput(event.target.value); setFileError(''); setPage(1) }} /></label>
    {fileError && <div className="inline-status error" role="alert"><p>{uiText(fileError)}</p></div>}
    {parsed.error ? <div className="inline-status error"><p>{uiText(parsed.error)}</p></div> : <>
      <div className="data-toolbar">
        {['csv-viewer', 'filter-table'].includes(toolId) && <label className="field grow"><span>{uiText("ค้นหาทุกคอลัมน์")}</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder={uiText("พิมพ์คำที่ต้องการค้นหา...")} /></label>}
        {['remove-duplicate-rows', 'sort-table', 'column-extractor'].includes(toolId) && <label className="field"><span>{uiText("คอลัมน์")}</span><select value={selectedColumn} onChange={(event) => setColumn(event.target.value)}>{headers.map((header) => <option value={header} key={header}>{header}</option>)}</select></label>}
        {toolId === 'sort-table' && <label className="field"><span>{uiText("ลำดับ")}</span><select value={direction} onChange={(event) => setDirection(event.target.value as 'asc' | 'desc')}><option value="asc">{uiText("น้อย → มาก")}</option><option value="desc">{uiText("มาก → น้อย")}</option></select></label>}
      </div>
      <div className="data-summary output-panel"><span><FileSpreadsheet size={15} /> {rows.length.toLocaleString(locale)} {uiText("แถว")}</span><span>{headers.length.toLocaleString(locale)} {uiText("คอลัมน์")}</span>{parsed.source && <span>{parsed.source}</span>}</div>
      {output && <div className="editor output-editor"><div className="editor-heading"><label htmlFor={outputId}>{uiText("ผลลัพธ์")}</label><div className="editor-actions"><CopyButton value={output} /></div></div><textarea id={outputId} className="data-output" aria-label={uiText("ผลลัพธ์")} readOnly value={output} /></div>}
      {headers.length > 0 && <div className="table-shell output-panel"><table><thead><tr>{headers.map((header) => <th key={header}>{toolId === 'csv-viewer' ? <button type="button" className={column === header ? 'active' : ''} onClick={() => { if (column === header) setDirection((value) => value === 'asc' ? 'desc' : 'asc'); else { setColumn(header); setDirection('asc') } }}>{header}{column === header ? direction === 'asc' ? ' ↑' : ' ↓' : ''}</button> : header}</th>)}</tr></thead><tbody>{visibleRows.map((row, rowIndex) => <tr key={rowIndex}>{headers.map((header) => <td key={header}>{row[header] ?? ''}</td>)}</tr>)}</tbody></table>{visibleRows.length === 0 && <div className="empty-table">{uiText("ไม่พบข้อมูลที่ตรงกับเงื่อนไข")}</div>}</div>}
      {['csv-viewer', 'csv-to-table'].includes(toolId) && rows.length > pageSize && <div className="pagination"><button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{uiText("ก่อนหน้า")}</button><span>{uiText("หน้า ")}{currentPage} / {totalPages}</span><button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>{uiText("ถัดไป")}</button><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value="10">{uiText("10 แถว")}</option><option value="25">{uiText("25 แถว")}</option><option value="50">{uiText("50 แถว")}</option></select></div>}
      {output && <div className="tool-actions"><button className="secondary-button" type="button" onClick={() => downloadText(output, toolId === 'table-to-json' ? 'table.json' : `${toolId}.csv`)}><Download size={16} /> {uiText("ดาวน์โหลดผลลัพธ์")}</button></div>}
      {rows.length > 200 && !['csv-viewer', 'csv-to-table'].includes(toolId) && <p className="helper-text">{uiText("ตารางตัวอย่างแสดง 200 แถวแรก แต่ไฟล์ส่งออกมีครบ ")}{rows.length.toLocaleString(locale)} {uiText("แถว")}</p>}
    </>}
  </div>
}

function parseTabularInput(input: string, toolId: string) {
  const trimmed = input.trim()
  if (!trimmed) return { headers: [] as string[], rows: [] as Record<string, string>[], source: '', error: '' }
  try {
    if (trimmed.startsWith('[')) {
      const value = JSON.parse(trimmed) as unknown
      if (!Array.isArray(value) || !value.every((item) => item && typeof item === 'object' && !Array.isArray(item))) throw new Error('JSON ต้องเป็น array of objects')
      const records = value as Record<string, unknown>[]
      const headers = [...new Set(records.flatMap((row) => Object.keys(row)))]
      return { headers, rows: records.map((row) => Object.fromEntries(headers.map((header) => [header, String(row[header] ?? '')]))), source: 'JSON', error: '' }
    }
    const delimiter = trimmed.includes('\t') && !trimmed.split(/\r?\n/, 1)[0].includes(',') ? '\t' : ','
    const matrix = delimiter === ',' ? parseCsv(trimmed) : trimmed.split(/\r?\n/).map((line) => line.split('\t'))
    const rawHeaders = matrix[0] ?? []
    const headers = rawHeaders.map((header, index) => header.trim() || `column_${index + 1}`)
    const rows = matrix.slice(1).filter((row) => row.some((cell) => cell.trim())).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])))
    return { headers, rows, source: delimiter === '\t' ? 'TSV' : 'CSV', error: '' }
  } catch (reason) { return { headers: [] as string[], rows: [] as Record<string, string>[], source: '', error: reason instanceof Error ? reason.message : `อ่านข้อมูลสำหรับ ${toolId} ไม่สำเร็จ` } }
}

function compareValues(left: string, right: string) { const a = Number(left); const b = Number(right); return left.trim() && right.trim() && Number.isFinite(a) && Number.isFinite(b) ? a - b : left.localeCompare(right, 'th', { numeric: true }) }
function CopyButton({ value }: { value: string }) { const [copied, setCopied] = useState(false); return <button className="copy-button" type="button" onClick={(event) => { event.preventDefault(); void navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1500) }}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? uiText('คัดลอกแล้ว') : uiText('คัดลอก')}</button> }
function downloadText(value: string, filename: string) { const url = URL.createObjectURL(new Blob([value], { type: 'text/plain;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
