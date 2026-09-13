import { uiText } from "@/lib/ui-text";
import { useId, useMemo, useState } from 'react'
import { useLanguage } from '@/lib/language'
import { Check, Clipboard, Download, FileCode2, Hash, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react'
import type { ToolDefinition } from '../../lib/tool-registry'
import { objectsToCsv, parseCsv } from './dataUtils'

const textIds = new Set(['word-counter', 'character-counter', 'remove-duplicate-lines', 'sort-lines', 'trim-spaces', 'find-replace', 'text-to-slug', 'remove-empty-lines', 'reverse-text', 'text-statistics'])
const developerIds = new Set(['jwt-decoder', 'cron-helper', 'sql-formatter', 'html-beautifier', 'css-beautifier', 'javascript-beautifier', 'html-minifier', 'css-minifier', 'javascript-minifier'])
const converterIds = new Set(['csv-json', 'color-picker', 'number-base-converter'])
const generatorIds = new Set(['password-generator', 'random-string-generator', 'lorem-generator', 'random-number-generator'])

export function ExtendedToolPanel({ tool }: { tool: ToolDefinition }) {
  if (textIds.has(tool.id)) return <TextUtility kind={tool.id} />
  if (developerIds.has(tool.id)) return <DeveloperUtility kind={tool.id} />
  if (converterIds.has(tool.id)) return <ConverterUtility kind={tool.id} />
  if (generatorIds.has(tool.id)) return <GeneratorUtility kind={tool.id} />
  return null
}

function TextUtility({ kind }: { kind: string }) {
  const [input, setInput] = useState('ToolsDice makes small tasks quicker.\nEvery tool runs in your browser.\nToolsDice makes small tasks quicker.')
  const [sortMode, setSortMode] = useState('az')
  const [reverseMode, setReverseMode] = useState('characters')
  const [find, setFind] = useState('Daily')
  const [replace, setReplace] = useState('My')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [randomized, setRandomized] = useState('')
  const stats = textStats(input)
  const output = useMemo(() => {
    if (kind === 'remove-duplicate-lines') return [...new Set(input.split(/\r?\n/))].join('\n')
    if (kind === 'sort-lines') {
      const lines = input.split(/\r?\n/)
      if (sortMode === 'random') return randomized || input
      if (sortMode === 'numeric') return [...lines].sort((a, b) => Number(a) - Number(b)).join('\n')
      return [...lines].sort((a, b) => a.localeCompare(b, 'th', { numeric: true }) * (sortMode === 'za' ? -1 : 1)).join('\n')
    }
    if (kind === 'trim-spaces') return input.split(/\r?\n/).map((line) => line.trim().replace(/[ \t]+/g, ' ')).join('\n').trim()
    if (kind === 'find-replace') {
      if (!find) return input
      const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return input.replace(new RegExp(escaped, caseSensitive ? 'g' : 'gi'), replace)
    }
    if (kind === 'text-to-slug') return input.normalize('NFKD').toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '')
    if (kind === 'remove-empty-lines') return input.split(/\r?\n/).filter((line) => line.trim()).join('\n')
    if (kind === 'reverse-text') return reverseMode === 'lines' ? input.split(/\r?\n/).reverse().join('\n') : reverseMode === 'words' ? input.split(/(\s+)/).reverse().join('') : [...input].reverse().join('')
    return input
  }, [caseSensitive, find, input, kind, randomized, replace, reverseMode, sortMode])
  const metricOnly = ['word-counter', 'character-counter', 'text-statistics'].includes(kind)
  return <Surface>{kind === 'sort-lines' && <Segmented value={sortMode} onChange={(value) => { setSortMode(value); if (value === 'random') setRandomized(shuffleLines(input)) }} options={[['az', 'A → Z'], ['za', 'Z → A'], ['numeric', 'ตัวเลข'], ['random', 'สุ่ม']]} />}{kind === 'reverse-text' && <Segmented value={reverseMode} onChange={setReverseMode} options={[['characters', 'ตัวอักษร'], ['words', 'คำ'], ['lines', 'บรรทัด']]} />}{kind === 'find-replace' && <div className="field-grid two"><Field label={uiText("ค้นหา")}><input value={find} onChange={(event) => setFind(event.target.value)} /></Field><Field label={uiText("แทนที่ด้วย")}><input value={replace} onChange={(event) => setReplace(event.target.value)} /></Field><Toggle checked={caseSensitive} onChange={setCaseSensitive} label={uiText("แยกตัวพิมพ์เล็ก-ใหญ่")} /></div>}<Editor label={uiText("ข้อความ")} value={input} onChange={(value) => { setInput(value); if (sortMode === 'random') setRandomized(shuffleLines(value)) }} />{metricOnly ? <Metrics stats={stats} /> : <Editor label={uiText("ผลลัพธ์")} value={output} readOnly action={<CopyButton value={output} />} />}<div className="tool-actions"><button className="secondary-button" type="button" onClick={() => { setInput(''); setRandomized('') }}>{uiText("ล้าง")}</button><DownloadText value={metricOnly ? input : output} filename={`${kind}.txt`} /></div>{kind === 'find-replace' && <p className="helper-text">{uiText("พบ ")}{countOccurrences(input, find, caseSensitive)} {uiText("ตำแหน่ง")}</p>}</Surface>
}

