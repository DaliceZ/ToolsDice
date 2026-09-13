export function base64Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64Decode(input: string): string {
  try {
    const binary = atob(input.replace(/\s/gu, ""));
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    );
  } catch {
    throw new Error("Base64 ไม่ถูกต้อง หรือข้อมูลไม่ใช่ข้อความ UTF-8");
  }
}
