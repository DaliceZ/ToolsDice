export function parseCsv(value: string) {
  const source = value.replace(/^\uFEFF/u, "");
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let afterQuote = false
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') { cell += '"'; index += 1 }
      else if (char === '"') { quoted = false; afterQuote = true }
      else cell += char
      continue
    }
    if (afterQuote && char !== ',' && char !== '\n' && char !== '\r')
      throw new Error('CSV มีข้อมูลต่อท้ายเครื่องหมายคำพูดที่ปิดแล้ว')
    if (char === '"') {
      if (cell === '') quoted = true
      else throw new Error('CSV มีเครื่องหมายคำพูดอยู่กลางช่องข้อมูล')
    } else if (char === ',' && !quoted) { row.push(cell); cell = ''; afterQuote = false }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[index + 1] === '\n') index += 1
      row.push(cell); rows.push(row); row = []; cell = ''; afterQuote = false
    } else cell += char
  }
  if (quoted) throw new Error('CSV มีเครื่องหมายคำพูดที่ยังไม่ปิด')
  row.push(cell)
  if (row.some((item) => item !== '') || rows.length === 0) rows.push(row)
  return rows
}

export function objectsToCsv(rows: Record<string, unknown>[]) {
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  return [headers, ...rows.map((row) => headers.map((header) => String(row[header] ?? '')))]
    .map((row) => row.map(csvCell).join(','))
    .join('\n')
}

export function validateTabularFile(file: Pick<File, 'name' | 'size' | 'type'>, maxBytes: number) {
  const extension = file.name.split('.').pop()?.toLocaleLowerCase('en') ?? ''
  const allowed = ['csv', 'tsv', 'txt', 'json'].includes(extension)
  const knownMime = ['text/csv', 'text/tab-separated-values', 'text/plain', 'application/json', 'application/vnd.ms-excel']
  if (file.size <= 0) throw new Error('ไฟล์นี้ว่างเปล่า กรุณาเลือกไฟล์อื่น')
  if (file.size > maxBytes) throw new Error(`ไฟล์มีขนาดเกิน ${Math.max(1, Math.floor(maxBytes / 1024 / 1024))} MB`)
  if (!allowed || (file.type && !knownMime.includes(file.type))) throw new Error('รองรับเฉพาะไฟล์ CSV, TSV, TXT หรือ JSON')
}

function csvCell(value: string) { return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value }
