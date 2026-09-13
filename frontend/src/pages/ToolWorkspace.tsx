import { uiText } from "@/lib/ui-text";
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Clipboard,
  Download,
  Heart,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePreferences } from "@/lib/preferences";
import { toolById, type ToolId } from "@/lib/tool-registry";
import { categoryName, toolDescription, toolName } from "@/lib/tool-locales";
import {
  base64Decode,
  base64Encode,
  buildQuery,
  calculateDateDifference,
  compareText,
  convertStructured,
  decodeUrlComponent,
  formatInTimeZone,
  formatJson,
  parseQuery,
  parseUrlComponents,
  parseTimestamp,
  sha,
  textStatistics,
  transformText,
  wallTimeToInstant,
  type TransformMode,
} from "@/lib/tool-engines";
import { useRuntimeConfig } from "@/lib/api";
import { categoryStyles } from "@/lib/category-styles";
import { useLanguage } from "@/lib/language";
import { cn } from "@/lib/utils";

const LazyTextTools = lazy(() => import("./TextToolsRouter").then((module) => ({ default: module.TextToolsRouter })));
const LazyPdfWorkspace = lazy(() => import("./tools/PdfPanels").then((module) => ({ default: module.PdfWorkspacePanel })));
const LazyImagePanel = lazy(() => import("./tools/ImagePanels").then((module) => ({ default: module.ImageToolPanel })));
const LazyDataWorkspace = lazy(() => import("./tools/DataPanels").then((module) => ({ default: module.DataWorkspacePanel })));
const LazyChecklist = lazy(() => import("./tools/ChecklistTool").then((module) => ({ default: module.ChecklistTool })));
const LazyExtendedPanel = lazy(() => import("./tools/ExtendedPanels").then((module) => ({ default: module.ExtendedToolPanel })));
const LazyAdditionalPanel = lazy(() => import("./tools/AdditionalPanels").then((module) => ({ default: module.AdditionalToolPanel })));

function PanelLoading() {
  return <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground" role="status">{uiText("กำลังเปิดเครื่องมือ…")}</div>;
}

function LazyPanel({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PanelLoading />}>{children}</Suspense>;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-sm font-semibold">
        <span>{uiText(label)}</span>
        {hint && (
          <span className="font-normal text-muted-foreground">{uiText(hint)}</span>
        )}
      </span>
      {children}
    </label>
  );
}

function SafeOutput({
  value,
  error,
  filename,
}: {
  value: string;
  error?: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([value], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = filename ?? "result.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Card className="output-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <h2 className="font-bold">{uiText("ผลลัพธ์")}</h2>
        {value && (
          <div className="flex gap-2">
            <Button size="sm" onClick={copy}>
              {copied ? <Check size={15} /> : <Clipboard size={15} />}
              {copied ? uiText("คัดลอกแล้ว") : uiText("คัดลอก")}
            </Button>
            <Button variant="outline" size="sm" onClick={download}>
              <Download size={15} />
              {uiText("ดาวน์โหลด")}</Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500"
          >
            {uiText(error)}
          </p>
        ) : (
          <Textarea
            aria-label={uiText("ผลลัพธ์")}
            value={value}
            readOnly
            placeholder={uiText("ผลลัพธ์จะแสดงที่นี่")}
          />
        )}
      </CardContent>
    </Card>
  );
}

function TransformTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<TransformMode>("upper");
  const output = transformText(input, mode);
  return (
    <TwoCols>
      <Card>
        <CardHeader>
          <h2 className="font-bold">{uiText("ข้อความต้นฉบับ")}</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={mode}
            onChange={(event) => setMode(event.target.value as TransformMode)}
          >
            <option value="upper">UPPERCASE</option>
            <option value="lower">lowercase</option>
            <option value="title">Title Case</option>
            <option value="sentence">Sentence case</option>
          </Select>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={uiText("วางข้อความที่นี่…")}
          />
        </CardContent>
      </Card>
      <SafeOutput value={output} />
    </TwoCols>
  );
}

