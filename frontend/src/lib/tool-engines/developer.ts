export type RegexMatch = {
  value: string;
  index: number;
  groups: string[];
};

export function testRegex(pattern: string, flags: string, input: string): RegexMatch[] {
  if (pattern.length > 250)
    throw new Error("Regular Expression ต้องยาวไม่เกิน 250 ตัวอักษร");
  if (input.length > 20_000)
    throw new Error("ข้อความทดสอบต้องไม่เกิน 20,000 ตัวอักษร");
  if (!pattern) throw new Error("กรุณาใส่ Regular Expression");
  try {
    const normalizedFlags = [...new Set(flags)].join("");
    const globalRegex = new RegExp(
      pattern,
      normalizedFlags.includes("g") ? normalizedFlags : `${normalizedFlags}g`,
    );
    const matches: RegexMatch[] = [];
    for (const match of input.matchAll(globalRegex)) {
      matches.push({
        value: match[0],
        index: match.index ?? 0,
        groups: match.slice(1).map((group) => group ?? ""),
      });
      if (matches.length >= 5_000) break;
    }
    return matches;
  } catch {
    throw new Error("Regular Expression หรือ flags ไม่ถูกต้อง ตรวจวงเล็บและอักขระพิเศษ");
  }
}

const cronRanges: ReadonlyArray<[number, number]> = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
];

function isCronPartValid(part: string, minimum: number, maximum: number, questionAllowed: boolean) {
  if (part === "*" || (questionAllowed && part === "?")) return true;
  return part.split(",").every((entry) => {
    if (!entry) return false;
    const stepMatch = entry.match(/^\*\/(\d+)$/u);
    if (stepMatch) {
      const step = Number(stepMatch[1]);
      return Number.isInteger(step) && step > 0 && step <= maximum - minimum + 1;
    }
    const rangeMatch = entry.match(/^(\d+)-(\d+)$/u);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      return start >= minimum && end <= maximum && start <= end;
    }
    if (!/^\d+$/u.test(entry)) return false;
    const number = Number(entry);
    return number >= minimum && number <= maximum;
  });
}

export function explainCron(expression: string): { valid: boolean; description: string } {
  const parts = expression.trim().split(/\s+/u);
  if (parts.length !== 5)
    return {
      valid: false,
      description: "Cron ต้องมี 5 ช่อง: นาที ชั่วโมง วันที่ เดือน วันในสัปดาห์",
    };
  const valid = parts.every((part, index) =>
    isCronPartValid(part, cronRanges[index][0], cronRanges[index][1], index === 2 || index === 4),
  );
  if (!valid)
    return {
      valid: false,
      description: "ค่าบางช่องอยู่นอกช่วงที่รองรับ: นาที 0–59, ชั่วโมง 0–23, วันที่ 1–31, เดือน 1–12, วัน 0–7",
    };

  const [minute, hour, day, month, weekday] = parts;
  let description = `นาที ${minute} · ชั่วโมง ${hour}`;
  if (minute.startsWith("*/") && hour === "*" && day === "*" && month === "*" && weekday === "*")
    description = `ทำงานทุก ${minute.slice(2)} นาที`;
  else if (minute === "0" && hour === "9" && day === "*" && month === "*" && weekday === "1-5")
    description = "ทำงานวันจันทร์ถึงศุกร์ เวลา 09:00";
  else if (day !== "*" && day !== "?") description += ` · วันที่ ${day} ของเดือน`;
  else if (weekday !== "*" && weekday !== "?") description += ` · วันในสัปดาห์ ${weekday}`;
  else description += " · ทำงานทุกวัน";
  return { valid: true, description };
}
