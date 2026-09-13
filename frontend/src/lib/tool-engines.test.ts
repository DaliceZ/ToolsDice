import { describe, expect, it } from 'vitest'
import {
  base64Decode,
  base64Encode,
  buildApiFormBody,
  buildApiRequestUrl,
  calculateCompoundSavings,
  calculateDateDifference,
  calculateLoanRepayment,
  calculateTripFuelCost,
  cleanTextAndHtml,
  countCharacters,
  formatInTimeZone,
  parseMarkdown,
  parsePageSelection,
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
  transformCode,
  transformText,
  validateLocalFile,
  wallTimeToInstant,
} from './tool-engines'

describe('tool engines', () => {
  it('builds API URLs and form bodies from enabled user-entered fields', () => {
    const fields = [
      { enabled: true, key: 'tag', value: 'one two' },
      { enabled: false, key: 'hidden', value: 'ignore' },
      { enabled: true, key: 'tag', value: 'second' },
    ];
    const url = new URL(buildApiRequestUrl('https://api.example.test/items?keep=yes', fields));
    expect(url.searchParams.getAll('tag')).toEqual(['one two', 'second']);
    expect(url.searchParams.get('keep')).toBe('yes');
    expect(url.searchParams.has('hidden')).toBe(false);
    expect(buildApiFormBody(fields)).toBe('tag=one+two&tag=second');
    expect(() => buildApiRequestUrl('/relative/path', [])).toThrow('URL แบบเต็ม');
    expect(() => buildApiRequestUrl('file:///tmp/data', [])).toThrow('http หรือ https');
  });

  it('estimates everyday loan, savings, and trip costs with zero-rate and precision cases', () => {
    expect(calculateLoanRepayment(100_000, 0, 3)).toEqual({
      monthlyPayment: 33_333.33,
      totalPayment: 100_000,
      totalInterest: 0,
    });
    expect(calculateLoanRepayment(120_000, 12, 12).monthlyPayment).toBe(10_661.85);
    expect(calculateCompoundSavings(1_000, 100, 0, 1)).toEqual({
      endingBalance: 2_200,
      contributed: 2_200,
      interestEarned: 0,
    });
    expect(calculateCompoundSavings(10_000, 1_000, 6, 1).endingBalance).toBe(22_952.34);
    expect(calculateTripFuelCost(250, 12.5, 40, 2)).toEqual({
      litersUsed: 20,
      totalCost: 800,
      costPerTraveler: 400,
    });
    expect(() => calculateLoanRepayment(10_000, 101, 12)).toThrow('0 ถึง 100');
    expect(() => calculateCompoundSavings(0, 0, 5, 1)).toThrow('อย่างน้อยหนึ่งค่า');
    expect(() => calculateTripFuelCost(100, 0, 35, 2)).toThrow('อัตราสิ้นเปลือง');
  });

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

  it('formats and minifies supported code samples and rejects malformed JSON safely', () => {
    expect(transformCode('{"hello":"world"}', 'json', 'format')).toBe(`{\n  "hello": "world"\n}`);
    expect(transformCode('{ "hello" : "world" }', 'json', 'minify')).toBe('{"hello":"world"}');
    expect(transformCode('select id,name from users where active=true;', 'sql', 'format')).toMatch(/^SELECT id,\n {2}name\nFROM users\nWHERE active=true;/u);
    expect(transformCode("select 'from, name' as label from users;", 'sql', 'format')).toContain("'from, name'");
    expect(transformCode('.card { color: red; }', 'css', 'minify')).toBe('.card{color:red}');
    expect(transformCode('const value="a{ b; }";', 'javascript', 'format')).toContain('"a{ b; }"');
    expect(transformCode('<main> <h1>Hello</h1> </main>', 'html', 'minify')).toBe('<main><h1>Hello</h1></main>');
    expect(() => transformCode('{broken}', 'json', 'format')).toThrow('JSON ไม่ถูกต้อง');
    expect(transformCode('select id, name from users where active = true;', 'sql', 'minify')).toBe('select id,name from users where active = true;');
  });

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