function StatisticsTool() {
  const { language } = useLanguage();
  const [input, setInput] = useState("");
  const stats = textStatistics(input);
  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <h2 className="font-bold">{uiText("ข้อความ")}</h2>
        </CardHeader>
        <CardContent>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={uiText("เริ่มพิมพ์หรือวางข้อความ…")}
          />
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
        {Object.entries({
          ตัวอักษร: stats.characters,
          ไม่รวมช่องว่าง: stats.charactersNoSpaces,
          คำ: stats.words,
          บรรทัด: stats.lines,
          ย่อหน้า: stats.paragraphs,
          เวลาอ่าน: stats.readingTimeMinutes ? `${stats.readingTimeMinutes} ${uiText("นาที")}` : `0 ${uiText("นาที")}`,
          Bytes: stats.bytes,
        }).map(([label, value]) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <strong className="block text-3xl text-primary">
                {value.toLocaleString(language === "en" ? "en-US" : "th-TH")}
              </strong>
              <span className="text-sm text-muted-foreground">{uiText(label)}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DiffTool() {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const parts = useMemo(() => compareText(before, after), [before, after]);
  return (
    <div className="grid gap-5">
      <TwoCols>
        <Field label={uiText("ก่อนแก้ไข")}>
          <Textarea
            value={before}
            onChange={(event) => setBefore(event.target.value)}
          />
        </Field>
        <Field label={uiText("หลังแก้ไข")}>
          <Textarea
            value={after}
            onChange={(event) => setAfter(event.target.value)}
          />
        </Field>
      </TwoCols>
      <Card>
        <CardHeader>
          <h2 className="font-bold">{uiText("ความแตกต่าง")}</h2>
        </CardHeader>
        <CardContent>
          <div className="min-h-32 whitespace-pre-wrap rounded-xl border border-border bg-background p-4 font-mono text-sm">
            {parts.length ? (
              parts.map((part, index) => (
                <span
                  key={index}
                  className={
                    part.added
                      ? "bg-cyan-100 text-cyan-900"
                      : part.removed
                        ? "bg-red-400/20 text-red-500 line-through"
                        : ""
                  }
                >
                  {part.value}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">
                {uiText("ใส่ข้อความทั้งสองฝั่งเพื่อเปรียบเทียบ")}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TimestampTool() {
  const { language } = useLanguage();
  const [input, setInput] = useState(() => Date.now().toString());
  let result = "";
  let error = "";
  try {
    const date = parseTimestamp(input);
    result = [
      `ISO: ${date.toISOString()}`,
      `Unix seconds: ${Math.floor(date.getTime() / 1000)}`,
      `Unix milliseconds: ${date.getTime()}`,
      `${language === "en" ? "Bangkok time" : "เวลาไทย"}: ${formatInTimeZone(date, "Asia/Bangkok", language === "en" ? "en-US" : "th-TH")}`,
    ].join("\n");
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "แปลงเวลาไม่สำเร็จ";
  }
  return (
    <TwoCols>
      <Card>
        <CardHeader>
          <h2 className="font-bold">{uiText("วันเวลาหรือ Timestamp")}</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => setInput(Date.now().toString())}
          >
            <RefreshCw size={16} />
            {uiText("เวลาปัจจุบัน")}</Button>
        </CardContent>
      </Card>
      <SafeOutput value={result} error={error} />
    </TwoCols>
  );
}

const timeZones = [
  "Asia/Bangkok",
  "UTC",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];
function TimezoneTool() {
  const { language } = useLanguage();
  const [dateTime, setDateTime] = useState(() =>
    localDateTimeInput(new Date()),
  );
  const [from, setFrom] = useState("Asia/Bangkok");
  const [to, setTo] = useState("UTC");
  let result = "";
  let error = "";
  try {
    const atZone = wallTimeToInstant(dateTime, from);
    const locale = language === "en" ? "en-US" : "th-TH";
    result = `${formatInTimeZone(atZone, from, locale)}\n→\n${formatInTimeZone(atZone, to, locale)}\nISO: ${atZone.toISOString()}`;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "แปลงเขตเวลาไม่สำเร็จ";
  }
  return (
    <TwoCols>
      <Card>
        <CardHeader>
          <h2 className="font-bold">{uiText("ตั้งค่าเวลา")}</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label={uiText("วันและเวลา")}>
            <Input
              type="datetime-local"
              value={dateTime}
              onChange={(event) => setDateTime(event.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={uiText("จาก")}>
              <Select
                className="w-full"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              >
                {timeZones.map((zone) => (
                  <option key={zone}>{zone}</option>
                ))}
              </Select>
            </Field>
            <Field label={uiText("ไปยัง")}>
              <Select
                className="w-full"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              >
                {timeZones.map((zone) => (
                  <option key={zone}>{zone}</option>
                ))}
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>
      <SafeOutput value={result} error={error} />
    </TwoCols>
  );
}

function DateCalculatorTool() {
  const { language, text } = useLanguage();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [start, setStart] = useState(() => localDateInput(today));
  const [end, setEnd] = useState(() => localDateInput(tomorrow));
  let difference: ReturnType<typeof calculateDateDifference> | null = null;
  let differenceError = "";
  try { difference = calculateDateDifference(start, end); }
  catch (cause) { differenceError = errorMessage(cause); }
  const locale = language === "en" ? "en-US" : "th-TH";
  const dayRange = difference
    ? `${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(`${start}T12:00:00`))} – ${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(`${end}T12:00:00`))}`
    : "";
  return (
    <TwoCols>
      <Card>
        <CardHeader>
          <h2 className="font-bold">{uiText("ช่วงวันที่")}</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={uiText("วันเริ่มต้น")}>
              <Input
                type="date"
                value={start}
                onChange={(event) => setStart(event.target.value)}
              />
            </Field>
            <Field label={uiText("วันสิ้นสุด")}>
              <Input
                type="date"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>
      {differenceError ? <SafeOutput value="" error={differenceError} /> : difference && <section className="day-difference-output output-panel" aria-live="polite">
        <h2>{text("ผลต่างของวัน", "Days between")}</h2>
        <p className="day-difference-range">{dayRange}</p>
        <div className="day-difference-values">
          <div><strong>{difference.days.toLocaleString(locale)}</strong><span>{text("รวมเสาร์อาทิตย์", "Including weekends")}</span></div>
          <div><strong>{difference.workdays.toLocaleString(locale)}</strong><span>{text("ไม่รวมเสาร์อาทิตย์", "Weekdays only")}</span></div>
        </div>
      </section>}
    </TwoCols>
  );
}

function ConverterTool({ type }: { type: "json" | "yaml" | "base64" | "url" }) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(
    type === "json" ? "format" : type === "yaml" ? "json-to-yaml" : "encode",
  );
  const [sortKeys, setSortKeys] = useState(false);
  const [indent, setIndent] = useState<2 | 4>(2);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let live = true;
    setOutput("");
    setError("");
    if (!input.trim()) {
      setPending(false);
      return () => { live = false; };
    }
    try {
      if (type === "json") setOutput(formatJson(input, mode === "minify", { sortKeys, indent }));
      else if (type === "yaml") {
        setPending(true);
        void convertStructured(input, mode as "json-to-yaml" | "yaml-to-json")
          .then((value) => { if (live) setOutput(value); })
          .catch((cause: unknown) => { if (live) setError(errorMessage(cause)); })
          .finally(() => { if (live) setPending(false); });
      } else if (type === "base64") {
        setOutput(mode === "encode" ? base64Encode(input) : base64Decode(input));
      } else if (type === "url") {
        if (mode === "encode") setOutput(encodeURIComponent(input));
        else if (mode === "decode") setOutput(decodeUrlComponent(input));
        else if (mode === "query") setOutput(parseQuery(input));
        else if (mode === "build-query") setOutput(buildQuery(input));
        else {
          setOutput(JSON.stringify(parseUrlComponents(input), null, 2));
        }
      }
    } catch (cause) {
      setError(errorMessage(cause));
    }
    return () => { live = false; };
  }, [indent, input, mode, sortKeys, type]);
  const options =
    type === "json"
      ? [
          ["format", "จัดรูปแบบ"],
          ["validate", "ตรวจ JSON"],
          ["minify", "ย่อ JSON"],
          ["view", "ดูเป็นต้นไม้"],
        ]
      : type === "yaml"
        ? [
            ["json-to-yaml", "JSON → YAML"],
            ["yaml-to-json", "YAML → JSON"],
          ]
        : type === "url"
          ? [
              ["encode", "Encode"],
              ["decode", "Decode"],
              ["query", "Query → JSON"],
              ["build-query", "JSON → Query"],
              ["parse-url", "แยกส่วน URL"],
            ]
          : [
              ["encode", "Encode"],
              ["decode", "Decode"],
            ];
  return (
    <TwoCols>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-bold">{uiText("ข้อมูลต้นฉบับ")}</h2>
          <Select
            value={mode}
            onChange={(event) => setMode(event.target.value)}
          >
            {options.map(([value, label]) => (
              <option value={value} key={value}>
              {uiText(label)}
              </option>
            ))}
          </Select>
        </CardHeader>
        <CardContent className="space-y-3">
          {type === "json" && mode !== "minify" && <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="size-5 accent-blue-500" checked={sortKeys} onChange={(event) => setSortKeys(event.target.checked)} />{uiText("เรียง key A–Z")}</label>
            <Field label={uiText("จำนวนช่องว่าง")}><Select value={indent} onChange={(event) => setIndent(Number(event.target.value) as 2 | 4)}><option value={2}>{uiText("2 ช่อง")}</option><option value={4}>{uiText("4 ช่อง")}</option></Select></Field>
          </div>}
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              type === "yaml" ? '{ "hello": "world" }' : uiText("วางข้อมูลที่นี่…")
            }
          />
        </CardContent>
      </Card>
      <div className="grid gap-3">
        <SafeOutput
        value={pending ? uiText("กำลังแปลง…") : output}
        error={error}
        filename={
          type === "yaml" && mode === "json-to-yaml"
            ? "result.yaml"
            : type === "json" || (type === "yaml" && mode === "yaml-to-json")
              ? "result.json"
              : undefined
        }
        />
        {type === "json" && mode === "validate" && !error && input.trim() && <p role="status" className="rounded-lg border border-cyan-300/25 bg-cyan-300/5 p-3 text-sm text-cyan-100">{uiText("JSON ถูกต้อง")}</p>}
        {type === "json" && mode === "view" && !error && input.trim() && <JsonTree input={input} />}
      </div>
    </TwoCols>
  );
}

function JsonTree({ input }: { input: string }) {
  let value: unknown;
  try { value = JSON.parse(input) as unknown; }
  catch { return null; }
  return <Card><CardHeader><h2 className="font-bold">{uiText("โครงสร้าง JSON")}</h2></CardHeader><CardContent><JsonNode name="root" value={value} depth={0} /></CardContent></Card>;
}

function JsonNode({ name, value, depth }: { name: string; value: unknown; depth: number }) {
  if (value !== null && typeof value === "object") {
    const entries: Array<[string, unknown]> = Array.isArray(value)
      ? value.map((item, index) => [String(index), item])
      : Object.entries(value as Record<string, unknown>);
    return <details className="json-node" open={depth < 2}><summary><code>{name}</code><span>{Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`}</span></summary><div className="json-children">{entries.map(([key, item]) => <JsonNode key={key} name={key} value={item} depth={depth + 1} />)}</div></details>;
  }
  return <p className="json-leaf"><code>{name}</code><span>{JSON.stringify(value)}</span></p>;
}

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : "ไม่สามารถประมวลผลข้อมูลนี้ได้";
}

function HashTool() {
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState<"SHA-256" | "SHA-384" | "SHA-512">(
    "SHA-256",
  );
  const [output, setOutput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sourceMode, setSourceMode] = useState<"text" | "file" | "uuid">("text");
  const [uuidCount, setUuidCount] = useState(1);
  const [error, setError] = useState("");
  const { config } = useRuntimeConfig();
  useEffect(() => {
    if (file || sourceMode !== "text") return;
    let live = true;
    sha(input, algorithm).then((value) => live && setOutput(value)).catch(() => live && setError("สร้าง Hash ไม่สำเร็จ"));
    return () => {
      live = false;
    };
  }, [input, algorithm, file, sourceMode]);
  const hashSelectedFile = async () => {
    if (!file) return;
    setError("");
    try {
      const digest = await crypto.subtle.digest(algorithm, await file.arrayBuffer());
      setOutput(Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""));
    } catch {
      setError("อ่านไฟล์หรือสร้าง Hash ไม่สำเร็จ");
    }
  };
  return (
    <TwoCols>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-bold">{uiText("ข้อความ")}</h2>
          <Select
            value={algorithm}
            onChange={(event) =>
              setAlgorithm(event.target.value as typeof algorithm)
            }
          >
            <option>SHA-256</option>
            <option>SHA-384</option>
            <option>SHA-512</option>
          </Select>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={input}
            onChange={(event) => { setInput(event.target.value); setFile(null); setSourceMode("text"); setError(""); }}
          />
          <label className="block text-sm font-medium">
            <span className="mb-2 block">{uiText("หรือเลือกไฟล์ (สูงสุด ")}{Math.floor(config.maxLocalFileBytes / 1024 / 1024)} MB)</span>
            <Input type="file" onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              setOutput("");
              if (next && next.size > config.maxLocalFileBytes) {
                setFile(null);
                setError(`ไฟล์มีขนาดเกิน ${Math.floor(config.maxLocalFileBytes / 1024 / 1024)} MB`);
              } else {
                setFile(next);
                setSourceMode(next ? "file" : "text");
                setError("");
              }
              event.currentTarget.value = "";
            }} />
          </label>
          {file && <p className="text-sm text-muted-foreground">{uiText("เลือกแล้ว: ")}{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
          {file && <Button onClick={() => void hashSelectedFile()}>{uiText("สร้าง Hash จากไฟล์")}</Button>}
          {error && <p role="alert" className="text-sm text-rose-200">{uiText(error)}</p>}
          <Field label={uiText("จำนวน UUID v4")}><Input type="number" min="1" max="100" value={uuidCount} onChange={(event) => setUuidCount(Math.min(100, Math.max(1, Number(event.target.value) || 1)))} /></Field>
          <Button variant="outline" onClick={() => { setFile(null); setSourceMode("uuid"); setOutput(Array.from({ length: uuidCount }, () => crypto.randomUUID()).join("\n")); }}>
            <RefreshCw size={16} />
            {uiText("สร้าง UUID v4")}</Button>
        </CardContent>
      </Card>
      <SafeOutput value={output} />
    </TwoCols>
  );
}

function PdfTool({ toolId, maxFileBytes }: { toolId: string; maxFileBytes: number }) {
  return <LazyPanel><LazyPdfWorkspace toolId={toolId} maxFileBytes={maxFileBytes} /></LazyPanel>;
}

function TwoCols({ children }: { children: ReactNode }) {
  return <div className="workspace-two-col">{children}</div>;
}

function localDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localDateTimeInput(date: Date) {
  return `${localDateInput(date)}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function ToolWorkspace() {
  const { toolSlug } = useParams();
  const location = useLocation();
  const tool = toolById.get(toolSlug as ToolId);
  const { favorites, toggleFavorite } = usePreferences();
  const { language, text } = useLanguage();
  const { config } = useRuntimeConfig();
  if (!tool) return <Navigate to="/" replace />;
  const requestedBack = (location.state as { from?: unknown } | null)?.from;
  const backTo = typeof requestedBack === "string" &&
    (requestedBack === "/" || /^\/categories\/[a-z-]+$/u.test(requestedBack))
    ? requestedBack
    : "/";
  const categoryStyle = categoryStyles[tool.category];
  const content: Record<ToolId, ReactNode> = {
    "text-word-count": <LazyPanel><LazyTextTools toolId="text-word-count" /></LazyPanel>,
    "text-character-count": <LazyPanel><LazyTextTools toolId="text-character-count" /></LazyPanel>,
    "text-transformer": <TransformTool />,
    "text-remove-duplicates": <LazyPanel><LazyTextTools toolId="text-remove-duplicates" /></LazyPanel>,
    "text-sort-lines": <LazyPanel><LazyTextTools toolId="text-sort-lines" /></LazyPanel>,
    "text-whitespace": <LazyPanel><LazyTextTools toolId="text-whitespace" /></LazyPanel>,
    "text-find-replace": <LazyPanel><LazyTextTools toolId="text-find-replace" /></LazyPanel>,
    "text-statistics": <StatisticsTool />,
    "text-diff": <DiffTool />,
    "text-markdown": <LazyPanel><LazyTextTools toolId="text-markdown" /></LazyPanel>,
    "text-slug": <LazyPanel><LazyTextTools toolId="text-slug" /></LazyPanel>,
    "text-remove-empty": <LazyPanel><LazyTextTools toolId="text-remove-empty" /></LazyPanel>,
    "text-reverse": <LazyPanel><LazyTextTools toolId="text-reverse" /></LazyPanel>,
    "text-keyboard": <LazyPanel><LazyTextTools toolId="text-keyboard" /></LazyPanel>,
    "text-money": <LazyPanel><LazyTextTools toolId="text-money" /></LazyPanel>,
    "text-clean": <LazyPanel><LazyTextTools toolId="text-clean" /></LazyPanel>,
    "timestamp-converter": <TimestampTool />,
    "timezone-converter": <TimezoneTool />,
    "date-calculator": <DateCalculatorTool />,
    "json-toolkit": <ConverterTool type="json" />,
    "json-yaml": <ConverterTool type="yaml" />,
    base64: <ConverterTool type="base64" />,
    "url-toolkit": <ConverterTool type="url" />,
    "hash-uuid": <HashTool />,
    "pdf-workspace": <PdfTool toolId="merge-pdf" maxFileBytes={config.maxLocalFileBytes} />,
    "pdf-text": <PdfTool toolId="pdf-text" maxFileBytes={config.maxLocalFileBytes} />,
    "manage-pdf-pages": <PdfTool toolId="manage-pdf-pages" maxFileBytes={config.maxLocalFileBytes} />,
    "pdf-metadata": <PdfTool toolId="pdf-metadata" maxFileBytes={config.maxLocalFileBytes} />,
    "compress-pdf": <PdfTool toolId="compress-pdf" maxFileBytes={config.maxLocalFileBytes} />,
    "page-number-pdf": <PdfTool toolId="page-number-pdf" maxFileBytes={config.maxLocalFileBytes} />,
    "add-watermark": <PdfTool toolId="add-watermark" maxFileBytes={config.maxLocalFileBytes} />,
    "images-to-pdf": <PdfTool toolId="images-to-pdf" maxFileBytes={config.maxLocalFileBytes} />,
    "pdf-to-images": <PdfTool toolId="pdf-to-images" maxFileBytes={config.maxLocalFileBytes} />,
    "split-pdf": <PdfTool toolId="split-pdf" maxFileBytes={config.maxLocalFileBytes} />,
    "image-resize": <LazyPanel><LazyImagePanel toolId="image-resize" maxFileBytes={config.maxLocalFileBytes} /></LazyPanel>,
    "image-crop": <LazyPanel><LazyImagePanel toolId="image-crop" maxFileBytes={config.maxLocalFileBytes} /></LazyPanel>,
    "image-compressor": <LazyPanel><LazyImagePanel toolId="image-compressor" maxFileBytes={config.maxLocalFileBytes} /></LazyPanel>,
    "jpg-to-png": <LazyPanel><LazyImagePanel toolId="jpg-to-png" maxFileBytes={config.maxLocalFileBytes} /></LazyPanel>,
    "png-to-jpg": <LazyPanel><LazyImagePanel toolId="png-to-jpg" maxFileBytes={config.maxLocalFileBytes} /></LazyPanel>,
    "image-to-webp": <LazyPanel><LazyImagePanel toolId="image-to-webp" maxFileBytes={config.maxLocalFileBytes} /></LazyPanel>,
    "webp-to-png": <LazyPanel><LazyImagePanel toolId="webp-to-png" maxFileBytes={config.maxLocalFileBytes} /></LazyPanel>,
    "remove-image-metadata": <LazyPanel><LazyImagePanel toolId="remove-image-metadata" maxFileBytes={config.maxLocalFileBytes} /></LazyPanel>,
    "image-to-base64": <LazyPanel><LazyImagePanel toolId="image-to-base64" maxFileBytes={config.maxLocalFileBytes} /></LazyPanel>,
    "base64-to-image": <LazyPanel><LazyImagePanel toolId="base64-to-image" maxFileBytes={config.maxLocalFileBytes} /></LazyPanel>,
    "color-picker": <LazyPanel><LazyExtendedPanel tool={toolById.get("color-picker")!} /></LazyPanel>,
    "favicon-generator": <LazyPanel><LazyImagePanel toolId="favicon-generator" maxFileBytes={config.maxLocalFileBytes} /></LazyPanel>,
    "jwt-decoder": <LazyPanel><LazyExtendedPanel tool={toolById.get("jwt-decoder")!} /></LazyPanel>,
    "regex-tester": <LazyPanel><LazyAdditionalPanel toolId="regex-tester" /></LazyPanel>,
    "cron-helper": <LazyPanel><LazyAdditionalPanel toolId="cron-helper" /></LazyPanel>,
    "sql-formatter": <LazyPanel><LazyExtendedPanel tool={toolById.get("sql-formatter")!} /></LazyPanel>,
    "html-beautifier": <LazyPanel><LazyExtendedPanel tool={toolById.get("html-beautifier")!} /></LazyPanel>,
    "css-beautifier": <LazyPanel><LazyExtendedPanel tool={toolById.get("css-beautifier")!} /></LazyPanel>,
    "javascript-beautifier": <LazyPanel><LazyExtendedPanel tool={toolById.get("javascript-beautifier")!} /></LazyPanel>,
    "html-minifier": <LazyPanel><LazyExtendedPanel tool={toolById.get("html-minifier")!} /></LazyPanel>,
    "css-minifier": <LazyPanel><LazyExtendedPanel tool={toolById.get("css-minifier")!} /></LazyPanel>,
    "javascript-minifier": <LazyPanel><LazyExtendedPanel tool={toolById.get("javascript-minifier")!} /></LazyPanel>,
    "csv-json": <LazyPanel><LazyExtendedPanel tool={toolById.get("csv-json")!} /></LazyPanel>,
    "number-base-converter": <LazyPanel><LazyExtendedPanel tool={toolById.get("number-base-converter")!} /></LazyPanel>,
    "unit-converter": <LazyPanel><LazyAdditionalPanel toolId="unit-converter" /></LazyPanel>,
    "csv-workspace": <LazyPanel><LazyDataWorkspace maxFileBytes={config.maxLocalFileBytes} /></LazyPanel>,
    checklist: <LazyPanel><LazyChecklist /></LazyPanel>,
    "password-generator": <LazyPanel><LazyExtendedPanel tool={toolById.get("password-generator")!} /></LazyPanel>,
    "random-string-generator": <LazyPanel><LazyExtendedPanel tool={toolById.get("random-string-generator")!} /></LazyPanel>,
    "qr-generator": <LazyPanel><LazyAdditionalPanel toolId="qr-generator" /></LazyPanel>,
    "lorem-generator": <LazyPanel><LazyExtendedPanel tool={toolById.get("lorem-generator")!} /></LazyPanel>,
    "random-number-generator": <LazyPanel><LazyExtendedPanel tool={toolById.get("random-number-generator")!} /></LazyPanel>,
    "thai-year": <LazyPanel><LazyAdditionalPanel toolId="thai-year" /></LazyPanel>,
    pomodoro: <LazyPanel><LazyAdditionalPanel toolId="pomodoro" /></LazyPanel>,
    "split-bill": <LazyPanel><LazyAdditionalPanel toolId="split-bill" /></LazyPanel>,
    "bmi-tdee": <LazyPanel><LazyAdditionalPanel toolId="bmi-tdee" /></LazyPanel>,
  };
  return (
    <div className="mx-auto max-w-7xl">
      <Link
        to={backTo}
        className="workspace-back-sticky mb-3 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:mb-5 sm:text-sm"
      >
        <ArrowLeft size={16} />
        {backTo === "/"
          ? text("กลับไปภาพรวม", "Back to overview")
          : `${text("กลับไปหมวด", "Back to")} ${categoryName(tool.category, language)}`}
      </Link>
      <header className="mb-5 flex items-start justify-between gap-3 sm:mb-7 sm:gap-4">
        <div className="flex min-w-0 gap-3 sm:gap-4">
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl sm:size-12", categoryStyle.icon)}>
            <tool.icon size={22} />
          </span>
          <div>
            <Badge className={categoryStyle.icon}>
              {categoryName(tool.category, language)}
            </Badge>
            <h1 className="mt-2 text-xl font-black sm:text-2xl md:text-3xl">
              {toolName(tool, language)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {toolDescription(tool, language)}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label={
            favorites.includes(tool.id)
              ? text("นำออกจากรายการโปรด", "Remove from favorites")
              : text("เพิ่มในรายการโปรด", "Add to favorites")
          }
          aria-pressed={favorites.includes(tool.id)}
          onClick={() => toggleFavorite(tool.id)}
        >
          <Heart
            size={18}
            className={
              favorites.includes(tool.id) ? "fill-amber-500 text-amber-600" : ""
            }
          />
        </Button>
      </header>
      <section className="local-tool-panel">{content[tool.id]}</section>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        {text(
          "ข้อมูลในหน้านี้ประมวลผลภายในเบราว์เซอร์และไม่ถูกบันทึก",
          "Your content is processed in this browser and is not stored.",
        )}
      </p>
    </div>
  );
}
