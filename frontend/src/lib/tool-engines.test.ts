import { describe, expect, it } from 'vitest'
import {
  base64Decode,
  base64Encode,
  buildQuery,
  calculateDateDifference,
  cleanTextAndHtml,
  countCharacters,
  convertStructured,
  decodeUrlComponent,
  formatJson,
  formatInTimeZone,
  parseMarkdown,
  parsePageSelection,
  parseUrlComponents,
  parseTimestamp,
  readThaiNumber,
  removeDuplicateLines,
  removeEmptyLines,
  replaceText,
  reverseText,
  sortLines,
  switchKeyboardLanguage,
  textStatistics,
  textToSlug,
  thaiMoneyToWords,
  transformText,
  validateLocalFile,
  wallTimeToInstant,
} from './tool-engines'

describe('tool engines', () => {
  it('transforms and counts Unicode text', () => {
    expect(transformText('  สวัสดี   โลก  ', 'collapse')).toBe('สวัสดี โลก')
    expect(transformText('  one   two  \n  three  ', 'collapse')).toBe('one two\nthree')
    expect(textStatistics('สวัสดี โลก').words).toBe(2)
    expect(textStatistics('หนึ่ง\n\nสอง').paragraphs).toBe(2)
    expect(countCharacters('👨‍👩‍👧‍👦')).toBe(1)
  })

  it('provides line and replacement helpers', () => {
    expect(removeDuplicateLines('a\na\nb')).toBe('a\nb')
    expect(removeEmptyLines('a\n \n\nb')).toBe('a\nb')
    expect(sortLines('10\n2\n1', 'numeric')).toBe('1\n2\n10')
    expect(replaceText('Hello hello', 'hello', 'สวัสดี', false)).toEqual({
      output: 'สวัสดี สวัสดี',
      count: 2,
    })
    expect(reverseText('สวัสดี 👋', 'characters')).toBe('👋 ดีสวัส')
  })

  it('handles slugs, keyboard correction, Thai money, and cleaning', () => {
    expect(textToSlug(' Hello, World! ')).toBe('hello-world')
    expect(switchKeyboardLanguage('l;ylfu')).toBe('สวัสดี')
    expect(switchKeyboardLanguage('สวัสดี')).toBe('l;ylfu')
    expect(readThaiNumber('1000001')).toBe('หนึ่งล้านหนึ่ง')
    expect(thaiMoneyToWords('1,250.50')).toBe('หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์')
    expect(() => thaiMoneyToWords('1,250.501')).toThrow('ไม่เกิน 2 หลัก')
    expect(() => thaiMoneyToWords('12,50.25')).toThrow()
    expect(cleanTextAndHtml('<b>Hello</b> 👋!!!')).toBe('Hello!!!')
  })

  it('parses Markdown into safe blocks without evaluating HTML', () => {
    const blocks = parseMarkdown('# Title\n\n<script>alert(1)</script>\n\n- one\n- two')
    expect(blocks[0]).toEqual({ type: 'heading', level: 1, text: 'Title' })
    expect(blocks.some((block) => block.type === 'list')).toBe(true)
    expect(blocks.some((block) => block.type === 'paragraph' && block.text.includes('<script>'))).toBe(true)
  })

  it('round trips Unicode Base64', () => {
    expect(base64Decode(base64Encode('สวัสดี 👋'))).toBe('สวัสดี 👋')
  })

  it('formats JSON and rejects malformed JSON', () => {
    expect(formatJson('{"ok":true}')).toContain('\n')
    expect(formatJson('{"b":1,"a":{"z":2,"c":3}}', false, { sortKeys: true, indent: 4 })).toContain('"a": {\n        "c"')
    expect(() => formatJson('{nope}')).toThrow('JSON ไม่ถูกต้อง')
  })

  it('gives local, actionable JSON, YAML, and URL errors', async () => {
    await expect(convertStructured('{broken', 'json-to-yaml')).rejects.toThrow('JSON ไม่ถูกต้อง')
    await expect(convertStructured('items: [one', 'yaml-to-json')).rejects.toThrow('YAML ไม่ถูกต้อง')
    expect(() => buildQuery('{broken')).toThrow('JSON สำหรับ Query ไม่ถูกต้อง')
    expect(() => parseUrlComponents('not a URL')).toThrow('URL ไม่ถูกต้อง')
    expect(() => decodeUrlComponent('%E0%A4%A')).toThrow('URL encoding ไม่ถูกต้อง')
    expect(parseUrlComponents('https://example.test/a?q=1&q=2#top').searchParams).toEqual([
      { key: 'q', value: '1' }, { key: 'q', value: '2' },
    ])
  })

  it('detects second and millisecond timestamps', () => {
    expect(parseTimestamp('1700000000').getTime()).toBe(1_700_000_000_000)
    expect(parseTimestamp('1700000000000').getTime()).toBe(1_700_000_000_000)
  })

  it('parses PDF page ranges', () => {
    expect(parsePageSelection('1-3,5', 5)).toEqual([0, 1, 2, 4])
    expect(() => parsePageSelection('6', 5)).toThrow()
    expect(() => parsePageSelection('0,2', 5)).toThrow()
    expect(() => parsePageSelection('2-', 5)).toThrow()
  })

  it('converts wall-clock times across zones and handles impossible dates and DST gaps', () => {
    expect(wallTimeToInstant('2025-01-01T12:00', 'Asia/Bangkok').toISOString()).toBe('2025-01-01T05:00:00.000Z')
    expect(() => wallTimeToInstant('2025-02-30T12:00', 'Asia/Bangkok')).toThrow('ไม่มีอยู่จริง')
    expect(() => wallTimeToInstant('2024-03-10T02:30', 'America/New_York')).toThrow('ไม่มีอยู่ในเขตเวลา')
    expect(() => formatInTimeZone(new Date(), 'Mars/Nope')).toThrow('ไม่รู้จักเขตเวลา')
  })

  it('counts elapsed days and weekdays without counting the start date', () => {
    expect(calculateDateDifference('2026-09-11', '2026-09-14')).toEqual({ days: 3, weeks: 0, remainder: 3, workdays: 1 })
    expect(calculateDateDifference('2026-09-14', '2026-09-11')).toEqual({ days: 3, weeks: 0, remainder: 3, workdays: 1 })
    expect(() => calculateDateDifference('2026-02-30', '2026-03-01')).toThrow('ไม่มีอยู่จริง')
  })

  it('accepts supported local files and rejects unsafe type or size', () => {
    expect(() => validateLocalFile({ name: 'portrait.png', size: 100, type: 'image/png' }, 'image', 100)).not.toThrow()
    expect(() => validateLocalFile({ name: 'large.png', size: 101, type: 'image/png' }, 'image', 100)).toThrow('เกิน')
    expect(() => validateLocalFile({ name: 'portrait.svg', size: 10, type: 'image/svg+xml' }, 'image', 100)).toThrow('รองรับเฉพาะ')
    expect(() => validateLocalFile({ name: 'locked.pdf', size: 101, type: 'application/pdf' }, 'pdf', 100)).toThrow('เกิน')
    expect(() => validateLocalFile({ name: 'wrong.pdf', size: 10, type: 'text/plain' }, 'pdf', 100)).toThrow('รองรับเฉพาะ')
  })
})
