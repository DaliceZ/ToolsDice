import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Copy, LoaderCircle, Plus, Send, Trash2 } from "lucide-react";
import { ChoiceMenu, type Choice } from "@/components/ChoiceMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/language";
import { buildApiFormBody, buildApiRequestUrl, type ApiKeyValue } from "@/lib/tool-engines";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type AuthMode = "none" | "bearer" | "basic" | "api-key";
type ApiBodyMode = "none" | "json" | "text" | "form";
type Pair = ApiKeyValue & { id: number };
type ApiResponse = { status: number; statusText: string; durationMs: number; headers: string; body: string; truncated: boolean };

const methodChoices: Choice[] = ["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => ({ value: method, label: method, compact: method }));
const authChoices: Choice[] = [
  { value: "none", label: "No authentication", compact: "None" },
  { value: "bearer", label: "Bearer token", compact: "Bearer" },
  { value: "basic", label: "Basic authentication", compact: "Basic" },
  { value: "api-key", label: "API key", compact: "API key" },
];
const apiKeyPlacementChoices: Choice[] = [
  { value: "header", label: "Request header", compact: "Header" },
  { value: "query", label: "Query parameter", compact: "Query" },
];
const bodyChoices: Choice[] = [
  { value: "none", label: "No body", compact: "None" },
  { value: "json", label: "JSON", compact: "JSON" },
  { value: "text", label: "Raw text", compact: "Raw text" },
  { value: "form", label: "URL-encoded form", compact: "Form" },
];

export function ApiClient() {
  const { text } = useLanguage();
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("");
  const [params, setParams] = useState<Pair[]>([newPair(0)]);
  const [headers, setHeaders] = useState<Pair[]>([newPair(1)]);
  const [authMode, setAuthMode] = useState<AuthMode>("none");
  const [bearerToken, setBearerToken] = useState("");
  const [basicUsername, setBasicUsername] = useState("");
  const [basicPassword, setBasicPassword] = useState("");
  const [apiKeyName, setApiKeyName] = useState("X-API-Key");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [apiKeyPlacement, setApiKeyPlacement] = useState<"header" | "query">("header");
  const [bodyMode, setBodyMode] = useState<ApiBodyMode>("none");
  const [rawBody, setRawBody] = useState("");
  const [formFields, setFormFields] = useState<Pair[]>([newPair(2)]);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const nextPairId = useRef(3);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const curlCommand = useMemo(() => {
    try {
      const request = buildRequestParts({ method, url, params, headers, authMode, bearerToken, basicUsername, basicPassword, apiKeyName, apiKeyValue, apiKeyPlacement, bodyMode, rawBody, formFields });
      return toCurl(request.url, method, request.headers, request.body);
    } catch {
      return "";
    }
  }, [apiKeyName, apiKeyPlacement, apiKeyValue, authMode, basicPassword, basicUsername, bearerToken, bodyMode, formFields, headers, method, params, rawBody, url]);

  const send = async () => {
    setError("");
    setResponse(null);
    let request: ReturnType<typeof buildRequestParts>;
    try {
      request = buildRequestParts({ method, url, params, headers, authMode, bearerToken, basicUsername, basicPassword, apiKeyName, apiKeyValue, apiKeyPlacement, bodyMode, rawBody, formFields });
    } catch (cause) {
      setError(localizedRequestError(cause, text));
      return;
    }

    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    const startedAt = performance.now();
    setSending(true);
    try {
      const result = await fetch(request.url, {
        method,
        headers: request.headers,
        body: method === "GET" ? undefined : request.body,
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
      });
      const { body, truncated } = await readLimitedBody(result, 2 * 1024 * 1024);
      const contentType = result.headers.get("content-type") ?? "";
      const outputBody = contentType.includes("json") ? prettyJsonIfPossible(body) : body;
      const responseHeaders = [...result.headers.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}: ${value}`).join("\n");
      setResponse({ status: result.status, statusText: result.statusText, durationMs: Math.round(performance.now() - startedAt), headers: responseHeaders, body: outputBody, truncated });
    } catch {
      setError(controller.signal.aborted
        ? text("คำขอหมดเวลา หรือถูกยกเลิก", "Request timed out or was cancelled.")
        : text("ส่งคำขอไม่สำเร็จ ตรวจ URL การเชื่อมต่อ และนโยบาย CORS ของ API ปลายทาง", "Request failed. Check the URL, connection, and the API's CORS policy."));
    } finally {
      window.clearTimeout(timeout);
      if (controllerRef.current === controller) controllerRef.current = null;
      setSending(false);
    }
  };

  const cancel = () => controllerRef.current?.abort();
  const copyResponse = async () => {
    if (!response) return;
    try { await navigator.clipboard.writeText(response.body); setCopied(true); window.setTimeout(() => setCopied(false), 1400); }
    catch { setError(text("คัดลอกไม่ได้ กรุณาเลือกข้อความแล้วคัดลอกเอง", "Could not copy. Select the response text and copy it manually.")); }
  };
  const copyCurl = async () => {
    if (!curlCommand) return;
    try { await navigator.clipboard.writeText(curlCommand); setCurlCopied(true); window.setTimeout(() => setCurlCopied(false), 1400); }
    catch { setError(text("คัดลอกคำสั่งไม่ได้ กรุณาเลือกข้อความแล้วคัดลอกเอง", "Could not copy the cURL command. Select it and copy manually.")); }
  };

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(19rem,.9fr)]">
      <Card className="min-w-0">
        <CardHeader>
          <h2 className="font-bold">{text("สร้างคำขอ API", "Build an API request")}</h2>
          <p className="text-sm text-muted-foreground">{text("ข้อมูลจะถูกส่งเมื่อกดปุ่มส่งคำขอ และส่งไปยัง URL ที่คุณระบุเท่านั้น", "Request data is sent only after you choose Send, and only to the URL you enter.")}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid min-w-0 gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-end">
            <Field label={text("Method", "Method")}>
              <ChoiceMenu className="choice-field" label={text("HTTP method", "HTTP method")} value={method} icon={Activity} choices={methodChoices} onSelect={(next) => setMethod(next as HttpMethod)} />
            </Field>
            <Field label="URL">
              <Input value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !sending) void send(); }} placeholder="https://api.example.com/items" inputMode="url" autoCapitalize="none" autoCorrect="off" />
            </Field>
            {sending ? <Button variant="outline" onClick={cancel}><LoaderCircle className="animate-spin" size={16} />{text("ยกเลิก", "Cancel")}</Button> : <Button onClick={() => void send()}><Send size={16} />{text("ส่งคำขอ", "Send request")}</Button>}
          </div>

          <section className="space-y-3" aria-labelledby="api-params-heading">
            <SectionTitle id="api-params-heading" title={text("Query Params", "Query Params")} action={<AddButton label={text("เพิ่มพารามิเตอร์", "Add parameter")} onClick={() => setParams((current) => [...current, nextPair(nextPairId)])} />} />
            <PairEditor rows={params} onChange={setParams} keyLabel={text("ชื่อพารามิเตอร์", "Parameter name")} valueLabel={text("ค่า", "Value")} />
          </section>

          <section className="space-y-3" aria-labelledby="api-auth-heading">
            <SectionTitle id="api-auth-heading" title={text("Authorization", "Authorization")} />
            <Field label={text("รูปแบบการยืนยันตัวตน", "Authentication type")}>
              <ChoiceMenu className="choice-field" label={text("รูปแบบการยืนยันตัวตน", "Authentication type")} value={authMode} icon={Activity} choices={authChoices.map((choice) => ({ ...choice, label: text(authNameTh(choice.value), choice.label), compact: choice.value === "none" ? text("ไม่มี", "None") : choice.compact }))} onSelect={(next) => setAuthMode(next as AuthMode)} />
            </Field>
            {authMode === "bearer" && <Field label={text("Bearer token", "Bearer token")}><Input type="password" autoComplete="off" value={bearerToken} onChange={(event) => setBearerToken(event.target.value)} placeholder={text("ใส่ token", "Enter token")} /></Field>}
            {authMode === "basic" && <div className="grid min-w-0 gap-3 sm:grid-cols-2"><Field label={text("ชื่อผู้ใช้", "Username")}><Input autoComplete="off" value={basicUsername} onChange={(event) => setBasicUsername(event.target.value)} /></Field><Field label={text("รหัสผ่าน", "Password")}><Input type="password" autoComplete="new-password" value={basicPassword} onChange={(event) => setBasicPassword(event.target.value)} /></Field></div>}
            {authMode === "api-key" && <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><Field label={text("ชื่อ key", "Key name")}><Input value={apiKeyName} onChange={(event) => setApiKeyName(event.target.value)} placeholder="X-API-Key" /></Field><Field label={text("ค่า key", "Key value")}><Input type="password" autoComplete="off" value={apiKeyValue} onChange={(event) => setApiKeyValue(event.target.value)} /></Field><Field label={text("ส่ง key ใน", "Add key to")}><ChoiceMenu className="choice-field" label={text("ตำแหน่ง API key", "API key location")} value={apiKeyPlacement} icon={Activity} choices={apiKeyPlacementChoices} onSelect={(next) => setApiKeyPlacement(next as "header" | "query")} /></Field></div>}
            <p className="text-xs text-muted-foreground">{text("ข้อมูลยืนยันตัวตนอยู่ในหน่วยความจำของหน้านี้และจะไม่ถูกบันทึก", "Credentials stay in this page's memory and are not saved.")}</p>
          </section>

          <section className="space-y-3" aria-labelledby="api-headers-heading">
            <SectionTitle id="api-headers-heading" title={text("Headers", "Headers")} action={<AddButton label={text("เพิ่ม header", "Add header")} onClick={() => setHeaders((current) => [...current, nextPair(nextPairId)])} />} />
            <PairEditor rows={headers} onChange={setHeaders} keyLabel={text("ชื่อ header", "Header name")} valueLabel={text("ค่า", "Value")} />
          </section>

          <section className="space-y-3" aria-labelledby="api-body-heading">
            <SectionTitle id="api-body-heading" title={text("Body", "Body")} />
            <Field label={text("รูปแบบ body", "Body type")}>
              <ChoiceMenu className="choice-field" label={text("รูปแบบ body", "Body type")} value={bodyMode} icon={Activity} choices={bodyChoices.map((choice) => ({ ...choice, label: text(bodyNameTh(choice.value), choice.label), compact: choice.compact }))} onSelect={(next) => setBodyMode(next as ApiBodyMode)} />
            </Field>
            {method === "GET" && bodyMode !== "none" && <p className="text-xs text-muted-foreground">{text("GET จะไม่ส่ง body ตามมาตรฐานของ fetch ในเบราว์เซอร์", "GET requests do not send a body in browser fetch.")}</p>}
            {(bodyMode === "json" || bodyMode === "text") && <Textarea value={rawBody} onChange={(event) => setRawBody(event.target.value)} rows={8} spellCheck={false} placeholder={bodyMode === "json" ? '{\n  "name": "ToolsDice"\n}' : text("ใส่ข้อความใน body", "Enter the raw body text")} />}
            {bodyMode === "form" && <PairEditor rows={formFields} onChange={setFormFields} keyLabel={text("ชื่อ field", "Field name")} valueLabel={text("ค่า", "Value")} />}
          </section>

          {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <details className="rounded-xl border border-border bg-background p-3">
            <summary className="cursor-pointer font-semibold">{text("คำสั่ง cURL", "cURL command")}</summary>
            {curlCommand ? <div className="mt-3 space-y-2"><Textarea aria-label={text("คำสั่ง cURL", "cURL command")} value={curlCommand} readOnly rows={4} /><Button type="button" variant="outline" size="sm" onClick={() => void copyCurl()}><Copy size={15} />{curlCopied ? text("คัดลอกแล้ว", "Copied") : text("คัดลอก cURL", "Copy cURL")}</Button></div> : <p className="mt-2 text-sm text-muted-foreground">{text("ใส่ URL ที่ถูกต้องเพื่อสร้างคำสั่ง", "Enter a valid URL to build the command.")}</p>}
          </details>
          <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">{text("ส่งไปยังเซิร์ฟเวอร์ที่คุณระบุโดยตรง ไม่ส่งผ่าน backend ของ ToolsDice; ใช้เฉพาะ endpoint ที่คุณเชื่อถือ", "Requests go directly to your chosen server, never through the ToolsDice backend. Use endpoints you trust.")}</p>
        </CardContent>
      </Card>

      <Card className="min-w-0 self-start xl:sticky xl:top-4">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div><h2 className="font-bold">{text("Response", "Response")}</h2><p className="text-sm text-muted-foreground">{response ? `${response.durationMs} ms` : text("ผลตอบกลับจะแสดงหลังส่งคำขอ", "Response appears after you send a request.")}</p></div>
          {response && <Button size="icon" variant="outline" aria-label={copied ? text("คัดลอกแล้ว", "Copied") : text("คัดลอก response", "Copy response")} onClick={() => void copyResponse()}><Copy size={16} /></Button>}
        </CardHeader>
        <CardContent className="space-y-3">
          {response ? <>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-3"><span className={response.status < 400 ? "rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-300" : "rounded-full bg-destructive/10 px-3 py-1 text-sm font-bold text-destructive"}>{response.status} {response.statusText}</span><span className="text-sm text-muted-foreground">{response.durationMs} ms</span></div>
            {response.truncated && <p className="text-xs text-muted-foreground">{text("แสดง response สูงสุด 2 MB", "Response preview is limited to 2 MB.")}</p>}
            <Textarea aria-label={text("Response body", "Response body")} value={response.body} readOnly rows={14} className="font-mono text-xs" />
            <details className="rounded-xl border border-border bg-background p-3"><summary className="cursor-pointer font-semibold">{text("Response headers", "Response headers")}</summary><pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-all text-xs">{response.headers || text("ไม่มี header", "No headers")}</pre></details>
          </> : <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground"><p>{text("ตั้งค่าคำขอ แล้วกด “ส่งคำขอ” เมื่อพร้อม", "Configure your request, then choose Send request when ready.")}</p></div>}
        </CardContent>
      </Card>
    </div>
  );
}

function PairEditor({ rows, onChange, keyLabel, valueLabel }: { rows: Pair[]; onChange: (rows: Pair[]) => void; keyLabel: string; valueLabel: string }) {
  const { text } = useLanguage();
  return <div className="space-y-2">
    {rows.length === 0 && <p className="text-sm text-muted-foreground">{text("ยังไม่มีรายการ · กดเพิ่มเพื่อเริ่ม", "No rows yet. Add one to start.")}</p>}
    {rows.map((row, index) => <div className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-center gap-2" key={row.id}>
      <input className="size-4 justify-self-center accent-[var(--primary)]" type="checkbox" checked={row.enabled} aria-label={`${text("เปิดใช้แถว", "Enable row")} ${index + 1}`} onChange={(event) => onChange(rows.map((current) => current.id === row.id ? { ...current, enabled: event.target.checked } : current))} />
      <Input aria-label={`${keyLabel} ${index + 1}`} autoCapitalize="none" autoCorrect="off" value={row.key} onChange={(event) => onChange(rows.map((current) => current.id === row.id ? { ...current, key: event.target.value } : current))} placeholder={keyLabel} />
      <Input aria-label={`${valueLabel} ${index + 1}`} value={row.value} onChange={(event) => onChange(rows.map((current) => current.id === row.id ? { ...current, value: event.target.value } : current))} placeholder={valueLabel} />
      <Button type="button" size="icon" variant="ghost" aria-label={`${text("ลบแถว", "Remove row")} ${index + 1}`} onClick={() => onChange(rows.filter((current) => current.id !== row.id))}><Trash2 size={15} /></Button>
    </div>)}
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>;
}

function SectionTitle({ id, title, action }: { id: string; title: string; action?: React.ReactNode }) {
  return <div className="flex min-w-0 items-center justify-between gap-2"><h3 id={id} className="font-bold">{title}</h3>{action}</div>;
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button type="button" variant="outline" size="sm" onClick={onClick}><Plus size={15} />{label}</Button>;
}

function nextPair(counter: React.MutableRefObject<number>): Pair {
  const id = counter.current++;
  return { id, enabled: true, key: "", value: "" };
}

function newPair(id: number): Pair {
  return { id, enabled: true, key: "", value: "" };
}

function buildRequestParts(input: {
  method: HttpMethod;
  url: string;
  params: Pair[];
  headers: Pair[];
  authMode: AuthMode;
  bearerToken: string;
  basicUsername: string;
  basicPassword: string;
  apiKeyName: string;
  apiKeyValue: string;
  apiKeyPlacement: "header" | "query";
  bodyMode: ApiBodyMode;
  rawBody: string;
  formFields: Pair[];
}) {
  const query = [...input.params];
  const requestHeaders = new Headers();
  for (const header of input.headers) {
    if (header.enabled && header.key.trim()) requestHeaders.append(header.key.trim(), header.value);
  }
  if (input.authMode === "bearer" && input.bearerToken.trim()) requestHeaders.set("Authorization", `Bearer ${input.bearerToken.trim()}`);
  if (input.authMode === "basic" && (input.basicUsername || input.basicPassword)) requestHeaders.set("Authorization", `Basic ${utf8Base64(`${input.basicUsername}:${input.basicPassword}`)}`);
  if (input.authMode === "api-key" && input.apiKeyName.trim() && input.apiKeyValue) {
    if (input.apiKeyPlacement === "header") requestHeaders.set(input.apiKeyName.trim(), input.apiKeyValue);
    else query.push({ id: -1, enabled: true, key: input.apiKeyName, value: input.apiKeyValue });
  }
  let body: string | undefined;
  if (input.bodyMode === "json") {
    try { JSON.parse(input.rawBody); }
    catch { throw new Error("ตรวจ JSON ใน body อีกครั้งก่อนส่ง"); }
    body = input.rawBody;
    if (!requestHeaders.has("content-type")) requestHeaders.set("Content-Type", "application/json");
  } else if (input.bodyMode === "text") {
    body = input.rawBody;
    if (!requestHeaders.has("content-type")) requestHeaders.set("Content-Type", "text/plain;charset=UTF-8");
  } else if (input.bodyMode === "form") {
    body = buildApiFormBody(input.formFields);
    if (!requestHeaders.has("content-type")) requestHeaders.set("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
  }
  if (input.method === "GET") body = undefined;
  return { url: buildApiRequestUrl(input.url, query), headers: requestHeaders, body };
}

function toCurl(url: string, method: HttpMethod, headers: Headers, body?: string) {
  const parts = ["curl", "--request", shellQuote(method), shellQuote(url)];
  headers.forEach((value, key) => { parts.push("--header", shellQuote(`${key}: ${value}`)); });
  if (body !== undefined) parts.push("--data-raw", shellQuote(body));
  return parts.join(" ");
}

function shellQuote(value: string) {
  return `'${value.replace(/'/gu, "'\\''")}'`;
}

function utf8Base64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function readLimitedBody(response: Response, limit: number) {
  if (!response.body) return { body: "", truncated: false };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = limit - total;
    if (value.byteLength > remaining) {
      if (remaining > 0) chunks.push(value.slice(0, remaining));
      total = limit;
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
    total += value.byteLength;
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.byteLength; }
  return { body: new TextDecoder().decode(output), truncated };
}

function prettyJsonIfPossible(body: string) {
  try { return JSON.stringify(JSON.parse(body) as unknown, null, 2); }
  catch { return body; }
}

function authNameTh(value: string) {
  const labels: Record<string, string> = { none: "ไม่ใช้", bearer: "Bearer token", basic: "Basic authentication", "api-key": "API key" };
  return labels[value] ?? value;
}

function bodyNameTh(value: string) {
  const labels: Record<string, string> = { none: "ไม่มี body", json: "JSON", text: "ข้อความดิบ", form: "แบบฟอร์ม URL-encoded" };
  return labels[value] ?? value;
}

function localizedRequestError(cause: unknown, text: (thai: string, english: string) => string) {
  const message = cause instanceof Error ? cause.message : "";
  if (message.includes("URL แบบเต็ม")) return text("ระบุ URL แบบเต็ม เช่น https://api.example.com/items", "Enter a full URL, such as https://api.example.com/items.");
  if (message.includes("http หรือ https")) return text("รองรับเฉพาะ URL ที่ขึ้นต้นด้วย http หรือ https", "Only http and https URLs are supported.");
  if (message.includes("JSON ใน body")) return text("ตรวจ JSON ใน body อีกครั้งก่อนส่ง", "Check the request body. It must contain valid JSON.");
  return text("ตรวจ URL, header และข้อมูลคำขออีกครั้ง", "Check the URL, headers, and request fields.");
}
