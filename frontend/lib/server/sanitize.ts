import "server-only";

type ApiObject = Record<string, unknown>;

/**
 * Strip any `token` field that the backend may have surfaced on top-level or
 * inside `data`. Auth tokens MUST only travel via the `x-auth-token` response
 * header (which the proxy layer turns into a HttpOnly cookie). Leaking the
 * token through the JSON body would expose it to client-side JS and defeat
 * the entire HttpOnly cookie strategy.
 */
export function sanitizeAuthPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const sanitized = { ...(payload as ApiObject) };
  delete sanitized.token;

  if (sanitized.data && typeof sanitized.data === "object") {
    const data = { ...(sanitized.data as ApiObject) };
    delete data.token;
    sanitized.data = data;
  }

  return sanitized;
}

const TECHNICAL_ERROR_PATTERNS = [
  /SQLSTATE/i,
  /Connection:\s*\w+/i,
  /Connection refused/i,
  /\bmysql\b/i,
  /\bPDO\b/i,
  /\bIlluminate\\/i,
  /\bSymfony\\/i,
  /\bvendor\\/i,
  /\bstack trace\b/i,
];

function isTechnicalErrorMessage(message: string): boolean {
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Backend debug/infra failures must never be forwarded verbatim to the
 * browser. In local Laravel debug mode a DB outage can return messages like
 * `SQLSTATE[HY000] [2002]...`, which reveal internals and look broken to a
 * customer. The proxy is the last trusted boundary before the browser, so it
 * collapses 5xx/technical messages into a stable, user-facing response.
 */
export function sanitizeErrorPayload(payload: unknown, status: number): unknown {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const sanitized = { ...(payload as ApiObject) };
  const message = typeof sanitized.message === "string" ? sanitized.message : "";
  const shouldHideMessage = status >= 500 || isTechnicalErrorMessage(message);

  if (!shouldHideMessage) {
    return sanitized;
  }

  return {
    success: false,
    message: "Servis şu anda kullanılamıyor. Lütfen kısa bir süre sonra tekrar deneyin.",
    error_code: status >= 500 ? "service_unavailable" : "technical_error",
  };
}
