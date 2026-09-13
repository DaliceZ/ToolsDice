import { useQuery } from "@tanstack/react-query";
import { tools, type ToolId } from "./tool-registry";

export type RuntimeConfig = {
  appName: string;
  enabledToolIds: ToolId[];
  maxLocalFileBytes: number;
};
type Envelope<T> = {
  data: T | null;
  error: { code: string; message: string } | null;
  requestId: string;
};

export const fallbackConfig: RuntimeConfig = {
  appName: "ToolsDice",
  enabledToolIds: tools.map((tool) => tool.id),
  maxLocalFileBytes: Number(
    import.meta.env.VITE_MAX_LOCAL_FILE_BYTES ?? 104_857_600,
  ),
};

export async function fetchRuntimeConfig(): Promise<RuntimeConfig> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE ?? "/api"}/v1/config`,
    { signal: AbortSignal.timeout(2500) },
  );
  if (!response.ok) throw new Error("API unavailable");
  const envelope = (await response.json()) as Envelope<RuntimeConfig>;
  if (!envelope.data)
    throw new Error(envelope.error?.message ?? "Invalid API response");
  return envelope.data;
}

export function useRuntimeConfig() {
  const query = useQuery({
    queryKey: ["runtime-config"],
    queryFn: fetchRuntimeConfig,
    staleTime: 300_000,
    retry: 1,
  });
  return { config: query.data ?? fallbackConfig, offline: query.isError };
}
