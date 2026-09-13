import { uiText } from "@/lib/ui-text";
import { useEffect, useState } from "react";
import { Download, QrCode, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/language";
import {
  calculateBillBreakdown,
  calculateBmiTdee,
  convertUnitValue,
  explainCron,
  testRegex,
  unitsFor,
  type UnitCategory,
} from "@/lib/tool-engines";

export function AdditionalToolPanel({ toolId }: { toolId: string }) {
  useLanguage();
  switch (toolId) {
    case "regex-tester": return <RegexTester />;
    case "cron-helper": return <CronHelper />;
    case "thai-year": return <ThaiYearConverter />;
    case "pomodoro": return <Pomodoro />;
    case "split-bill": return <SplitBill />;
    case "bmi-tdee": return <BmiTdee />;
    case "unit-converter": return <UnitConverter />;
    case "qr-generator": return <QrGenerator />;
    default: return null;
  }
}

function RegexTester() {
  const { language } = useLanguage();
  const [pattern, setPattern] = useState("\\w+");
  const [flags, setFlags] = useState<string[]>(["g", "i"]);
  const [input, setInput] = useState("Hello ToolsDice\nhello local tools");
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<ReturnType<typeof testRegex>>([]);
  const run = () => {
    try {
      setMatches(testRegex(pattern, flags.join(""), input));
      setError("");
    } catch (cause) {
      setMatches([]);
      setError(cause instanceof Error ? cause.message : "ตรวจ Regular Expression ไม่สำเร็จ");
    }
  };
  const toggleFlag = (flag: string) => setFlags((current) => current.includes(flag)
    ? current.filter((item) => item !== flag)
    : [...current, flag]);

  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">{uiText("รูปแบบและ flags")}</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-semibold">Regular Expression</span>
            <Input value={pattern} onChange={(event) => setPattern(event.target.value)} aria-label="Regular Expression" />
          </label>
          <fieldset className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <legend className="sr-only">{uiText("ตัวเลือก flags")}</legend>
            {["g", "i", "m", "s", "u"].map((flag) => (
              <label key={flag} className="flex min-h-10 items-center gap-1.5 font-mono text-sm">
                <input type="checkbox" checked={flags.includes(flag)} onChange={() => toggleFlag(flag)} className="size-5 accent-blue-500" />
                {flag}
              </label>
            ))}
          </fieldset>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">{uiText("ข้อความทดสอบ")}</span>
          <Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={7} />
        </label>
        <Button onClick={run}><RefreshCw size={16} /> {uiText("ทดสอบ")}</Button>
        {error && <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{uiText(error)}</p>}
        {!error && <p role="status" className="text-sm text-muted-foreground">{language === "en" ? matches.length.toLocaleString("en-US") + " matches found." : "พบ " + matches.length.toLocaleString("th-TH") + " รายการ"}</p>}
        {matches.length > 0 && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-background p-3 font-mono text-sm leading-7">
              <HighlightedText value={input} matches={matches} />
            </div>
            <ol className="max-h-52 space-y-1 overflow-auto rounded-xl border border-border bg-background p-3 font-mono text-xs">
              {matches.slice(0, 100).map((match, index) => (
                <li key={`${match.index}-${index}`} className="break-all">
                  <span className="mr-2 text-muted-foreground">{index + 1} · {match.index}</span>
                  {JSON.stringify(match.value)}
                </li>
              ))}
            </ol>
            {matches.length > 100 && <p className="text-xs text-muted-foreground">{uiText("แสดงตำแหน่งแรก 100 รายการ")}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HighlightedText({ value, matches }: { value: string; matches: ReturnType<typeof testRegex> }) {
  const nonEmpty = matches.filter((match) => match.value.length > 0);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const [index, match] of nonEmpty.entries()) {
    if (match.index < cursor) continue;
    parts.push(value.slice(cursor, match.index));
    parts.push(<mark key={`${match.index}-${index}`} className="rounded bg-amber-300/20 px-0.5 text-amber-100">{match.value}</mark>);
    cursor = match.index + match.value.length;
  }
  parts.push(value.slice(cursor));
  return <span className="whitespace-pre-wrap break-words">{parts}</span>;
}

function CronHelper() {
  const [value, setValue] = useState("0 9 * * 1-5");
  const result = explainCron(value);
  const presets = [
    ["ทุก 5 นาที", "*/5 * * * *"],
    ["ทุกวัน 09:00", "0 9 * * *"],
    ["จันทร์–ศุกร์ 09:00", "0 9 * * 1-5"],
    ["วันแรกของเดือน", "0 0 1 * *"],
  ];
  return (
    <Card>
      <CardHeader><h2 className="font-bold">{uiText("Cron expression 5 ช่อง")}</h2></CardHeader>
      <CardContent className="space-y-4">
        <Input aria-label="Cron expression" className="font-mono" value={value} onChange={(event) => setValue(event.target.value)} />
        <p role={result.valid ? "status" : "alert"} className={result.valid ? "rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3 text-sm text-cyan-100" : "rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200"}>
          {uiText(result.description)}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {presets.map(([label, cron]) => (
            <Button key={cron} variant="outline" className="min-h-11 justify-between" onClick={() => setValue(cron)}>
              <span>{uiText(label)}</span><code className="text-xs text-muted-foreground">{cron}</code>
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {["นาที", "ชั่วโมง", "วันที่", "เดือน", "วันในสัปดาห์"].map((label, index) => (
            <div className="min-w-0 rounded-lg border border-border bg-background p-2" key={label}>
              <span className="block text-xs text-muted-foreground">{uiText(label)}</span>
              <code className="block truncate text-sm">{value.trim().split(/\s+/u)[index] ?? "—"}</code>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ThaiYearConverter() {
  const { language } = useLanguage();
  const [value, setValue] = useState(String(new Date().getFullYear() + 543));
  const [direction, setDirection] = useState<"be-to-ce" | "ce-to-be">("be-to-ce");
  const year = Number(value);
  const valid = /^\d{1,4}$/u.test(value) && Number.isInteger(year) && year > 0;
  const converted = valid ? year + (direction === "be-to-ce" ? -543 : 543) : 0;
  return (
    <Card>
      <CardHeader><h2 className="font-bold">{uiText("แปลงปี พ.ศ. และ ค.ศ.")}</h2></CardHeader>
      <CardContent className="space-y-4">
        <Field label={uiText("ทิศทาง")}>
          <Select value={direction} onChange={(event) => setDirection(event.target.value as typeof direction)}>
            <option value="be-to-ce">{uiText("พ.ศ. → ค.ศ.")}</option><option value="ce-to-be">{uiText("ค.ศ. → พ.ศ.")}</option>
          </Select>
        </Field>
        <Field label={uiText(direction === "be-to-ce" ? "ปี พ.ศ." : "ปี ค.ศ.")}>
          <Input inputMode="numeric" value={value} onChange={(event) => setValue(event.target.value)} />
        </Field>
        {!valid ? <p role="alert" className="text-sm text-rose-200">{uiText("กรุณาระบุปีเป็นจำนวนเต็มมากกว่า 0")}</p> : (
          <div className="rounded-xl border border-border bg-background p-5 text-center">
            <span className="text-sm text-muted-foreground">{uiText("ผลลัพธ์")}</span>
            <strong className="mt-1 block text-3xl font-black">{converted.toLocaleString(language === "en" ? "en-US" : "th-TH")} {direction === "be-to-ce" ? language === "en" ? "CE" : "ค.ศ." : language === "en" ? "BE" : "พ.ศ."}</strong>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Pomodoro() {
  const { language } = useLanguage();
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [phase, setPhase] = useState<"work" | "break">("work");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState(false);
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running || secondsLeft > 0) return;
    setRunning(false);
    const nextPhase = phase === "work" ? "break" : "work";
    if (phase === "work") setSessions((current) => current + 1);
    setPhase(nextPhase);
    setSecondsLeft((nextPhase === "work" ? workMinutes : breakMinutes) * 60);
    if (sound) playCompletionTone();
  }, [breakMinutes, phase, running, secondsLeft, sound, workMinutes]);

  const reset = () => {
    setRunning(false);
    setSecondsLeft((phase === "work" ? workMinutes : breakMinutes) * 60);
  };
  const changeDuration = (next: number, targetPhase: "work" | "break") => {
    const safe = Math.min(90, Math.max(1, next || 1));
    if (targetPhase === "work") setWorkMinutes(safe);
    else setBreakMinutes(safe);
    if (!running && phase === targetPhase) setSecondsLeft(safe * 60);
  };

  return (
    <Card>
      <CardHeader><h2 className="font-bold">{uiText("ตัวจับเวลาโฟกัส")}</h2></CardHeader>
      <CardContent className="mx-auto grid max-w-xl gap-5">
        <div className="grid grid-cols-2 gap-2">
          <PhaseButton active={phase === "work"} onClick={() => { setRunning(false); setPhase("work"); setSecondsLeft(workMinutes * 60); }}>{uiText("โฟกัส")}</PhaseButton>
          <PhaseButton active={phase === "break"} onClick={() => { setRunning(false); setPhase("break"); setSecondsLeft(breakMinutes * 60); }}>{uiText("พัก")}</PhaseButton>
        </div>
        <div className="rounded-3xl border border-border bg-background px-4 py-8 text-center" aria-live="polite">
          <p className="text-sm text-muted-foreground">{uiText(phase === "work" ? "ช่วงโฟกัส" : "ช่วงพัก")}</p>
          <strong className="mt-1 block font-mono text-6xl font-black tabular-nums sm:text-7xl">
            {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}
          </strong>
          <p className="mt-2 text-xs text-muted-foreground">{language === "en" ? sessions + (sessions === 1 ? " focus session completed" : " focus sessions completed") : "ทำครบ " + sessions + " รอบ"}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button className="min-w-28" onClick={() => setRunning((current) => !current)}>
            {uiText(running ? "พักชั่วคราว" : "เริ่มจับเวลา")}
          </Button>
          <Button variant="outline" onClick={reset}><RefreshCw size={16} /> {uiText("เริ่มช่วงนี้ใหม่")}</Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={uiText("โฟกัส (นาที)")}><Input type="number" min={1} max={90} value={workMinutes} onChange={(event) => changeDuration(Number(event.target.value), "work")} /></Field>
          <Field label={uiText("พัก (นาที)")}><Input type="number" min={1} max={90} value={breakMinutes} onChange={(event) => changeDuration(Number(event.target.value), "break")} /></Field>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" className="size-5 accent-blue-500" checked={sound} onChange={(event) => setSound(event.target.checked)} />
          {uiText("เล่นเสียงสั้น ๆ เมื่อจบช่วง")}</label>
      </CardContent>
    </Card>
  );
}

function playCompletionTone() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    oscillator.connect(context.destination);
    oscillator.frequency.value = 740;
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
    oscillator.onended = () => void context.close();
  } catch { /* Audio can be unavailable or blocked by the browser. */ }
}

function SplitBill() {
  const { language } = useLanguage();
  const [subtotal, setSubtotal] = useState("1000");
  const [people, setPeople] = useState("2");
  const [service, setService] = useState("10");
  const [vat, setVat] = useState("7");
  const [tip, setTip] = useState("0");
  let error = "";
  let result: ReturnType<typeof calculateBillBreakdown> | null = null;
  try { result = calculateBillBreakdown(Number(subtotal), Number(people), Number(service), Number(vat), Number(tip)); }
  catch (cause) { error = cause instanceof Error ? cause.message : "คำนวณยอดไม่สำเร็จ"; }
  const setField = (setter: (value: string) => void) => (value: string) => setter(value);
  return (
    <Card>
      <CardHeader><h2 className="font-bold">{uiText("ยอดบิลและจำนวนคน")}</h2><p className="text-sm text-muted-foreground">{uiText("คำนวณ VAT จากยอดรวมค่าบริการ แล้วบวกทิปจากยอดก่อนค่าบริการ")}</p></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={uiText("ยอดอาหารและเครื่องดื่ม (บาท)")}><Input type="number" min="0" step="0.01" inputMode="decimal" value={subtotal} onChange={(event) => setField(setSubtotal)(event.target.value)} /></Field>
          <Field label={uiText("จำนวนคน")}><Input type="number" min="1" step="1" value={people} onChange={(event) => setField(setPeople)(event.target.value)} /></Field>
          <Field label={uiText("ค่าบริการ (%)")}><Input type="number" min="0" max="100" step="0.1" value={service} onChange={(event) => setField(setService)(event.target.value)} /></Field>
          <Field label="VAT (%)"><Input type="number" min="0" max="100" step="0.1" value={vat} onChange={(event) => setField(setVat)(event.target.value)} /></Field>
          <Field label={uiText("ทิป (%)")}><Input type="number" min="0" max="100" step="0.1" value={tip} onChange={(event) => setField(setTip)(event.target.value)} /></Field>
        </div>
        {error && <p role="alert" className="text-sm text-rose-200">{uiText(error)}</p>}
        {result && (
          <dl className="grid gap-2 rounded-xl border border-border bg-background p-4 text-sm">
            <MoneyRow label={uiText("ยอดก่อนเพิ่ม")} value={result.subtotal} />
            <MoneyRow label={uiText("ค่าบริการ")} value={result.service} />
            <MoneyRow label="VAT" value={result.vat} />
            <MoneyRow label={uiText("ทิป")} value={result.tip} />
            <MoneyRow label={uiText("ยอดรวม")} value={result.total} strong />
            <MoneyRow label={language === "en" ? "Per person (" + Number(people).toLocaleString("en-US") + " people)" : "ต่อคน (" + Number(people).toLocaleString("th-TH") + " คน)"} value={result.perPerson} strong />
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

function MoneyRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div className={strong ? "flex justify-between gap-3 border-t border-border pt-2 font-bold" : "flex justify-between gap-3 text-muted-foreground"}>
    <dt>{uiText(label)}</dt><dd className="tabular-nums">{money(value)}</dd>
  </div>;
}

function BmiTdee() {
  const { language } = useLanguage();
  const [weight, setWeight] = useState("65");
  const [height, setHeight] = useState("170");
  const [age, setAge] = useState("20");
  const [sex, setSex] = useState<"female" | "male">("female");
  const [activity, setActivity] = useState("1.55");
  let error = "";
  let result: ReturnType<typeof calculateBmiTdee> | null = null;
  try { result = calculateBmiTdee(Number(weight), Number(height), Number(age), sex, Number(activity)); }
  catch (cause) { error = cause instanceof Error ? cause.message : "คำนวณไม่สำเร็จ"; }
  return (
    <Card>
      <CardHeader><h2 className="font-bold">{uiText("ข้อมูลร่างกายและกิจกรรม")}</h2></CardHeader>
      <CardContent className="space-y-4">
        <p className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100">
          {uiText("ใช้สูตรประเมินสำหรับผู้ใหญ่อายุ 18 ปีขึ้นไปเท่านั้น ไม่ใช้ประเมินวัยรุ่นหรือแทนคำแนะนำจากบุคลากรสุขภาพ")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={uiText("อายุ (ปี) — 18 ปีขึ้นไป")}><Input type="number" min="18" max="100" value={age} onChange={(event) => setAge(event.target.value)} /></Field>
          <Field label={uiText("น้ำหนัก (กก.)")}><Input type="number" min="1" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} /></Field>
          <Field label={uiText("ส่วนสูง (ซม.)")}><Input type="number" min="1" step="0.1" value={height} onChange={(event) => setHeight(event.target.value)} /></Field>
          <Field label={uiText("สูตรคำนวณ")}><Select value={sex} onChange={(event) => setSex(event.target.value as typeof sex)}><option value="female">{uiText("หญิง")}</option><option value="male">{uiText("ชาย")}</option></Select></Field>
          <Field label={uiText("กิจกรรมต่อสัปดาห์")}><Select value={activity} onChange={(event) => setActivity(event.target.value)}><option value="1.2">{uiText("น้อยมาก")}</option><option value="1.375">{uiText("เบา 1–3 วัน")}</option><option value="1.55">{uiText("ปานกลาง 3–5 วัน")}</option><option value="1.725">{uiText("หนัก 6–7 วัน")}</option><option value="1.9">{uiText("หนักมาก")}</option></Select></Field>
        </div>
        {error ? <p role="alert" className="text-sm text-rose-200">{uiText(error)}</p> : result && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label={uiText("BMI โดยประมาณ")} value={result.bmi.toLocaleString(language === "en" ? "en-US" : "th-TH", { maximumFractionDigits: 1 })} />
            <Metric label={uiText("พลังงานต่อวันโดยประมาณ")} value={result.tdee.toLocaleString(language === "en" ? "en-US" : "th-TH") + " kcal"} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UnitConverter() {
  const { language } = useLanguage();
  const [category, setCategory] = useState<UnitCategory>("distance");
  const units = unitsFor(category);
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState(units[0]);
  const [to, setTo] = useState(units[1]);
  const changeCategory = (next: UnitCategory) => {
    const nextUnits = unitsFor(next);
    setCategory(next);
    setFrom(nextUnits[0]);
    setTo(nextUnits[1]);
  };
  let error = "";
  let result: number | null = null;
  try { result = convertUnitValue(category, Number(value), from, to); }
  catch (cause) { error = cause instanceof Error ? cause.message : "แปลงหน่วยไม่สำเร็จ"; }
  return (
    <Card>
      <CardHeader><h2 className="font-bold">{uiText("เลือกประเภทและหน่วย")}</h2></CardHeader>
      <CardContent className="space-y-4">
        <Field label={uiText("ประเภท")}><Select value={category} onChange={(event) => changeCategory(event.target.value as UnitCategory)}><option value="distance">{uiText("ระยะทาง")}</option><option value="weight">{uiText("น้ำหนัก")}</option><option value="temperature">{uiText("อุณหภูมิ")}</option><option value="area">{uiText("พื้นที่")}</option></Select></Field>
        <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
          <Field label={uiText("จำนวน")}><Input type="number" inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} /></Field>
          <Field label={uiText("จาก")}><Select value={from} onChange={(event) => setFrom(event.target.value)}>{units.map((unit) => <option key={unit} value={unit}>{unitName(unit, language)}</option>)}</Select></Field>
          <Field label={uiText("เป็น")}><Select value={to} onChange={(event) => setTo(event.target.value)}>{units.map((unit) => <option key={unit} value={unit}>{unitName(unit, language)}</option>)}</Select></Field>
        </div>
        {error ? <p role="alert" className="text-sm text-rose-200">{uiText(error)}</p> : result !== null && (
          <div className="rounded-xl border border-border bg-background p-5 text-center">
            <span className="text-sm text-muted-foreground">{uiText("ผลลัพธ์")}</span>
            <strong className="mt-1 block break-words text-2xl font-black">{result.toLocaleString(language === "en" ? "en-US" : "th-TH", { maximumFractionDigits: 8 })} {unitName(to, language)}</strong>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type QrMode = "text" | "url" | "wifi" | "phone";

function QrGenerator() {
  const [mode, setMode] = useState<QrMode>("url");
  const [value, setValue] = useState("https://example.com");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState("WPA");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const payload = () => {
    if (mode === "text") {
      if (!value.trim()) throw new Error("กรุณาใส่ข้อความก่อนสร้าง QR Code");
      return value;
    }
    if (mode === "url") {
      let url: URL;
      try { url = new URL(value.trim()); } catch { throw new Error("กรุณาใส่ URL ที่ถูกต้อง เช่น https://example.com"); }
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("รองรับเฉพาะ URL ที่ขึ้นต้นด้วย http หรือ https");
      return url.toString();
    }
    if (mode === "phone") {
      const phone = value.trim();
      if (!/^\+?[\d -]{6,20}$/u.test(phone)) throw new Error("กรุณาใส่หมายเลขโทรศัพท์ที่ถูกต้อง");
      return `tel:${phone.replace(/[ -]/gu, "")}`;
    }
    if (!ssid.trim()) throw new Error("กรุณาใส่ชื่อเครือข่าย Wi-Fi");
    const escapeWifi = (part: string) => part.replace(/([\\;,:"])/gu, "\\$1");
    return `WIFI:T:${security};S:${escapeWifi(ssid)};P:${escapeWifi(password)};;`;
  };
  const generate = async () => {
    setBusy(true);
    setError("");
    setImage("");
    try {
      const qr = await import("qrcode");
      const output = await qr.toDataURL(payload(), {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 360,
        color: { dark: "#101318", light: "#ffffff" },
      });
      setImage(output);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "สร้าง QR Code ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };
  const download = () => {
    if (!image) return;
    const anchor = document.createElement("a");
    anchor.href = image;
    anchor.download = "toolsdice-qr.png";
    anchor.click();
  };

  return (
    <Card>
      <CardHeader><h2 className="font-bold">{uiText("เลือกข้อมูลสำหรับ QR Code")}</h2><p className="text-sm text-muted-foreground">{uiText("ข้อมูลจะอยู่ในโค้ดที่ดาวน์โหลดและไม่ถูกส่งไปที่ใด")}</p></CardHeader>
      <CardContent className="space-y-4">
        <Field label={uiText("ชนิดข้อมูล")}><Select value={mode} onChange={(event) => { setMode(event.target.value as QrMode); setImage(""); setError(""); }}><option value="url">{uiText("ลิงก์")}</option><option value="text">{uiText("ข้อความ")}</option><option value="wifi">Wi-Fi</option><option value="phone">{uiText("โทรศัพท์")}</option></Select></Field>
        {mode === "wifi" ? <div className="grid gap-3 sm:grid-cols-2"><Field label={uiText("ชื่อเครือข่าย (SSID)")}><Input value={ssid} onChange={(event) => setSsid(event.target.value)} /></Field><Field label={uiText("รหัสผ่าน")}><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field><Field label={uiText("ความปลอดภัย")}><Select value={security} onChange={(event) => setSecurity(event.target.value)}><option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">{uiText("ไม่มีรหัสผ่าน")}</option></Select></Field></div> : mode === "text" ? <Field label={uiText("ข้อความ")}><Textarea value={value} onChange={(event) => setValue(event.target.value)} /></Field> : <Field label={uiText(mode === "url" ? "URL" : "หมายเลขโทรศัพท์")}><Input value={value} onChange={(event) => setValue(event.target.value)} inputMode={mode === "phone" ? "tel" : "url"} placeholder={mode === "url" ? "https://example.com" : "+66 81 234 5678"} /></Field>}
        <Button disabled={busy} onClick={() => void generate()}>{busy ? <RefreshCw size={16} className="animate-spin" /> : <QrCode size={17} />} {uiText("สร้าง QR Code")}</Button>
        {error && <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{uiText(error)}</p>}
        {image && <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-4">
          <img src={image} alt={uiText("QR Code ที่สร้างในเบราว์เซอร์")} width={260} height={260} className="max-w-full rounded bg-white p-2" />
          <Button variant="outline" onClick={download}><Download size={16} /> {uiText("ดาวน์โหลด PNG")}</Button>
        </div>}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="mb-2 block text-sm font-semibold">{uiText(label)}</span>{children}</label>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-background p-4"><span className="block text-xs text-muted-foreground">{uiText(label)}</span><strong className="mt-1 block text-xl font-black">{value}</strong></div>;
}

function PhaseButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <Button variant={active ? "default" : "outline"} className="min-h-11" onClick={onClick}>{children}</Button>;
}

function unitName(unit: string, language: "th" | "en") {
  if (language === "th") return unit;
  const names: Record<string, string> = {
    "มิลลิเมตร": "Millimeters", "เซนติเมตร": "Centimeters", "เมตร": "Meters", "กิโลเมตร": "Kilometers",
    "นิ้ว": "Inches", "ฟุต": "Feet", "ไมล์": "Miles", "มิลลิกรัม": "Milligrams", "กรัม": "Grams",
    "กิโลกรัม": "Kilograms", "ปอนด์": "Pounds", "ออนซ์": "Ounces", "ตารางเมตร": "Square meters",
    "ตารางฟุต": "Square feet", "ตารางวา": "Square wah", "งาน": "Ngan", "ไร่": "Rai",
    "เซลเซียส": "Celsius", "ฟาเรนไฮต์": "Fahrenheit", "เคลวิน": "Kelvin",
  };
  return names[unit] ?? unit;
}

function money(amount: number) {
  const locale = document.documentElement.lang === "en" ? "en-US" : "th-TH";
  return new Intl.NumberFormat(locale, { style: "currency", currency: "THB", minimumFractionDigits: 2 }).format(amount);
}