function DeveloperUtility({ kind }: { kind: string }) {
  if (kind === 'json-validator') return <JsonValidator />
  if (kind === 'json-viewer') return <JsonViewer />
  if (kind === 'jwt-decoder') return <JwtDecoder />
  if (kind === 'cron-helper') return <CronHelper />
  return <CodeTransformer kind={kind} />
}

function JsonValidator() {
  const [value, setValue] = useState('{"name":"ToolsDice","privacy":true}')
  const result = validateJson(value)
  return <Surface><Editor label="JSON" value={value} onChange={setValue} /><div className={`inline-status ${result.ok ? 'success' : 'error'}`}>{result.ok ? <Check size={17} /> : <FileCode2 size={17} />}<p>{uiText(result.message)}</p></div>{result.ok && <Editor label={uiText("JSON ที่จัดรูปแบบแล้ว")} value={result.output} readOnly action={<CopyButton value={result.output} />} />}</Surface>
}

function JsonViewer() {
  const [value, setValue] = useState('{"project":"ToolsDice","categories":["PDF","Text","Image"],"privacy":{"clientSide":true}}')
  const parsed = validateJson(value)
  return <Surface><Editor label="JSON" value={value} onChange={setValue} />{parsed.ok ? <div className="json-tree"><JsonNode name="root" value={JSON.parse(value) as unknown} depth={0} /></div> : <div className="inline-status error"><p>{uiText(parsed.message)}</p></div>}</Surface>
}

