import { uiText } from "@/lib/ui-text";
import { useRef, useState } from "react";
import { Check, Download, FileJson2, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/language";
import {
  parseChecklistJson,
  serializeChecklist,
  validateChecklistFileSize,
  type ChecklistItem,
} from "@/lib/checklist";

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ChecklistTool() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const completed = items.filter((item) => item.done).length;

  const addItem = () => {
    const text = value.trim();
    if (!text) {
      setError("พิมพ์รายการก่อนเพิ่มลง Checklist");
      setMessage("");
      return;
    }
    if (text.length > 500) {
      setError("รายการต้องมีความยาวไม่เกิน 500 ตัวอักษร");
      setMessage("");
      return;
    }
    if (items.length >= 500) {
      setError("Checklist มีได้ไม่เกิน 500 รายการ");
      setMessage("");
      return;
    }
    setItems((current) => [...current, { id: newId(), text, done: false }]);
    setValue("");
    setError("");
    setMessage("");
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      validateChecklistFileSize(file.size);
      if (file.type && file.type !== "application/json" && !file.name.toLowerCase().endsWith(".json"))
        throw new Error("รองรับเฉพาะไฟล์ .json");
      const next = parseChecklistJson(await file.text());
      setItems(next);
      setError("");
      setMessage(language === "en" ? `Imported ${next.length} items.` : `นำเข้าแล้ว ${next.length} รายการ`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "นำเข้า Checklist ไม่สำเร็จ");
      setMessage("");
    }
  };

  const exportFile = () => {
    const blob = new Blob([serializeChecklist(items)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "toolsdice-checklist.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setError("");
    setMessage("ดาวน์โหลด Checklist JSON แล้ว");
  };

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">{uiText("รายการของฉัน")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {uiText("รายการอยู่ในหน้านี้ชั่วคราว ปิดหน้าแล้วรายการจะหายไป")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={(event) => {
              void importFile(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload size={16} />
            {uiText("นำเข้า JSON")}</Button>
          <Button variant="outline" onClick={exportFile}>
            <Download size={16} />
            {uiText("ส่งออก JSON")}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            aria-label={uiText("รายการใหม่")}
            value={value}
            maxLength={500}
            placeholder={uiText("เพิ่มรายการที่ต้องทำ…")}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addItem();
            }}
          />
          <Button className="min-h-11 shrink-0" onClick={addItem} aria-label={uiText("เพิ่มรายการ")}>
            <Plus size={17} />
            {uiText("เพิ่ม")}</Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 text-sm">
          <span aria-live="polite" className="text-muted-foreground">
            {language === "en" ? `${completed} of ${items.length} complete` : `ทำครบ ${completed} จาก ${items.length} รายการ`}</span>
          {items.some((item) => item.done) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItems((current) => current.filter((item) => !item.done))}
            >
              {uiText("ลบรายการที่เสร็จแล้ว")}</Button>
          )}
        </div>

        {items.length ? (
          <ul className="space-y-1" aria-label="Checklist">
            {items.map((item) => (
              <li key={item.id} className="flex min-h-12 items-center gap-2 rounded-xl px-2 hover:bg-muted">
                <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry))}
                    className="size-6 shrink-0 accent-primary"
                    aria-label={`${uiText(item.done ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว")}: ${item.text}`}
                  />
                  <span className={item.done ? "break-words text-sm text-muted-foreground line-through" : "break-words text-sm"}>
                    {item.text}
                  </span>
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0"
                  aria-label={`${uiText("ลบรายการ")} ${item.text}`}
                  onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                >
                  <Trash2 size={16} />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <FileJson2 aria-hidden="true" className="mx-auto mb-2 text-muted-foreground" size={22} />
            <p className="text-sm font-medium">{uiText("ยังไม่มีรายการ")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{uiText("เพิ่มรายการ หรือเลือกไฟล์ JSON ที่ต้องการนำเข้า")}</p>
          </div>
        )}

        {error && <p role="alert" className="inline-status error">{uiText(error)}</p>}
        {message && <p role="status" className="inline-status success"><Check size={16} />{uiText(message)}</p>}
      </CardContent>
    </Card>
  );
}
