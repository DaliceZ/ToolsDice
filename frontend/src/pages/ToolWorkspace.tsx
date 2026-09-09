import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Clipboard,
  Download,
  FilePlus2,
  Heart,
  LoaderCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePreferences } from "@/lib/preferences";
import { toolById, type ToolId } from "@/lib/tool-registry";
import {
  base64Decode,
  base64Encode,
  compareText,
  convertStructured,
  formatInTimeZone,
  formatJson,
  parsePageSelection,
  parseTimestamp,
  sha,
  textStatistics,
  transformText,
  type TransformMode,
} from "@/lib/tool-engines";
import { useRuntimeConfig } from "@/lib/api";
import { categoryStyles } from "@/lib/category-styles";
import { cn } from "@/lib/utils";

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
        <span>{label}</span>
        {hint && (
          <span className="font-normal text-muted-foreground">{hint}</span>
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <h2 className="font-bold">ผลลัพธ์</h2>
        {value && (
          <div className="flex gap-2">
            <Button size="sm" onClick={copy}>
              {copied ? <Check size={15} /> : <Clipboard size={15} />}
              {copied ? "คัดลอกแล้ว" : "คัดลอก"}
            </Button>
            <Button variant="outline" size="sm" onClick={download}>
              <Download size={15} />
              ดาวน์โหลด
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500"
          >
            {error}
          </p>
        ) : (
          <Textarea
            aria-label="ผลลัพธ์"
            value={value}
            readOnly
            placeholder="ผลลัพธ์จะแสดงที่นี่"
          />
        )}
      </CardContent>
    </Card>
  );
}

function TransformTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<TransformMode>("collapse");
  const output = transformText(input, mode);
  return (
    <TwoCols>
      <Card>
        <CardHeader>
          <h2 className="font-bold">ข้อความต้นฉบับ</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={mode}
            onChange={(event) => setMode(event.target.value as TransformMode)}
          >
            <option value="collapse">จัดช่องว่าง</option>
            <option value="trim">Trim ทุกบรรทัด</option>
            <option value="upper">UPPERCASE</option>
            <option value="lower">lowercase</option>
            <option value="title">Title Case</option>
            <option value="sentence">Sentence case</option>
          </Select>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="วางข้อความที่นี่…"
          />
        </CardContent>
      </Card>
      <SafeOutput value={output} />
    </TwoCols>
  );
}