function JsonNode({ name, value, depth }: { name: string; value: unknown; depth: number }) {
  if (value && typeof value === 'object') {
    const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const) : Object.entries(value as Record<string, unknown>)
    return <details open={depth < 2}><summary><code>{name}</code><span>{Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`}</span></summary><div>{entries.map(([key, item]) => <JsonNode name={key} value={item} depth={depth + 1} key={key} />)}</div></details>
  }
  return <p className="json-leaf"><code>{name}</code><span className={value === null ? 'null' : typeof value}>{JSON.stringify(value)}</span></p>
}

function JwtDecoder() {
  const [token, setToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRhaWx5IFRvb2xzIiwiaWF0IjoxNzAwMDAwMDAwfQ.demo')
  let header = ''; let payload = ''; let error = ''
  try { const [first, second] = token.trim().split('.'); if (!first || !second) throw new Error('JWT ต้องมีอย่างน้อย 2 ส่วน'); header = JSON.stringify(JSON.parse(decodeBase64Url(first)) as unknown, null, 2); payload = JSON.stringify(JSON.parse(decodeBase64Url(second)) as unknown, null, 2) } catch (reason) { error = messageOf(reason, 'JWT ไม่ถูกต้อง') }
  return <Surface><div className="notice-box warning"><ShieldCheck size={18} /><div><strong>{uiText("Decode ไม่ใช่ Verification")}</strong><p>{uiText("เครื่องมือนี้อ่านข้อมูลเท่านั้น ไม่ตรวจลายเซ็นและไม่ควรใช้ตัดสินความน่าเชื่อถือของ token")}</p></div></div><Editor label="JWT" value={token} onChange={setToken} />{error ? <div className="inline-status error"><p>{uiText(error)}</p></div> : <div className="dual-editor"><Editor label="Header" value={header} readOnly action={<CopyButton value={header} />} /><Editor label="Payload" value={payload} readOnly action={<CopyButton value={payload} />} /></div>}</Surface>
}

function CronHelper() {
  const [value, setValue] = useState('0 9 * * 1-5')
  const result = explainCron(value)
  const presets = [['ทุก 5 นาที', '*/5 * * * *'], ['ทุกวัน 09:00', '0 9 * * *'], ['จันทร์-ศุกร์ 09:00', '0 9 * * 1-5'], ['วันแรกของเดือน', '0 0 1 * *']]
  return <Surface><Field label="Cron expression (5 fields)"><input className="code-input" value={value} onChange={(event) => setValue(event.target.value)} /></Field><div className={`inline-status ${result.valid ? 'success' : 'error'}`}><p>{uiText(result.description)}</p></div><div className="preset-grid">{presets.map(([label, cron]) => <button className="secondary-button" type="button" onClick={() => setValue(cron)} key={cron}><span>{uiText(label)}</span><code>{cron}</code></button>)}</div><div className="cron-fields">{['นาที', 'ชั่วโมง', 'วันที่', 'เดือน', 'วันในสัปดาห์'].map((label, index) => <div key={label}><span>{uiText(label)}</span><code>{value.trim().split(/\s+/)[index] ?? '—'}</code></div>)}</div></Surface>
}

function CodeTransformer({ kind }: { kind: string }) {
  const { language } = useLanguage()
  const defaults: Record<string, string> = { 'sql-formatter': 'select id,name from users where active=true order by name;', 'html-beautifier': '<main><h1>ToolsDice</h1><p>Privacy first</p></main>', 'css-beautifier': '.card{display:flex;color:#fff;background:#111}', 'javascript-beautifier': 'function hello(name){const text="Hello "+name;return text;}', 'html-minifier': '<main>\n  <!-- note -->\n  <h1>ToolsDice</h1>\n</main>', 'css-minifier': '.card {\n color: #fff;\n padding: 16px;\n}', 'javascript-minifier': 'function add(a, b) {\n  // add numbers\n  return a + b;\n}' }
  const [input, setInput] = useState(defaults[kind] ?? '')
  const output = transformCode(kind, input)
  const locale = language === 'en' ? 'en-US' : 'th-TH'
  return <Surface><div className="dual-editor code-editors"><Editor label={uiText("ต้นฉบับ")} value={input} onChange={setInput} /><Editor label={uiText("ผลลัพธ์")} value={output} readOnly action={<CopyButton value={output} />} /></div><div className="tool-actions"><span className="helper-text">{input.length.toLocaleString(locale)} → {output.length.toLocaleString(locale)} {uiText("ตัวอักษร")}</span><DownloadText value={output} filename={`${kind}.txt`} /></div></Surface>
}

function ConverterUtility({ kind }: { kind: string }) {
  if (kind === 'color-converter' || kind === 'color-picker') return <ColorConverter />
  if (kind === 'number-base-converter') return <NumberBaseConverter />
  return <TextConverter kind={kind} />
}

function TextConverter({ kind }: { kind: string }) {
  const { language } = useLanguage()
  const defaults: Record<string, string> = { 'json-to-yaml': '{"name":"ToolsDice","privacy":true,"categories":["PDF","Image"]}', 'yaml-to-json': 'name: ToolsDice\nprivacy: true\ncategories:\n  - PDF\n  - Image', 'csv-to-json': 'name,category,active\nMerge PDF,PDF,true\nJSON Formatter,Developer,true', 'json-to-csv': '[{"name":"Merge PDF","category":"PDF"},{"name":"JSON Formatter","category":"Developer"}]', 'base64-encode': language === 'th' ? 'สวัสดี ToolsDice' : 'Hello ToolsDice', 'base64-decode': language === 'th' ? '4Liq4Lin4Lix4Liq4LiU4Li1IFRvb2xzRGljZQ==' : 'SGVsbG8gVG9vbHNEaWNl', 'url-encode': language === 'th' ? 'ค้นหา PDF & รูปภาพ' : 'Search PDF & images', 'url-decode': language === 'th' ? '%E0%B8%84%E0%B9%89%E0%B8%99%E0%B8%AB%E0%B8%B2%20PDF%20%26%20%E0%B8%A3%E0%B8%B9%E0%B8%9B%E0%B8%A0%E0%B8%B2%E0%B8%9E' : 'Search%20PDF%20%26%20images' }
  const [input, setInput] = useState(() => defaults[kind] ?? '')
  const [mode, setMode] = useState<'csv-to-json' | 'json-to-csv'>('csv-to-json')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const convert = async () => {
    setWorking(true); setError('')
    try {
      let result = ''
      if (kind === 'csv-json' && mode === 'csv-to-json') result = JSON.stringify(csvToObjects(input), null, 2)
      else if (kind === 'csv-json' && mode === 'json-to-csv') {
        const parsed = JSON.parse(input) as unknown
        if (!Array.isArray(parsed) || !parsed.every((row) => row && typeof row === 'object' && !Array.isArray(row))) throw new Error('JSON ต้องเป็น array of objects เช่น [{"name":"Ada"}]')
        result = objectsToCsv(parsed as Record<string, unknown>[])
      }
      else if (kind === 'json-to-yaml') { const { stringify } = await import('yaml'); result = stringify(JSON.parse(input) as unknown) }
      else if (kind === 'yaml-to-json') { const { parse } = await import('yaml'); result = JSON.stringify(parse(input) as unknown, null, 2) }
      else if (kind === 'csv-to-json') result = JSON.stringify(csvToObjects(input), null, 2)
      else if (kind === 'json-to-csv') { const parsed = JSON.parse(input) as unknown; if (!Array.isArray(parsed)) throw new Error('JSON ต้องเป็น array'); result = objectsToCsv(parsed as Record<string, unknown>[]) }
      else if (kind === 'base64-encode') result = bytesToBase64(new TextEncoder().encode(input))
      else if (kind === 'base64-decode') result = new TextDecoder().decode(base64ToBytes(input.trim()))
      else if (kind === 'url-encode') result = encodeURIComponent(input)
      else if (kind === 'url-decode') result = decodeURIComponent(input)
      setOutput(result)
    } catch (reason) { setOutput(''); setError(messageOf(reason, 'ไม่สามารถแปลงข้อมูลได้')) } finally { setWorking(false) }
  }
  return <Surface>{kind === 'csv-json' && <div className="field-grid"><Field label={uiText("ทิศทาง")}><select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}><option value="csv-to-json">CSV → JSON</option><option value="json-to-csv">JSON → CSV</option></select></Field></div>}<Editor label={uiText("ข้อมูลต้นฉบับ")} value={input} onChange={setInput} /><button className="primary-button full" type="button" disabled={working} onClick={convert}>{working ? <LoaderCircle className="spin" size={18} /> : <RefreshCw size={18} />} {uiText("แปลงข้อมูล")}</button>{error && <div className="inline-status error" role="alert"><p>{error}</p></div>}{output && <Editor label={uiText("ผลลัพธ์")} value={output} readOnly action={<CopyButton value={output} />} />}</Surface>
}

function ColorConverter() {
  const [hex, setHex] = useState('#4f8cff')
  const rgb = hexToRgb(normalizeHex(hex))
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  return <Surface><div className="color-workbench"><input type="color" value={normalizeHex(hex)} onChange={(event) => setHex(event.target.value)} /><Field label="HEX"><input value={hex} onChange={(event) => setHex(event.target.value)} /></Field></div><div className="metric-results"><OutputMetric label="HEX" value={normalizeHex(hex).toUpperCase()} /><OutputMetric label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} /><OutputMetric label="HSL" value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} /></div></Surface>
}

function NumberBaseConverter() {
  const [base, setBase] = useState(10)
  const [value, setValue] = useState('255')
  let parsed: bigint | null = null
  try { parsed = parseBigIntBase(value, base) } catch { parsed = null }
  return <Surface><div className="field-grid two"><Field label={uiText("ฐานข้อมูลเข้า")}><select value={base} onChange={(event) => setBase(Number(event.target.value))}><option value="2">Binary (2)</option><option value="8">Octal (8)</option><option value="10">Decimal (10)</option><option value="16">Hexadecimal (16)</option></select></Field><Field label={uiText("ค่า")}><input className="code-input" value={value} onChange={(event) => setValue(event.target.value)} /></Field></div>{parsed === null ? <div className="inline-status error"><p>{uiText("ค่าที่กรอกไม่ถูกต้องสำหรับฐาน ")}{base}</p></div> : <section className="base-results output-panel" aria-live="polite" aria-label={uiText("ค่าที่แปลงแล้ว")}>{[[2, 'Binary'], [8, 'Octal'], [10, 'Decimal'], [16, 'Hexadecimal']].map(([target, label]) => <div className="base-result-row" key={target}><span>{label}</span><code>{parsed!.toString(Number(target)).toUpperCase()}</code><CopyButton value={parsed!.toString(Number(target)).toUpperCase()} /></div>)}</section>}</Surface>
}

function GeneratorUtility({ kind }: { kind: string }) {
  if (kind === 'password-generator') return <PasswordGenerator />
  if (kind === 'hash-generator') return <HashGenerator />
  if (kind === 'lorem-generator') return <LoremGenerator />
  if (kind === 'random-number-generator') return <RandomNumberGenerator />
  return <RandomTextGenerator kind={kind} />
}

function RandomTextGenerator({ kind }: { kind: string }) {
  const [count, setCount] = useState(kind === 'uuid-generator' ? 5 : 1)
  const [length, setLength] = useState(24)
  const [output, setOutput] = useState('')
  const generate = () => {
    if (kind === 'uuid-generator') setOutput(Array.from({ length: clamp(count, 1, 100) }, () => crypto.randomUUID()).join('\n'))
    else setOutput(Array.from({ length: clamp(count, 1, 100) }, () => secureString(clamp(length, 4, 512), 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789')).join('\n'))
  }
  return <Surface><div className="field-grid two">{kind !== 'uuid-generator' && <Field label={uiText("ความยาว")}><input type="number" min="4" max="512" value={length} onChange={(event) => setLength(Number(event.target.value))} /></Field>}<Field label={uiText("จำนวนรายการ")}><input type="number" min="1" max="100" value={count} onChange={(event) => setCount(Number(event.target.value))} /></Field></div><button className="primary-button full" type="button" onClick={generate}><Sparkles size={18} /> {uiText("สร้างใหม่")}</button>{output && <Editor label={uiText("ผลลัพธ์")} value={output} readOnly action={<CopyButton value={output} />} />}</Surface>
}

function PasswordGenerator() {
  const [length, setLength] = useState(20)
  const [options, setOptions] = useState({ upper: true, lower: true, numbers: true, symbols: true, ambiguous: false })
  const [password, setPassword] = useState('')
  const generate = () => {
    let chars = `${options.upper ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : ''}${options.lower ? 'abcdefghijkmnopqrstuvwxyz' : ''}${options.numbers ? '23456789' : ''}${options.symbols ? '!@#$%^&*_-+=' : ''}`
    if (options.ambiguous) chars += 'Il1O0o'
    setPassword(chars ? secureString(clamp(length, 6, 128), chars) : '')
  }
  const strength = Math.min(100, Math.round((length / 24) * 55 + Object.values(options).filter(Boolean).length * 12))
  return <Surface><Field label={`ความยาว ${length} ตัว`}><input type="range" min="6" max="64" value={length} onChange={(event) => setLength(Number(event.target.value))} /></Field><div className="check-options">{([['upper', 'A-Z'], ['lower', 'a-z'], ['numbers', '0-9'], ['symbols', 'สัญลักษณ์'], ['ambiguous', 'รวมอักขระคล้ายกัน']] as const).map(([key, label]) => <Toggle checked={options[key]} onChange={(checked) => setOptions({ ...options, [key]: checked })} label={label} key={key} />)}</div><button className="primary-button full" type="button" onClick={generate}><Sparkles size={18} /> {uiText("สร้างรหัสผ่าน")}</button>{password && <><Output value={password} copy /><div className="strength"><div><span style={{ width: `${strength}%` }} /></div><p>{strength >= 80 ? 'แข็งแรงมาก' : strength >= 60 ? 'แข็งแรง' : strength >= 40 ? 'ปานกลาง' : 'ควรเพิ่มความยาวหรือตัวเลือก'}</p></div></>}</Surface>
}

function HashGenerator() {
  const [value, setValue] = useState('ToolsDice')
  const [algorithm, setAlgorithm] = useState<'SHA-256' | 'SHA-512'>('SHA-256')
  const [file, setFile] = useState<File | null>(null)
  const [hash, setHash] = useState('')
  const [loading, setLoading] = useState(false)
  const generate = async () => { setLoading(true); try { const bytes = file ? await file.arrayBuffer() : new TextEncoder().encode(value); const digest = await crypto.subtle.digest(algorithm, bytes); setHash([...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')) } finally { setLoading(false) } }
  return <Surface><Segmented value={algorithm} onChange={setAlgorithm} options={[['SHA-256', 'SHA-256'], ['SHA-512', 'SHA-512']]} /><Editor label={uiText("ข้อความ")} value={value} onChange={(next) => { setValue(next); setFile(null) }} /><label className="mini-upload"><UploadCloud size={17} /><span>{file ? file.name : 'หรือเลือกไฟล์'}</span><input className="sr-only" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><button className="primary-button full" type="button" disabled={loading} onClick={() => void generate()}>{loading ? <LoaderCircle className="spin" size={18} /> : <Hash size={18} />} {uiText("สร้าง Hash")}</button>{hash && <Output value={hash} copy />}</Surface>
}

function LoremGenerator() {
  const [mode, setMode] = useState<'paragraphs' | 'words'>('paragraphs')
  const [count, setCount] = useState(3)
  const output = makeLorem(mode, clamp(count, 1, mode === 'paragraphs' ? 20 : 500))
  return <Surface><Segmented value={mode} onChange={setMode} options={[['paragraphs', 'ย่อหน้า'], ['words', 'คำ']]} /><Field label={`จำนวน${mode === 'paragraphs' ? 'ย่อหน้า' : 'คำ'}`}><input type="number" min="1" max={mode === 'paragraphs' ? 20 : 500} value={count} onChange={(event) => setCount(Number(event.target.value))} /></Field><Editor label="Lorem Ipsum" value={output} readOnly action={<CopyButton value={output} />} /></Surface>
}

function RandomNumberGenerator() {
  const [min, setMin] = useState(1); const [max, setMax] = useState(100); const [count, setCount] = useState(5); const [unique, setUnique] = useState(true); const [output, setOutput] = useState('')
  const generate = () => { try { setOutput(randomIntegers(Math.ceil(min), Math.floor(max), clamp(count, 1, 500), unique).join(', ')) } catch (reason) { setOutput(messageOf(reason, 'สุ่มตัวเลขไม่สำเร็จ')) } }
  return <Surface><div className="field-grid three"><Field label={uiText("ต่ำสุด")}><input type="number" value={min} onChange={(event) => setMin(Number(event.target.value))} /></Field><Field label={uiText("สูงสุด")}><input type="number" value={max} onChange={(event) => setMax(Number(event.target.value))} /></Field><Field label={uiText("จำนวน")}><input type="number" min="1" max="500" value={count} onChange={(event) => setCount(Number(event.target.value))} /></Field></div><Toggle checked={unique} onChange={setUnique} label={uiText("ไม่ให้ตัวเลขซ้ำ")} /><button className="primary-button full" type="button" onClick={generate}><Sparkles size={18} /> {uiText("สุ่มตัวเลข")}</button>{output && <Output value={output} copy />}</Surface>
}

type TextStats = ReturnType<typeof textStats>
function Metrics({ stats }: { stats: TextStats }) { const { language } = useLanguage(); return <div className="stat-grid"><OutputMetric label={uiText("ตัวอักษร")} value={String(stats.characters)} /><OutputMetric label={uiText("ไม่รวมช่องว่าง")} value={String(stats.noSpaces)} /><OutputMetric label={uiText("คำ")} value={String(stats.words)} /><OutputMetric label={uiText("บรรทัด")} value={String(stats.lines)} /><OutputMetric label={uiText("ย่อหน้า")} value={String(stats.paragraphs)} /><OutputMetric label={uiText("เวลาอ่าน")} value={`${stats.readingMinutes} ${language === 'en' ? 'min' : 'นาที'}`} /></div> }
function Surface({ children }: { children: React.ReactNode }) { return <div className="tool-surface extended-surface">{children}</div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{uiText(label)}</span>{children}</label> }
function Editor({ label, value, onChange, readOnly, action }: { label: string; value: string; onChange?: (value: string) => void; readOnly?: boolean; action?: React.ReactNode }) {
  const id = useId()
  return <div className={readOnly ? "editor output-editor" : "editor"}>
    <div className="editor-heading"><label htmlFor={id}>{uiText(label)}</label>{action && <div className="editor-actions">{action}</div>}</div>
    <textarea id={id} aria-label={uiText(label)} value={value} readOnly={readOnly} onChange={(event) => onChange?.(event.target.value)} />
  </div>
}
function Output({ value, copy }: { value: string; copy?: boolean }) { return <div className="result-box output-panel"><span>{uiText("ผลลัพธ์")}{copy && <CopyButton value={value} />}</span><p className="break-all">{value}</p></div> }
function OutputMetric({ label, value }: { label: string; value: string }) { return <div><span>{uiText(label)}</span><strong>{value}</strong></div> }
function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (value: T) => void; options: Array<[T, string]> }) { return <div className="segmented wide">{options.map(([id, label]) => <button className={value === id ? 'active' : ''} type="button" onClick={() => onChange(id)} key={id}>{uiText(label)}</button>)}</div> }
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) { return <label className="toggle-line"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span><Check size={13} /></span>{uiText(label)}</label> }

function CopyButton({ value }: { value: string }) { const [copied, setCopied] = useState(false); return <button className="copy-button" type="button" onClick={(event) => { event.preventDefault(); void navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1500) }}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? uiText('คัดลอกแล้ว') : uiText('คัดลอก')}</button> }
function DownloadText({ value, filename }: { value: string; filename: string }) { return <button className="secondary-button" type="button" onClick={() => downloadBlob(new Blob([value], { type: 'text/plain;charset=utf-8' }), filename)}><Download size={16} /> {uiText("ดาวน์โหลด")}</button> }

function textStats(value: string) { const words = value.trim() ? value.trim().split(/\s+/u).length : 0; return { characters: [...value].length, noSpaces: [...value.replace(/\s/g, '')].length, words, lines: value ? value.split(/\r?\n/).length : 0, paragraphs: value.trim() ? value.trim().split(/\n\s*\n/).length : 0, readingMinutes: Math.max(0, Math.ceil(words / 220)) } }
function countOccurrences(value: string, needle: string, sensitive: boolean) { if (!needle) return 0; const source = sensitive ? value : value.toLowerCase(); const find = sensitive ? needle : needle.toLowerCase(); let count = 0; let cursor = 0; while ((cursor = source.indexOf(find, cursor)) >= 0) { count += 1; cursor += Math.max(1, find.length) } return count }
function validateJson(value: string) { try { const parsed = JSON.parse(value) as unknown; return { ok: true as const, output: JSON.stringify(parsed, null, 2), message: 'JSON ถูกต้อง' } } catch (reason) { const message = messageOf(reason, 'JSON ไม่ถูกต้อง'); const position = /position (\d+)/.exec(message)?.[1]; const index = position ? Number(position) : -1; const prefix = index >= 0 ? value.slice(0, index) : ''; const line = prefix.split('\n').length; const column = prefix.length - prefix.lastIndexOf('\n'); return { ok: false as const, output: '', message: `${message}${index >= 0 ? ` · บรรทัด ${line}, คอลัมน์ ${column}` : ''}` } } }
function decodeBase64Url(value: string) { const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='); return new TextDecoder().decode(base64ToBytes(base64)) }
function explainCron(value: string) {
  const parts = value.trim().split(/\s+/)
  if (parts.length !== 5) return { valid: false, description: 'Cron ต้องมี 5 ช่อง: นาที ชั่วโมง วันที่ เดือน วันในสัปดาห์' }
  if (!parts.every((part) => /^[\d*/?,-]+$/.test(part))) return { valid: false, description: 'พบอักขระที่ไม่รองรับใน cron expression' }
  const [minute, hour, day, month, weekday] = parts
  const time = hour.padStart(2, '0') + ':' + minute.padStart(2, '0')
  let description = 'เวลา ' + time + ' ทุกวัน'
  if (minute.startsWith('*/')) description = 'ทุก ' + minute.slice(2) + ' นาที'
  else if (weekday === '1-5') description = 'ทุกวันจันทร์ถึงศุกร์ เวลา ' + time
  else if (day !== '*') description = 'วันที่ ' + day + ' ของเดือน เวลา ' + time
  else if (month !== '*') description = 'ในเดือน ' + month + ' เวลา ' + time
  else if (weekday !== '*') description = 'ในวันลำดับ ' + weekday + ' เวลา ' + time
  return { valid: true, description }
}
function transformCode(kind: string, value: string) { if (kind === 'sql-formatter') return formatSql(value); if (kind === 'html-beautifier') return beautifyHtml(value); if (kind === 'css-beautifier') return beautifyCss(value); if (kind === 'javascript-beautifier') return beautifyJs(value); if (kind === 'html-minifier') return value.replace(/<!--[^]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim(); if (kind === 'css-minifier') return value.replace(/\/\*[^]*?\*\//g, '').replace(/\s*([{}:;,])\s*/g, '$1').replace(/;}/g, '}').trim(); return value.replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+/g, ' ').replace(/\s*([{}();,:+*=<>])\s*/g, '$1').trim() }
function formatSql(value: string) { const keywords = ['SELECT', 'FROM', 'WHERE', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'AND', 'OR']; let output = value.replace(/\s+/g, ' ').trim(); for (const keyword of keywords) output = output.replace(new RegExp(`\\b${keyword.replace(' ', '\\s+')}\\b`, 'gi'), (match) => `${['AND', 'OR'].includes(keyword) ? '\n  ' : '\n'}${match.toUpperCase()} `); return output.trim().replace(/,\s*/g, ',\n  ') }
function beautifyHtml(value: string) { const tokens = value.replace(/>\s*</g, '><').split(/(?=<)|(?<=>)/).filter((token) => token.trim()); let depth = 0; return tokens.map((token) => { const clean = token.trim(); if (/^<\//.test(clean)) depth = Math.max(0, depth - 1); const line = `${'  '.repeat(depth)}${clean}`; if (/^<[^!/][^>]*[^/]>/i.test(clean) && !/^<(meta|link|img|input|br|hr)\b/i.test(clean) && !clean.includes('</')) depth += 1; return line }).join('\n') }
function beautifyCss(value: string) { return value.replace(/\s*{\s*/g, ' {\n  ').replace(/;\s*/g, ';\n  ').replace(/\s*}\s*/g, '\n}\n').replace(/\n\s*\n/g, '\n').trim() }
function beautifyJs(value: string) { let depth = 0; return value.replace(/\s*{\s*/g, ' {\n').replace(/;\s*/g, ';\n').replace(/\s*}\s*/g, '\n}\n').split('\n').map((line) => { const clean = line.trim(); if (clean.startsWith('}')) depth = Math.max(0, depth - 1); const output = `${'  '.repeat(depth)}${clean}`; if (clean.endsWith('{')) depth += 1; return output }).filter(Boolean).join('\n') }
function csvToObjects(value: string) { const rows = parseCsv(value); const headers = rows[0] ?? []; return rows.slice(1).filter((row) => row.some((cell) => cell !== '')).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))) }
function bytesToBase64(bytes: Uint8Array) { let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary) }
function base64ToBytes(value: string) { const binary = atob(value.replace(/\s+/g, '')); return Uint8Array.from(binary, (char) => char.charCodeAt(0)) }
function normalizeHex(value: string) { const clean = value.trim().replace('#', ''); if (/^[\da-f]{3}$/i.test(clean)) return `#${clean.split('').map((char) => char + char).join('')}`; return /^[\da-f]{6}$/i.test(clean) ? `#${clean}` : '#000000' }
function hexToRgb(hex: string) { const value = Number.parseInt(hex.slice(1), 16); return { r: value >> 16, g: value >> 8 & 255, b: value & 255 } }
function rgbToHsl(r: number, g: number, b: number) { const rr = r / 255, gg = g / 255, bb = b / 255; const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb); let h = 0; const l = (max + min) / 2; const d = max - min; const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)); if (d) h = max === rr ? 60 * (((gg - bb) / d) % 6) : max === gg ? 60 * ((bb - rr) / d + 2) : 60 * ((rr - gg) / d + 4); return { h: Math.round((h + 360) % 360), s: Math.round(s * 100), l: Math.round(l * 100) } }
function parseBigIntBase(value: string, base: number) { const clean = value.trim().toLowerCase(); if (!clean) throw new Error(); const digits = '0123456789abcdefghijklmnopqrstuvwxyz'; let result = 0n; for (const char of clean) { const digit = digits.indexOf(char); if (digit < 0 || digit >= base) throw new Error(); result = result * BigInt(base) + BigInt(digit) } return result }
function secureString(length: number, chars: string) { const output: string[] = []; const max = Math.floor(256 / chars.length) * chars.length; while (output.length < length) { const bytes = crypto.getRandomValues(new Uint8Array(Math.max(16, length - output.length))); for (const byte of bytes) { if (byte < max) output.push(chars[byte % chars.length]); if (output.length === length) break } } return output.join('') }
function makeLorem(mode: 'paragraphs' | 'words', count: number) { const sentence = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'; const words = sentence.split(' '); if (mode === 'words') return Array.from({ length: count }, (_, index) => words[index % words.length]).join(' ') + '.'; return Array.from({ length: count }, (_, paragraph) => Array.from({ length: 3 }, (_, sentenceIndex) => `${sentenceIndex === 0 ? sentence : sentence.toLowerCase()} ${words[(paragraph + sentenceIndex) % words.length]} consequat.`).join(' ')).join('\n\n') }
function randomIntegers(min: number, max: number, count: number, unique: boolean) { if (max < min) throw new Error('ค่าสูงสุดต้องมากกว่าหรือเท่ากับค่าต่ำสุด'); if (unique && count > max - min + 1) throw new Error('ช่วงตัวเลขมีไม่พอสำหรับค่าที่ไม่ซ้ำ'); const output: number[] = []; while (output.length < count) { const value = min + Math.floor(secureRandom() * (max - min + 1)); if (!unique || !output.includes(value)) output.push(value) } return output }
function secureRandom() { return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 }
function shuffleLines(value: string) { const lines = value.split(/\r?\n/); for (let index = lines.length - 1; index > 0; index -= 1) { const target = Math.floor(secureRandom() * (index + 1)); [lines[index], lines[target]] = [lines[target], lines[index]] } return lines.join('\n') }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min)) }
function messageOf(reason: unknown, fallback: string) { return reason instanceof Error && reason.message ? reason.message : fallback }
function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
