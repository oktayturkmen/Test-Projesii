import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { CSRF_COOKIE_NAME, ONE_DAY_IN_SECONDS, csrfCookieOptions } from "@/lib/server/backend";

const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_BYTES = 32;

export function createCsrfToken(): string {
  // 256-bit token via Web Crypto; UUID v4 only carries ~122 bits of entropy.
  const bytes = new Uint8Array(CSRF_TOKEN_BYTES);
  crypto.getRandomValues(bytes);

  // Base64url, URL-safe and cookie-friendly.
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Idempotent attach: reuses the existing token if the request already carries
 * one. Use this for read-only flows (e.g. /auth/me hydration) where the user
 * is just keeping their CSRF cookie warm.
 */
export function attachCsrfCookie(response: NextResponse, request?: NextRequest): void {
  const existingToken = request?.cookies.get(CSRF_COOKIE_NAME)?.value;

  response.cookies.set(
    CSRF_COOKIE_NAME,
    existingToken && existingToken.length > 0 ? existingToken : createCsrfToken(),
    csrfCookieOptions(ONE_DAY_IN_SECONDS)
  );
}

/**
 * Forces a brand new CSRF token regardless of any cookie sent by the client.
 * Must be called on every privilege transition (login/register success) to
 * defeat session-fixation style attacks where an attacker pre-seeds the
 * victim's CSRF cookie.
 */
export function rotateCsrfCookie(response: NextResponse): void {
  response.cookies.set(
    CSRF_COOKIE_NAME,
    createCsrfToken(),
    csrfCookieOptions(ONE_DAY_IN_SECONDS)
  );
}

export function clearCsrfCookie(response: NextResponse): void {
  response.cookies.set(CSRF_COOKIE_NAME, "", csrfCookieOptions(0));
}

export function isCsrfValid(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value ?? "";
  const headerToken = request.headers.get(CSRF_HEADER_NAME) ?? "";

  return cookieToken.length > 0 && headerToken.length > 0 && cookieToken === headerToken;
}
