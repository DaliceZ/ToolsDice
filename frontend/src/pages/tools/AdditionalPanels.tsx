import { uiText } from "@/lib/ui-text";
import { useState } from "react";
import { Activity, CalendarDays, Download, Gauge, QrCode, RefreshCw, Ruler, ShieldCheck, Weight } from "lucide-react";
import { ChoiceMenu, type Choice } from "@/components/ChoiceMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/language";
import {
  calculateBillBreakdown,
  calculateBmiTdee,
  convertUnitValue,
  testRegex,
  unitsFor,
  type UnitCategory,
} from "@/lib/tool-engines";

export function AdditionalToolPanel({ toolId }: { toolId: string }) {
  useLanguage();
  switch (toolId) {
    case "regex-tester": return <RegexTester />;
    case "thai-year": return <ThaiYearConverter />;
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

function ThaiYearConverter() {
  const { language, text } = useLanguage();
  const [value, setValue] = useState(String(new Date().getFullYear() + 543));
  const [direction, setDirection] = useState<"be-to-ce" | "ce-to-be">("be-to-ce");
  const directions: Choice[] = [
    { value: "be-to-ce", label: text("พ.ศ. → ค.ศ.", "Buddhist Era → Common Era"), compact: text("พ.ศ. → ค.ศ.", "BE → CE") },
    { value: "ce-to-be", label: text("ค.ศ. → พ.ศ.", "Common Era → Buddhist Era"), compact: text("ค.ศ. → พ.ศ.", "CE → BE") },
  ];
  const year = Number(value);
  const valid = /^\d{1,4}$/u.test(value) && Number.isInteger(year) && year > 0;
  const converted = valid ? year + (direction === "be-to-ce" ? -543 : 543) : 0;
  return (
    <Card>
      <CardHeader><h2 className="font-bold">{uiText("แปลงปี พ.ศ. และ ค.ศ.")}</h2></CardHeader>
      <CardContent className="space-y-4">
        <Field label={uiText("ทิศทาง")}>
          <ChoiceMenu className="choice-field" label={text("ทิศทาง", "Direction")} value={direction} icon={CalendarDays} choices={directions} onSelect={(next) => setDirection(next as typeof direction)} />
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
  const { language, text } = useLanguage();
  const [weight, setWeight] = useState("65");
  const [height, setHeight] = useState("170");
  const [age, setAge] = useState("20");
  const [sex, setSex] = useState<"female" | "male">("female");
  const [activity, setActivity] = useState("1.55");
  const sexChoices: Choice[] = [
    { value: "female", label: text("หญิง", "Female"), compact: text("หญิง", "Female") },
    { value: "male", label: text("ชาย", "Male"), compact: text("ชาย", "Male") },
  ];
  const activityChoices: Choice[] = [
    { value: "1.2", label: text("น้อยมาก", "Sedentary"), compact: text("น้อยมาก", "Sedentary") },
    { value: "1.375", label: text("เบา 1–3 วัน", "Light · 1–3 days/week"), compact: text("เบา 1–3 วัน", "Light") },
    { value: "1.55", label: text("ปานกลาง 3–5 วัน", "Moderate · 3–5 days/week"), compact: text("ปานกลาง", "Moderate") },
    { value: "1.725", label: text("หนัก 6–7 วัน", "Active · 6–7 days/week"), compact: text("หนัก", "Active") },
    { value: "1.9", label: text("หนักมาก", "Very active"), compact: text("หนักมาก", "Very active") },
  ];
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
          <Field label={text("สูตรคำนวณ", "BMR formula")}><ChoiceMenu className="choice-field" label={text("สูตรคำนวณ", "BMR formula")} value={sex} icon={Activity} choices={sexChoices} onSelect={(next) => setSex(next as typeof sex)} /></Field>
          <Field label={text("กิจกรรมต่อสัปดาห์", "Activity level")}><ChoiceMenu className="choice-field" label={text("กิจกรรมต่อสัปดาห์", "Activity level")} value={activity} icon={Gauge} choices={activityChoices} onSelect={setActivity} /></Field>
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
  const { language, text } = useLanguage();
  const [category, setCategory] = useState<UnitCategory>("distance");
  const units = unitsFor(category);
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState(units[0]);
  const [to, setTo] = useState(units[1]);
  const categoryChoices: Choice[] = [
    { value: "distance", label: text("ระยะทาง", "Distance"), compact: text("ระยะทาง", "Distance") },
    { value: "weight", label: text("น้ำหนัก", "Weight"), compact: text("น้ำหนัก", "Weight") },
    { value: "temperature", label: text("อุณหภูมิ", "Temperature"), compact: text("อุณหภูมิ", "Temp.") },
    { value: "area", label: text("พื้นที่", "Area"), compact: text("พื้นที่", "Area") },
  ];
  const unitChoices: Choice[] = units.map((unit) => ({ value: unit, label: unitName(unit, language), compact: unitName(unit, language) }));
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
        <Field label={text("ประเภท", "Category")}><ChoiceMenu className="choice-field" label={text("ประเภทหน่วย", "Unit category")} value={category} icon={Ruler} choices={categoryChoices} onSelect={(next) => changeCategory(next as UnitCategory)} /></Field>
        <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
          <Field label={uiText("จำนวน")}><Input type="number" inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} /></Field>
          <Field label={uiText("จาก")}><ChoiceMenu className="choice-field" label={text("หน่วยต้นทาง", "From unit")} value={from} icon={Weight} choices={unitChoices} onSelect={setFrom} /></Field>
          <Field label={uiText("เป็น")}><ChoiceMenu className="choice-field" label={text("หน่วยปลายทาง", "To unit")} value={to} icon={Weight} choices={unitChoices} onSelect={setTo} /></Field>
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
  const { text } = useLanguage();
  const [mode, setMode] = useState<QrMode>("url");
  const [value, setValue] = useState("https://example.com");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState("WPA");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const modeChoices: Choice[] = [
    { value: "url", label: text("ลิงก์", "Link"), compact: text("ลิงก์", "Link") },
    { value: "text", label: text("ข้อความ", "Text"), compact: text("ข้อความ", "Text") },
    { value: "wifi", label: "Wi-Fi", compact: "Wi-Fi" },
    { value: "phone", label: text("โทรศัพท์", "Phone"), compact: text("โทรศัพท์", "Phone") },
  ];
  const securityChoices: Choice[] = [
    { value: "WPA", label: "WPA / WPA2", compact: "WPA / WPA2" },
    { value: "WEP", label: "WEP", compact: "WEP" },
    { value: "nopass", label: text("ไม่มีรหัสผ่าน", "No password"), compact: text("ไม่มีรหัสผ่าน", "No password") },
  ];
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
        <Field label={text("ชนิดข้อมูล", "Data type")}><ChoiceMenu className="choice-field" label={text("ชนิดข้อมูล QR", "QR data type")} value={mode} icon={QrCode} choices={modeChoices} onSelect={(next) => { setMode(next as QrMode); setImage(""); setError(""); }} /></Field>
        {mode === "wifi" ? <div className="grid gap-3 sm:grid-cols-2"><Field label={uiText("ชื่อเครือข่าย (SSID)")}><Input value={ssid} onChange={(event) => setSsid(event.target.value)} /></Field><Field label={uiText("รหัสผ่าน")}><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field><Field label={uiText("ความปลอดภัย")}><ChoiceMenu className="choice-field" label={text("ความปลอดภัย Wi-Fi", "Wi-Fi security")} value={security} icon={ShieldCheck} choices={securityChoices} onSelect={setSecurity} /></Field></div> : mode === "text" ? <Field label={uiText("ข้อความ")}><Textarea value={value} onChange={(event) => setValue(event.target.value)} /></Field> : <Field label={uiText(mode === "url" ? "URL" : "หมายเลขโทรศัพท์")}><Input value={value} onChange={(event) => setValue(event.target.value)} inputMode={mode === "phone" ? "tel" : "url"} placeholder={mode === "url" ? "https://example.com" : "+66 81 234 5678"} /></Field>}
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
