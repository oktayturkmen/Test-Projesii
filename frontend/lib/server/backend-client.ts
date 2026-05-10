import "server-only";

import { buildBackendUrl, getProxySecret } from "@/lib/server/backend";

export type BackendJsonResult = {
  ok: boolean;
  status: number;
  payload: unknown;
  token?: string;
};

export function errorPayload(message: string) {
  return {
    success: false,
    message,
  };
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return errorPayload("Backend JSON olmayan bir yanit dondu.");
  }

  try {
    return await response.json();
  } catch {
    return errorPayload("Backend yaniti okunamadi.");
  }
}

export async function proxyBackendJson({
  path,
  method = "GET",
  body,
  token,
  timeoutMs,
}: {
  path: string;
  method?: string;
  body?: string;
  token?: string;
  timeoutMs?: number;
}): Promise<BackendJsonResult> {
  try {
    // `getProxySecret` throws in production when the env var is unset, which
    // converts a silent 403 cascade into a single observable server error.
    const proxySecret = getProxySecret();
    const response = await fetch(buildBackendUrl(path), {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(proxySecret ? { "X-Proxy-Secret": proxySecret } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body && body.length > 0 ? body : undefined,
      cache: "no-store",
      signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
    });

    return {
      ok: response.ok,
      status: response.status,
      payload: await readJsonResponse(response),
      token: response.headers.get("x-auth-token") ?? undefined,
    };
  } catch {
    return {
      ok: false,
      status: 502,
      payload: errorPayload("Backend servisine ulasilamadi."),
    };
  }
}