function StatisticsTool() {
  const [input, setInput] = useState("");
  const stats = textStatistics(input);
  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <h2 className="font-bold">ข้อความ</h2>
        </CardHeader>
        <CardContent>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="เริ่มพิมพ์หรือวางข้อความ…"
          />
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Object.entries({
          ตัวอักษร: stats.characters,
          ไม่รวมช่องว่าง: stats.charactersNoSpaces,
          คำ: stats.words,
          บรรทัด: stats.lines,
          Bytes: stats.bytes,
        }).map(([label, value]) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <strong className="block text-3xl text-blue-500">
                {value.toLocaleString()}
              </strong>
              <span className="text-sm text-muted-foreground">{label}</span>
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
        <Field label="ก่อนแก้ไข">
          <Textarea
            value={before}
            onChange={(event) => setBefore(event.target.value)}
          />
        </Field>
        <Field label="หลังแก้ไข">
          <Textarea
            value={after}
            onChange={(event) => setAfter(event.target.value)}
          />
        </Field>
      </TwoCols>
      <Card>
        <CardHeader>
          <h2 className="font-bold">ความแตกต่าง</h2>
        </CardHeader>
        <CardContent>
          <div className="min-h-32 whitespace-pre-wrap rounded-xl border border-border bg-background p-4 font-mono text-sm">
            {parts.length ? (
              parts.map((part, index) => (
                <span
                  key={index}
                  className={
                    part.added
                      ? "bg-blue-400/25 text-blue-600 dark:text-blue-300"
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
                ใส่ข้อความทั้งสองฝั่งเพื่อเปรียบเทียบ
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TimestampTool() {
  const [input, setInput] = useState(() => Date.now().toString());
  let result = "";
  let error = "";
  try {
    const date = parseTimestamp(input);
    result = [
      `ISO: ${date.toISOString()}`,
      `Unix seconds: ${Math.floor(date.getTime() / 1000)}`,
      `Unix milliseconds: ${date.getTime()}`,
      `เวลาไทย: ${formatInTimeZone(date, "Asia/Bangkok")}`,
    ].join("\n");
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "แปลงเวลาไม่สำเร็จ";
  }
  return (
    <TwoCols>
      <Card>
        <CardHeader>
          <h2 className="font-bold">วันเวลาหรือ Timestamp</h2>
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
            เวลาปัจจุบัน
          </Button>
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
  const [dateTime, setDateTime] = useState(() =>
    new Date().toISOString().slice(0, 16),
  );
  const [from, setFrom] = useState("Asia/Bangkok");
  const [to, setTo] = useState("UTC");
  let result = "";
  let error = "";
  try {
    const parts = dateTime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!parts) throw new Error("กรุณาระบุวันเวลา");
    const localGuess = new Date(`${dateTime}:00Z`);
    const atZone = new Date(
      localGuess.getTime() - zoneOffset(localGuess, from),
    );
    result = `${formatInTimeZone(atZone, from)}\n→\n${formatInTimeZone(atZone, to)}\nISO: ${atZone.toISOString()}`;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "แปลงเขตเวลาไม่สำเร็จ";
  }
  return (
    <TwoCols>
      <Card>
        <CardHeader>
          <h2 className="font-bold">ตั้งค่าเวลา</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="วันและเวลา">
            <Input
              type="datetime-local"
              value={dateTime}
              onChange={(event) => setDateTime(event.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="จาก">
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
            <Field label="ไปยัง">
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

function zoneOffset(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return (
    Date.UTC(
      +values.year,
      +values.month - 1,
      +values.day,
      +values.hour,
      +values.minute,
      +values.second,
    ) - date.getTime()
  );
}

function DateCalculatorTool() {
  const [start, setStart] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [end, setEnd] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [amount, setAmount] = useState(7);
  const [unit, setUnit] = useState<"days" | "hours" | "months">("days");
  const first = new Date(`${start}T00:00:00`);
  const second = new Date(`${end}T00:00:00`);
  const diff = second.getTime() - first.getTime();
  const adjusted = new Date(first);
  if (unit === "months") adjusted.setMonth(adjusted.getMonth() + amount);
  else
    adjusted.setTime(
      adjusted.getTime() + amount * (unit === "days" ? 86400000 : 3600000),
    );
  const result = `ผลต่าง: ${Math.abs(Math.round(diff / 86400000)).toLocaleString()} วัน (${Math.abs(diff / 3600000).toLocaleString()} ชั่วโมง)\n${amount >= 0 ? "เพิ่ม" : "ลด"} ${Math.abs(amount)} ${unit === "days" ? "วัน" : unit === "hours" ? "ชั่วโมง" : "เดือน"} จากวันเริ่มต้น: ${adjusted.toLocaleString("th-TH")}`;
  return (
    <TwoCols>
      <Card>
        <CardHeader>
          <h2 className="font-bold">คำนวณช่วงเวลา</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="วันเริ่มต้น">
              <Input
                type="date"
                value={start}
                onChange={(event) => setStart(event.target.value)}
              />
            </Field>
            <Field label="วันสิ้นสุด">
              <Input
                type="date"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Field label="จำนวน">
              <Input
                type="number"
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
            </Field>
            <Field label="หน่วย">
              <Select
                value={unit}
                onChange={(event) => setUnit(event.target.value as typeof unit)}
              >
                <option value="days">วัน</option>
                <option value="hours">ชั่วโมง</option>
                <option value="months">เดือน</option>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>
      <SafeOutput value={result} />
    </TwoCols>
  );
}

function ConverterTool({ type }: { type: "json" | "yaml" | "base64" | "url" }) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(
    type === "json" ? "format" : type === "yaml" ? "json-to-yaml" : "encode",
  );
  let output = "";
  let error = "";
  try {
    if (type === "json") output = formatJson(input, mode === "minify");
    if (type === "yaml")
      output = convertStructured(
        input,
        mode as "json-to-yaml" | "yaml-to-json",
      );
    if (type === "base64")
      output = mode === "encode" ? base64Encode(input) : base64Decode(input);
    if (type === "url") {
      if (mode === "encode") output = encodeURIComponent(input);
      else if (mode === "decode") output = decodeURIComponent(input);
      else {
        const params = new URLSearchParams(
          input.includes("?") ? input.slice(input.indexOf("?") + 1) : input,
        );
        output = JSON.stringify(Object.fromEntries(params.entries()), null, 2);
      }
    }
  } catch (cause) {
    error =
      cause instanceof Error ? cause.message : "ไม่สามารถประมวลผลข้อมูลนี้ได้";
  }
  const options =
    type === "json"
      ? [
          ["format", "จัดรูปแบบ"],
          ["minify", "ย่อ JSON"],
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
            ]
          : [
              ["encode", "Encode"],
              ["decode", "Decode"],
            ];
  return (
    <TwoCols>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-bold">ข้อมูลต้นฉบับ</h2>
          <Select
            value={mode}
            onChange={(event) => setMode(event.target.value)}
          >
            {options.map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </Select>
        </CardHeader>
        <CardContent>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              type === "yaml" ? '{ "hello": "world" }' : "วางข้อมูลที่นี่…"
            }
          />
        </CardContent>
      </Card>
      <SafeOutput
        value={output}
        error={error}
        filename={
          type === "yaml" && mode === "json-to-yaml"
            ? "result.yaml"
            : type === "json" || (type === "yaml" && mode === "yaml-to-json")
              ? "result.json"
              : undefined
        }
      />
    </TwoCols>
  );
}

function HashTool() {
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState<"SHA-256" | "SHA-384" | "SHA-512">(
    "SHA-256",
  );
  const [output, setOutput] = useState("");
  useEffect(() => {
    let live = true;
    sha(input, algorithm).then((value) => live && setOutput(value));
    return () => {
      live = false;
    };
  }, [input, algorithm]);
  return (
    <TwoCols>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-bold">ข้อความ</h2>
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
            onChange={(event) => setInput(event.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => setOutput(crypto.randomUUID())}
          >
            <RefreshCw size={16} />
            สร้าง UUID v4
          </Button>
        </CardContent>
      </Card>
      <SafeOutput value={output} />
    </TwoCols>
  );
}

type PdfOperation = "merge" | "split" | "reorder" | "rotate";
function PdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [operation, setOperation] = useState<PdfOperation>("merge");
  const [pages, setPages] = useState("1");
  const [rotation, setRotation] = useState(90);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { config } = useRuntimeConfig();
  const run = async () => {
    setMessage("");
    setBusy(true);
    try {
      if (!files.length)
        throw new Error("กรุณาเลือกไฟล์ PDF อย่างน้อยหนึ่งไฟล์");
      const oversized = files.find(
        (file) => file.size > config.maxLocalFileBytes,
      );
      if (oversized)
        throw new Error(
          `${oversized.name} มีขนาดเกิน ${(config.maxLocalFileBytes / 1024 / 1024).toFixed(0)} MB`,
        );
      const { PDFDocument } = await import("pdf-lib");
      const first = await PDFDocument.load(await files[0].arrayBuffer());
      const selection =
        operation === "merge" || operation === "rotate"
          ? []
          : parsePageSelection(pages, first.getPageCount());
      const payloadFiles = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          bytes: await file.arrayBuffer(),
        })),
      );
      const worker = new Worker(
        new URL("../workers/pdf.worker.ts", import.meta.url),
        { type: "module" },
      );
      const result = await new Promise<{
        ok: boolean;
        bytes?: ArrayBuffer;
        error?: string;
      }>((resolve) => {
        worker.onmessage = (event) => resolve(event.data);
        worker.onerror = () =>
          resolve({ ok: false, error: "Web Worker ไม่สามารถเริ่มทำงานได้" });
        worker.postMessage(
          { files: payloadFiles, operation, pages: selection, rotation },
          payloadFiles.map((file) => file.bytes),
        );
      });
      worker.terminate();
      if (!result.ok || !result.bytes)
        throw new Error(result.error ?? "ประมวลผล PDF ไม่สำเร็จ");
      const url = URL.createObjectURL(
        new Blob([result.bytes], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `toolsdice-${operation}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("สร้างไฟล์สำเร็จและเริ่มดาวน์โหลดแล้ว");
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "ประมวลผล PDF ไม่สำเร็จ",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <h2 className="font-bold">ไฟล์ PDF</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            accept="application/pdf"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
          <button
            className="flex min-h-44 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background p-6 text-center hover:border-blue-400"
            onClick={() => inputRef.current?.click()}
          >
            <FilePlus2 size={32} className="mb-3 text-blue-500" />
            <strong>เลือกไฟล์ PDF</strong>
            <span className="mt-1 text-sm text-muted-foreground">
              ไฟล์อยู่ใน browser และจะไม่ถูกอัปโหลด
            </span>
          </button>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm"
              >
                <span className="truncate">
                  {index + 1}. {file.name} ·{" "}
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`ลบ ${file.name}`}
                  onClick={() =>
                    setFiles((items) =>
                      items.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-bold">วิธีประมวลผล</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="คำสั่ง">
            <Select
              className="w-full"
              value={operation}
              onChange={(event) =>
                setOperation(event.target.value as PdfOperation)
              }
            >
              <option value="merge">รวมทุกไฟล์</option>
              <option value="split">แยกหน้าที่เลือก</option>
              <option value="reorder">เรียงหน้าตามลำดับ</option>
              <option value="rotate">หมุนทุกหน้า</option>
            </Select>
          </Field>
          {(operation === "split" || operation === "reorder") && (
            <Field
              label={operation === "split" ? "ช่วงหน้า" : "ลำดับหน้า"}
              hint="เช่น 1-3,5"
            >
              <Input
                value={pages}
                onChange={(event) => setPages(event.target.value)}
              />
            </Field>
          )}
          {operation === "rotate" && (
            <Field label="องศา">
              <Select
                className="w-full"
                value={rotation}
                onChange={(event) => setRotation(Number(event.target.value))}
              >
                <option value={90}>90°</option>
                <option value={180}>180°</option>
                <option value={270}>270°</option>
              </Select>
            </Field>
          )}
          <Button
            className="w-full"
            onClick={run}
            disabled={busy || !files.length}
          >
            {busy ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Download size={17} />
            )}
            {busy ? "กำลังประมวลผล…" : "สร้างและดาวน์โหลด PDF"}
          </Button>
          {message && (
            <p role="status" className="rounded-lg bg-muted p-3 text-sm">
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TwoCols({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 lg:grid-cols-2">{children}</div>;
}

export function ToolWorkspace() {
  const { toolSlug } = useParams();
  const tool = toolById.get(toolSlug as ToolId);
  const { favorites, toggleFavorite, markRecent } = usePreferences();
  useEffect(() => {
    if (tool) markRecent(tool.id);
  }, [tool?.id]);
  if (!tool) return <Navigate to="/" replace />;
  const categoryStyle = categoryStyles[tool.category];
  const content: Record<ToolId, ReactNode> = {
    "text-transformer": <TransformTool />,
    "text-statistics": <StatisticsTool />,
    "text-diff": <DiffTool />,
    "timestamp-converter": <TimestampTool />,
    "timezone-converter": <TimezoneTool />,
    "date-calculator": <DateCalculatorTool />,
    "json-toolkit": <ConverterTool type="json" />,
    "json-yaml": <ConverterTool type="yaml" />,
    base64: <ConverterTool type="base64" />,
    "url-toolkit": <ConverterTool type="url" />,
    "hash-uuid": <HashTool />,
    "pdf-workspace": <PdfTool />,
  };
  return (
    <div className="mx-auto max-w-7xl">
      <Link
        to="/"
        className="mb-3 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground sm:mb-5 sm:text-sm"
      >
        <ArrowLeft size={16} />
        กลับหน้ารวมเครื่องมือ
      </Link>
      <header className="mb-5 flex items-start justify-between gap-3 sm:mb-7 sm:gap-4">
        <div className="flex min-w-0 gap-3 sm:gap-4">
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl sm:size-12", categoryStyle.icon)}>
            <tool.icon size={22} />
          </span>
          <div>
            <Badge className={categoryStyle.icon}>{tool.category}</Badge>
            <h1 className="mt-2 text-xl font-black sm:text-2xl md:text-3xl">
              {tool.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">{tool.description}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label={
            favorites.includes(tool.id)
              ? "นำออกจากรายการโปรด"
              : "เพิ่มในรายการโปรด"
          }
          onClick={() => toggleFavorite(tool.id)}
        >
          <Heart
            size={18}
            className={
              favorites.includes(tool.id) ? "fill-blue-400 text-blue-400" : ""
            }
          />
        </Button>
      </header>
      {content[tool.id]}
      <p className="mt-5 text-center text-xs text-muted-foreground">
        ข้อมูลในหน้านี้ประมวลผลภายใน browser และไม่ถูกบันทึก
      </p>
    </div>
  );
}
