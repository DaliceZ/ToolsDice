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
  "text-keyboard",
  "text-find-replace",
  "text-diff",
  "text-money",
  "text-reverse",
  "text-word-count",
  "text-remove-duplicates",
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
  "api-client",
  "jwt-decoder",
  "regex-tester",
  "code-formatter",
  "currency-converter",
  "thai-year",
  "unit-converter",
  "number-base-converter",
  "base64",
  "qr-generator",
  "random-number-generator",
  "password-generator",
  "random-picker",
  "hash-uuid",
  "random-string-generator",
  "lorem-generator",
  "date-calculator",
  "timezone-converter",
  "split-bill",
  "bmi-tdee",
  "loan-calculator",
  "savings-calculator",
  "trip-cost-calculator",
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

export const createApp = (app = new Elysia()) =>
  app
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
