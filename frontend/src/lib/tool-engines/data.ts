export function formatJson(
  input: string,
  minify = false,
  options: { sortKeys?: boolean; indent?: 2 | 4 } = {},
): string {
  if (!input.trim()) return "";
  const parsed = parseJson(input);
  return JSON.stringify(
    options.sortKeys ? sortJsonKeys(parsed) : parsed,
    null,
    minify ? 0 : (options.indent ?? 2),
  );
}

export function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right, "en"))
      .map(([key, child]) => [key, sortJsonKeys(child)]),
  );
}

function parseJson(input: string): unknown {
  try {
    return JSON.parse(input) as unknown;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "";
    const position = message.match(/position\s+(\d+)/iu)?.[1];
    const index = position ? Number(position) : -1;
    const prefix = index >= 0 ? input.slice(0, index) : "";
    const location = index >= 0
      ? ` บรรทัด ${prefix.split("\n").length} คอลัมน์ ${prefix.length - prefix.lastIndexOf("\n")}`
      : "";
    throw new Error(`JSON ไม่ถูกต้อง${location} กรุณาตรวจวงเล็บ เครื่องหมายคำพูด และ comma`);
  }
}

export async function convertStructured(
  input: string,
  direction: "json-to-yaml" | "yaml-to-json",
): Promise<string> {
  if (!input.trim()) return "";
  const yaml = await import("yaml");
  try {
    return direction === "json-to-yaml"
      ? yaml.stringify(parseJson(input), { indent: 2 })
      : JSON.stringify(yaml.parse(input) as unknown, null, 2);
  } catch (cause) {
    if (direction === "json-to-yaml") throw cause;
    throw new Error("YAML ไม่ถูกต้อง กรุณาตรวจ indentation, colon และเครื่องหมายคำพูด");
  }
}

export function base64Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function base64Decode(input: string): string {
  try {
    const normalized = input.replace(/\s/g, "");
    const binary = atob(normalized);
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(binary, (char) => char.charCodeAt(0)),
    );
  } catch {
    throw new Error("Base64 ไม่ถูกต้อง หรือข้อมูลไม่ใช่ข้อความ UTF-8");
  }
}

export function parseQuery(input: string): string {
  const query = input.includes("?")
    ? input.slice(input.indexOf("?") + 1)
    : input.replace(/^\?/u, "");
  const params = new URLSearchParams(query);
  return JSON.stringify(
    Array.from(params.entries()).map(([key, value]) => ({ key, value })),
    null,
    2,
  );
}

export function parseUrlComponents(input: string): {
  href: string;
  protocol: string;
  username: string;
  hostname: string;
  port: string;
  pathname: string;
  searchParams: Array<{ key: string; value: string }>;
  hash: string;
} {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("URL ไม่ถูกต้อง กรุณาใส่ URL ที่มี protocol เช่น https://example.com");
  }
  return {
    href: url.href,
    protocol: url.protocol,
    username: url.username,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    searchParams: Array.from(url.searchParams, ([key, value]) => ({ key, value })),
    hash: url.hash,
  };
}

export function decodeUrlComponent(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    throw new Error("URL encoding ไม่ถูกต้อง กรุณาตรวจรูปแบบ %xx แล้วลองอีกครั้ง");
  }
}

export function buildQuery(input: string): string {
  let rows: unknown;
  try {
    rows = JSON.parse(input) as unknown;
  } catch {
    throw new Error("JSON สำหรับ Query ไม่ถูกต้อง กรุณาตรวจวงเล็บและ comma");
  }
  if (
    !Array.isArray(rows) ||
    !rows.every(
      (row) =>
        row &&
        typeof row === "object" &&
        "key" in row &&
        "value" in row,
    )
  ) {
    throw new Error("ใส่ JSON array ของรายการ key และ value เช่น [{\"key\":\"q\",\"value\":\"คำค้น\"}]");
  }
  const params = new URLSearchParams();
  for (const row of rows as Array<{ key: unknown; value: unknown }>)
    params.append(String(row.key), String(row.value));
  return params.toString();
}
