import { uiText } from "@/lib/ui-text";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Clipboard, Download } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/language";
import {
  cleanTextAndHtml,
  countCharacters,
  countWords,
  parseMarkdown,
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
  type LineSortMode,
  type MarkdownBlock,
  type ReverseMode,
} from "@/lib/tool-engines";

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
              {uiText("ดาวน์โหลด")}</Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
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

function MetricGrid({
  metrics,
}: {
  metrics: Array<[string, string | number]>;
}) {
  const { language } = useLanguage();
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {metrics.map(([label, value]) => (
        <Card key={label}>
          <CardContent className="p-4 sm:p-5">
            <strong className="block text-2xl text-primary sm:text-3xl">
              {typeof value === "number" ? value.toLocaleString(language === "en" ? "en-US" : "th-TH") : value}
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
  const stats = textStatistics(input);
  return (
    <div className="grid gap-5">
      <TextInputCard value={input} onChange={setInput} />
      <MetricGrid
        metrics={[
          ["คำ", stats.words],
          ["บรรทัด", stats.lines],
          ["ย่อหน้า", stats.paragraphs],
          ["เวลาอ่าน", stats.readingTimeMinutes ? `${stats.readingTimeMinutes} ${uiText("นาที")}` : `0 ${uiText("นาที")}`],
        ]}
      />
    </div>
  );
}

export function CharacterCountTool() {
  const [input, setInput] = useState("");
  return (
    <div className="grid gap-5">
      <TextInputCard value={input} onChange={setInput} />
      <MetricGrid metrics={[["ตัวอักษรทั้งหมด", countCharacters(input)], ["ไม่รวมช่องว่าง", countCharacters(input.replace(/\s/gu, ""))], ["คำ", countWords(input)]]} />
    </div>
  );
}

export function WhitespaceTool() {
  const [input, setInput] = useState("");
  return (
    <TwoCols>
      <TextInputCard value={input} onChange={setInput} />
      <TextOutput value={transformText(input, "collapse")} />
    </TwoCols>
  );
}

export function RemoveDuplicatesTool() {
  const [input, setInput] = useState("");
  return (
    <TwoCols>
      <TextInputCard value={input} onChange={setInput} placeholder={uiText("วางรายการทีละบรรทัด…")} />
      <TextOutput value={removeDuplicateLines(input)} />
    </TwoCols>
  );
}

export function SortLinesTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<LineSortMode>("az");
  const output = useMemo(() => sortLines(input, mode), [input, mode]);
  return (
    <TwoCols>
      <TextInputCard value={input} onChange={setInput} placeholder={uiText("วางข้อความทีละบรรทัด…")}>
        <Select value={mode} onChange={(event) => setMode(event.target.value as LineSortMode)}>
          <option value="az">A-Z</option>
          <option value="za">Z-A</option>
          <option value="numeric">{uiText("ตัวเลข")}</option>
          <option value="random">{uiText("สุ่มลำดับ")}</option>
        </Select>
      </TextInputCard>
      <TextOutput value={output} />
    </TwoCols>
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
            <Field label={uiText("ค้นหา")}><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={uiText("ข้อความที่ต้องการค้นหา")} /></Field>
            <Field label={uiText("แทนที่ด้วย")}><Input value={replacement} onChange={(event) => setReplacement(event.target.value)} placeholder={uiText("ข้อความใหม่")} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={caseSensitive} onChange={(event) => setCaseSensitive(event.target.checked)} />
            {uiText("แยกตัวพิมพ์เล็ก-ใหญ่")}</label>
          <Textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={uiText("วางข้อความที่ต้องการแก้ไข…")} />
        </CardContent>
      </Card>
      <TextOutput value={result.output} note={search ? `${uiText("พบ ")}${result.count.toLocaleString("en-US")} ${uiText("ตำแหน่ง")}` : uiText("พิมพ์คำค้นหาเพื่อดูจำนวนตำแหน่งที่พบ")} />
    </div>
  );
}

export function MarkdownTool() {
  const { language } = useLanguage();
  const sample = (lang: "th" | "en") => lang === "en"
    ? "# Hello, Markdown\n\nType **Markdown** on the left to see a safe preview."
    : "# สวัสดี Markdown\n\nพิมพ์ **Markdown** ทางซ้ายเพื่อดูตัวอย่างแบบปลอดภัย";
  const [input, setInput] = useState(() => sample(language));
  const previousLanguage = useRef(language);
  useEffect(() => {
    const previous = previousLanguage.current;
    setInput((current) => current === sample(previous) ? sample(language) : current);
    previousLanguage.current = language;
  }, [language]);
  const blocks = useMemo(() => parseMarkdown(input), [input]);
  return (
    <TwoCols>
      <TextInputCard value={input} onChange={setInput} title="Markdown" placeholder={uiText("# หัวข้อของคุณ…")} />
      <Card>
        <CardHeader><h2 className="font-bold">{uiText("ตัวอย่าง")}</h2></CardHeader>
        <CardContent><MarkdownPreview blocks={blocks} /></CardContent>
      </Card>
    </TwoCols>
  );
}

function MarkdownPreview({ blocks }: { blocks: MarkdownBlock[] }) {
  if (!blocks.length) return <p className="text-sm text-muted-foreground">{uiText("ตัวอย่างจะแสดงที่นี่")}</p>;
  return (
    <article className="prose max-w-none text-sm leading-7">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Tag = `h${block.level}` as "h1" | "h2" | "h3";
          return <Tag key={index} className="font-black">{renderInline(block.text, index)}</Tag>;
        }
        if (block.type === "paragraph") return <p key={index} className="whitespace-pre-wrap">{renderInline(block.text, index)}</p>;
        if (block.type === "quote") return <blockquote key={index} className="border-l-2 border-primary/50 pl-4 text-muted-foreground">{renderInline(block.text, index)}</blockquote>;
        if (block.type === "rule") return <hr key={index} className="border-border" />;
        if (block.type === "code") return <pre key={index} className="overflow-x-auto rounded-xl border border-border bg-background p-4 text-xs"><code>{block.text}</code></pre>;
        const List = block.ordered ? "ol" : "ul";
        return <List key={index} className="pl-6">{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, index * 100 + itemIndex)}</li>)}</List>;
      })}
    </article>
  );
}

