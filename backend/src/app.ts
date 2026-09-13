import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

const toolIds = [
  "pdf-workspace",
  "pdf-text",
  "manage-pdf-pages",
  "pdf-metadata",
  "compress-pdf",
  "page-number-pdf",
  "add-watermark",
  "images-to-pdf",
  "pdf-to-images",
  "split-pdf",
  "text-word-count",
  "text-character-count",
  "text-transformer",
  "text-remove-duplicates",
  "text-sort-lines",
  "text-whitespace",
  "text-find-replace",
  "text-statistics",
  "text-diff",
  "text-markdown",
  "text-slug",
  "text-remove-empty",
  "text-reverse",
  "text-keyboard",
  "text-money",
  "text-clean",
  "image-resize",
  "image-crop",
  "image-compressor",
  "jpg-to-png",
  "png-to-jpg",
  "image-to-webp",
  "webp-to-png",
  "remove-image-metadata",
  "image-to-base64",
  "base64-to-image",
  "color-picker",
  "favicon-generator",
  "json-toolkit",
  "url-toolkit",
  "jwt-decoder",
  "regex-tester",
  "cron-helper",
  "sql-formatter",
  "html-beautifier",
  "css-beautifier",
  "javascript-beautifier",
  "html-minifier",
  "css-minifier",
  "javascript-minifier",
  "json-yaml",
  "base64",
  "timestamp-converter",
  "csv-json",
  "number-base-converter",
  "unit-converter",
  "csv-workspace",
  "checklist",
  "hash-uuid",
  "password-generator",
  "random-string-generator",
  "qr-generator",
  "lorem-generator",
  "random-number-generator",
  "timezone-converter",
  "date-calculator",
  "thai-year",
  "pomodoro",
  "split-bill",
  "bmi-tdee",
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
