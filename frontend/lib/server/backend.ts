import "server-only";

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";
export const AUTH_COOKIE_NAME = "access_token";
export const CSRF_COOKIE_NAME = "csrf_token";
export const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

export function getBackendBaseUrl(): string {
  const configuredUrl = process.env.BACKEND_API_URL;

  if (process.env.NODE_ENV === "production" && !configuredUrl) {
    throw new Error("BACKEND_API_URL must be configured in production.");
  }

  return configuredUrl ?? DEFAULT_BACKEND_URL;
}

export function buildBackendUrl(path: string): string {
  return `${getBackendBaseUrl()}${path}`;
}

/**
 * Resolve the shared proxy secret for outbound backend requests.
 * Missing secrets fail closed in every environment instead of falling back
 * to a predictable shared value.
 */
export function getProxySecret(): string {
  const secret = process.env.BACKEND_PROXY_SECRET?.trim();

  if (secret && secret.length > 0) {
    return secret;
  }

  throw new Error("BACKEND_PROXY_SECRET must be configured.");
}

export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production" || process.env.AUTH_COOKIE_SECURE === "true",
    path: "/",
    maxAge,
  };
}

export function csrfCookieOptions(maxAge: number) {
  return {
    httpOnly: false,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production" || process.env.AUTH_COOKIE_SECURE === "true",
    path: "/",
    maxAge,
  };
}
