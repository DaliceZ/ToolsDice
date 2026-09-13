export type ApiKeyValue = {
  enabled: boolean;
  key: string;
  value: string;
};

export function buildApiRequestUrl(input: string, params: readonly ApiKeyValue[]): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("ระบุ URL แบบเต็ม เช่น https://api.example.com/items");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("รองรับเฉพาะ URL ที่ขึ้นต้นด้วย http หรือ https");
  }
  for (const param of params) {
    const key = param.key.trim();
    if (param.enabled && key) url.searchParams.append(key, param.value);
  }
  return url.toString();
}

export function buildApiFormBody(fields: readonly ApiKeyValue[]): string {
  const body = new URLSearchParams();
  for (const field of fields) {
    const key = field.key.trim();
    if (field.enabled && key) body.append(key, field.value);
  }
  return body.toString();
}
