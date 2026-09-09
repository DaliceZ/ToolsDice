import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

const toolIds = [
  "text-transformer",
  "text-statistics",
  "text-diff",
  "timestamp-converter",
  "timezone-converter",
  "date-calculator",
  "json-toolkit",
  "json-yaml",
  "base64",
  "url-toolkit",
  "hash-uuid",
  "pdf-workspace",
] as const;

type ApiEnvelope<T> = {
  data: T | null;
  error: { code: string; message: string } | null;
  requestId: string;
};

const origins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const createApp = () =>
  new Elysia()
    .use(cors({ origin: origins, methods: ["GET", "OPTIONS"] }))
    .derive(({ request, set }) => {
      const requestId =
        request.headers.get("x-request-id") ?? crypto.randomUUID();
      set.headers["x-request-id"] = requestId;
      set.headers["x-content-type-options"] = "nosniff";
      set.headers["referrer-policy"] = "no-referrer";
      set.headers["permissions-policy"] =
        "camera=(), microphone=(), geolocation=()";
      set.headers["content-security-policy"] =
        "default-src 'none'; frame-ancestors 'none'";
      return { requestId };
    })
    .get(
      "/api/v1/health",
      ({ requestId }): ApiEnvelope<{ status: "ok"; timestamp: string }> => ({
        data: { status: "ok", timestamp: new Date().toISOString() },
        error: null,
        requestId,
      }),
    )
    .get(
      "/api/v1/config",
      ({
        requestId,
      }): ApiEnvelope<{
        appName: string;
        enabledToolIds: readonly string[];
        maxLocalFileBytes: number;
      }> => ({
        data: {
          appName: "ToolsDice",
          enabledToolIds: toolIds,
          maxLocalFileBytes: Number(
            process.env.MAX_LOCAL_FILE_BYTES ?? 104_857_600,
          ),
        },
        error: null,
        requestId,
      }),
    )
    .onError(({ code, set, requestId }) => {
      set.status = code === "NOT_FOUND" ? 404 : 500;
      return {
        data: null,
        error: {
          code,
          message:
            code === "NOT_FOUND"
              ? "ไม่พบ API ที่เรียก"
              : "เกิดข้อผิดพลาดภายในระบบ",
        },
        requestId:
          typeof requestId === "string" ? requestId : crypto.randomUUID(),
      };
    });
