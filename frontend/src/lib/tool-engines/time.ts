export function parseTimestamp(input: string): Date {
  const trimmed = input.trim();
  const numeric = Number(trimmed);
  const date =
    trimmed && Number.isFinite(numeric)
      ? new Date(Math.abs(numeric) < 100_000_000_000 ? numeric * 1000 : numeric)
      : new Date(trimmed);
  if (!trimmed || Number.isNaN(date.getTime()))
    throw new Error("รูปแบบวันเวลาหรือ timestamp ไม่ถูกต้อง");
  return date;
}

export function formatInTimeZone(date: Date, timeZone: string, locale = "th-TH"): string {
  if (!Number.isFinite(date.getTime())) throw new Error("วันเวลาที่ระบุไม่ถูกต้อง");
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "full",
      timeStyle: "long",
      timeZone,
    }).format(date);
  } catch {
    throw new Error("ไม่รู้จักเขตเวลานี้ กรุณาเลือกเขตเวลา IANA เช่น Asia/Bangkok");
  }
}

export function wallTimeToInstant(localDateTime: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/u.exec(localDateTime);
  if (!match) throw new Error("กรุณาระบุวันและเวลาให้ครบ");
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  const expected = new Date(target);
  if (
    expected.getUTCFullYear() !== year || expected.getUTCMonth() !== month - 1 ||
    expected.getUTCDate() !== day || hour > 23 || minute > 59
  ) throw new Error("วันหรือเวลาที่ระบุไม่มีอยู่จริง");

  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    });
  } catch {
    throw new Error("ไม่รู้จักเขตเวลานี้ กรุณาเลือกเขตเวลา IANA เช่น Asia/Bangkok");
  }
  let instant = target;
  for (let pass = 0; pass < 3; pass += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map((part) => [part.type, part.value]));
    const represented = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour), Number(parts.minute), Number(parts.second),
    );
    instant = target - (represented - instant);
  }
  const result = new Date(instant);
  const displayed = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(result);
  const values = Object.fromEntries(displayed.map((part) => [part.type, part.value]));
  if (
    Number(values.year) !== year || Number(values.month) !== month ||
    Number(values.day) !== day || Number(values.hour) !== hour || Number(values.minute) !== minute
  ) throw new Error("เวลานี้ไม่มีอยู่ในเขตเวลานั้น กรุณาเลือกเวลาอื่น");
  return result;
}

export function calculateDateDifference(startValue: string, endValue: string) {
  const fromInput = parseDateOnly(startValue);
  const toInput = parseDateOnly(endValue);
  const from = Math.min(fromInput, toInput);
  const to = Math.max(fromInput, toInput);
  const days = (to - from) / 86_400_000;
  let workdays = 0;
  for (let cursor = from + 86_400_000; cursor <= to; cursor += 86_400_000) {
    const weekday = new Date(cursor).getUTCDay();
    if (weekday !== 0 && weekday !== 6) workdays += 1;
  }
  return { days, weeks: Math.floor(days / 7), remainder: days % 7, workdays };
}

function parseDateOnly(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) throw new Error("กรุณาระบุวันที่ให้ครบ");
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day)
    throw new Error("วันที่ที่ระบุไม่มีอยู่จริง");
  return date.getTime();
}
