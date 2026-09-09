import { describe, expect, it } from 'vitest'
import { base64Decode, base64Encode, formatJson, parsePageSelection, parseTimestamp, textStatistics, transformText } from './tool-engines'

describe('tool engines', () => {
  it('transforms and counts Unicode text', () => {
    expect(transformText('  สวัสดี   โลก  ', 'collapse')).toBe('สวัสดี โลก')
    expect(textStatistics('สวัสดี โลก').words).toBe(2)
  })

  it('round trips Unicode Base64', () => {
    expect(base64Decode(base64Encode('สวัสดี 👋'))).toBe('สวัสดี 👋')
  })

  it('formats JSON and rejects malformed JSON', () => {
    expect(formatJson('{"ok":true}')).toContain('\n')
    expect(() => formatJson('{nope}')).toThrow()
  })

  it('detects second and millisecond timestamps', () => {
    expect(parseTimestamp('1700000000').getTime()).toBe(1_700_000_000_000)
    expect(parseTimestamp('1700000000000').getTime()).toBe(1_700_000_000_000)
  })

  it('parses PDF page ranges', () => {
    expect(parsePageSelection('1-3,5', 5)).toEqual([0, 1, 2, 4])
    expect(() => parsePageSelection('6', 5)).toThrow()
  })
})
