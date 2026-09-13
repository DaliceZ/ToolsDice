import { useMemo, useState, type ReactNode } from "react";
import { ArrowDownUp, Check, Clipboard, Download } from "lucide-react";
import { ChoiceMenu, type Choice } from "@/components/ChoiceMenu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/language";
import {
  replaceText,
  removeDuplicateLines,
  reverseText,
  switchKeyboardLanguage,
  textStatistics,
  thaiMoneyToWords,
  type ReverseMode,
} from "@/lib/tool-engines";
import { uiText } from "@/lib/ui-text";

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
        {hint && <span className="font-normal text-muted-foreground">{uiText(hint)}</span>}
      </span>
      {children}
    </label>
  );
}

function TwoCols({ children }: { children: ReactNode }) {
  return <div className="workspace-two-col">{children}</div>;
}

function TextOutput({
  value,
  label = "ผลลัพธ์",
  note,
  error,
}: {
  value: string;
  label?: string;
  note?: ReactNode;
  error?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  const download = () => {
    if (!value) return;
    const url = URL.createObjectURL(new Blob([value], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "toolsdice-text.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Card className="output-card">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold">{uiText(label)}</h2>
        {value && (
          <div className="flex gap-2">
            <Button size="sm" onClick={copy}>
              {copied ? <Check size={15} /> : <Clipboard size={15} />}
              {copied ? uiText("คัดลอกแล้ว") : uiText("คัดลอก")}
            </Button>
            <Button size="sm" variant="outline" onClick={download}>
              <Download size={15} />
              {uiText("ดาวน์โหลด")}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
            {uiText(error)}
          </p>
        ) : (
          <Textarea aria-label={uiText(label)} value={value} readOnly placeholder={uiText("ผลลัพธ์จะแสดงที่นี่")} />
        )}
        {note && <div className="mt-3 text-sm text-muted-foreground">{note}</div>}
      </CardContent>
    </Card>
  );
}

function MetricGrid({ metrics }: { metrics: Array<[string, number]> }) {
  const { language } = useLanguage();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map(([label, value]) => (
        <Card key={label}>
          <CardContent className="p-4 sm:p-5">
            <strong className="block text-2xl text-primary sm:text-3xl">
              {value.toLocaleString(language === "en" ? "en-US" : "th-TH")}
            </strong>
            <span className="text-sm text-muted-foreground">{uiText(label)}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TextInputCard({
  value,
  onChange,
  title = "ข้อความ",
  placeholder = "เริ่มพิมพ์หรือวางข้อความ…",
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  placeholder?: string;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold">{uiText(title)}</h2>
        {children}
      </CardHeader>
      <CardContent>
        <Textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={uiText(placeholder)} />
      </CardContent>
    </Card>
  );
}

export function WordCountTool() {
  const [input, setInput] = useState("");
  const stats = useMemo(() => textStatistics(input), [input]);
  return (
    <div className="grid gap-5">
      <TextInputCard value={input} onChange={setInput} />
      <MetricGrid
        metrics={[
          ["คำ", stats.words],
          ["ตัวอักษร", stats.characters],
          ["ตัวอักษรไม่รวมช่องว่าง", stats.charactersNoSpaces],
        ]}
      />
    </div>
  );
}

export function FindReplaceTool() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(true);
  const result = useMemo(() => replaceText(input, search, replacement, caseSensitive), [input, search, replacement, caseSensitive]);
  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader><h2 className="font-bold">{uiText("ค้นหาและแทนที่")}</h2></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ค้นหา"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={uiText("ข้อความที่ต้องการค้นหา")} /></Field>
            <Field label="แทนที่ด้วย"><Input value={replacement} onChange={(event) => setReplacement(event.target.value)} placeholder={uiText("ข้อความใหม่")} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={caseSensitive} onChange={(event) => setCaseSensitive(event.target.checked)} />
            {uiText("แยกตัวพิมพ์เล็ก-ใหญ่")}
          </label>
          <Textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={uiText("วางข้อความที่ต้องการแก้ไข…")} />
        </CardContent>
      </Card>
      <TextOutput value={result.output} note={search ? `${uiText("พบ ")}${result.count.toLocaleString("en-US")} ${uiText("ตำแหน่ง")}` : uiText("พิมพ์คำค้นหาเพื่อดูจำนวนตำแหน่งที่พบ")} />
    </div>
  );
}

export function RemoveDuplicatesTool() {
  const { language } = useLanguage();
  const [input, setInput] = useState("");
  const output = useMemo(() => removeDuplicateLines(input), [input]);
  const removedCount = input
    ? input.split(/\r?\n/u).length - new Set(input.split(/\r?\n/u)).size
    : 0;
  const note = language === "en"
    ? `${removedCount.toLocaleString("en-US")} duplicate ${removedCount === 1 ? "line" : "lines"} removed; original order is preserved.`
    : `ลบบรรทัดซ้ำแล้ว ${removedCount.toLocaleString("th-TH")} บรรทัด โดยคงลำดับเดิม`;

  return (
    <TwoCols>
      <TextInputCard value={input} onChange={setInput} placeholder={uiText("วางรายการทีละบรรทัด…")} />
      <TextOutput value={output} label="ข้อความหลังลบบรรทัดซ้ำ" note={input ? note : undefined} />
    </TwoCols>
  );
}

export function ReverseTool() {
  const { text } = useLanguage();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ReverseMode>("characters");
  const choices: Choice[] = [
    { value: "characters", label: text("กลับตัวอักษร", "Reverse characters"), compact: text("ตัวอักษร", "Characters") },
    { value: "words", label: text("กลับคำ", "Reverse words"), compact: text("คำ", "Words") },
    { value: "lines", label: text("กลับบรรทัด", "Reverse lines"), compact: text("บรรทัด", "Lines") },
  ];
  return (
    <TwoCols>
      <TextInputCard value={input} onChange={setInput}>
        <ChoiceMenu
          label={text("ลำดับการกลับข้อความ", "Reverse mode")}
          value={mode}
          icon={ArrowDownUp}
          choices={choices}
          onSelect={(next) => setMode(next as ReverseMode)}
        />
      </TextInputCard>
      <TextOutput value={reverseText(input, mode)} />
    </TwoCols>
  );
}

export function KeyboardTool() {
  const [input, setInput] = useState("");
  return (
    <TwoCols>
      <TextInputCard value={input} onChange={setInput} placeholder="เช่น l;ylfu หรือ สวัสดี…" />
      <TextOutput value={switchKeyboardLanguage(input)} label="ข้อความที่สลับภาษา" />
    </TwoCols>
  );
}

export function MoneyTool() {
  const [input, setInput] = useState("");
  let output = "";
  let error = "";
  try {
    output = thaiMoneyToWords(input);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "อ่านจำนวนเงินไม่สำเร็จ";
  }
  return (
    <TwoCols>
      <Card>
        <CardHeader><h2 className="font-bold">{uiText("จำนวนเงิน")}</h2></CardHeader>
        <CardContent><Input inputMode="decimal" value={input} onChange={(event) => setInput(event.target.value)} placeholder={uiText("เช่น 1,250.50")} /></CardContent>
      </Card>
      <TextOutput value={output} label="คำอ่านภาษาไทย" error={input ? error : undefined} />
    </TwoCols>
  );
}