function renderInline(text: string, keyBase: number): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+)/gu);
  return tokens.map((token, index) => {
    if (!token) return null;
    if (/^\*\*.+\*\*$/u.test(token) || /^__.+__$/u.test(token)) return <strong key={`${keyBase}-${index}`}>{token.slice(2, -2)}</strong>;
    if (/^`.+`$/u.test(token)) return <code key={`${keyBase}-${index}`} className="rounded bg-muted px-1.5 py-0.5 text-xs">{token.slice(1, -1)}</code>;
    const markdownLink = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/u);
    const href = markdownLink?.[2] ?? (token.startsWith("http://") || token.startsWith("https://") ? token : "");
    const label = markdownLink?.[1] ?? token;
    if (href && /^https?:\/\//iu.test(href)) return <a key={`${keyBase}-${index}`} href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">{label}</a>;
    return <span key={`${keyBase}-${index}`}>{token}</span>;
  });
}

export function SlugTool() {
  const [input, setInput] = useState("");
  return <TwoCols><TextInputCard value={input} onChange={setInput} /><TextOutput value={textToSlug(input)} label="Slug" /></TwoCols>;
}

export function RemoveEmptyLinesTool() {
  const [input, setInput] = useState("");
  return <TwoCols><TextInputCard value={input} onChange={setInput} placeholder={uiText("วางข้อความที่มีบรรทัดว่าง…")} /><TextOutput value={removeEmptyLines(input)} /></TwoCols>;
}

export function ReverseTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ReverseMode>("characters");
  return (
    <TwoCols>
      <TextInputCard value={input} onChange={setInput}>
        <Select value={mode} onChange={(event) => setMode(event.target.value as ReverseMode)}>
          <option value="characters">{uiText("กลับตัวอักษร")}</option>
          <option value="words">{uiText("กลับคำ")}</option>
          <option value="lines">{uiText("กลับบรรทัด")}</option>
        </Select>
      </TextInputCard>
      <TextOutput value={reverseText(input, mode)} />
    </TwoCols>
  );
}

export function KeyboardTool() {
  const [input, setInput] = useState("");
  return <TwoCols><TextInputCard value={input} onChange={setInput} placeholder={uiText("เช่น l;ylfu หรือ สวัสดี…")} /><TextOutput value={switchKeyboardLanguage(input)} label={uiText("ข้อความที่สลับภาษา")} /></TwoCols>;
}

export function MoneyTool() {
  const [input, setInput] = useState("");
  let output = "";
  let error = "";
  try { output = thaiMoneyToWords(input); } catch (cause) { error = cause instanceof Error ? cause.message : "อ่านจำนวนเงินไม่สำเร็จ"; }
  return <TwoCols><Card><CardHeader><h2 className="font-bold">{uiText("จำนวนเงิน")}</h2></CardHeader><CardContent><Input inputMode="decimal" value={input} onChange={(event) => setInput(event.target.value)} placeholder={uiText("เช่น 1,250.50")} /></CardContent></Card><TextOutput value={output} label={uiText("คำอ่านภาษาไทย")} error={input ? error : undefined} /></TwoCols>;
}

export function CleanTextTool() {
  const [input, setInput] = useState("");
  return <TwoCols><TextInputCard value={input} onChange={setInput} placeholder={uiText("วาง HTML หรือข้อความที่ต้องการล้าง…")} /><TextOutput value={cleanTextAndHtml(input)} /></TwoCols>;
}
