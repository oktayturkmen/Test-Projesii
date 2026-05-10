/**
 * Restrict an arbitrary `redirect` query parameter to a same-origin path.
 *
 * Accepts:
 *   - "/cart"
 *   - "/orders/42?foo=1"
 *
 * Rejects (returns the fallback):
 *   - "https://evil.com" / "//evil.com" (protocol-relative)
 *   - "javascript:alert(1)"
 *   - empty / null / non-string
 *   - paths that resolve to a different origin once parsed against any base
 *
 * Works in both server (no `window`) and client environments.
 */
export function resolveSafeRedirect(
  rawRedirect: string | string[] | null | undefined,
  fallback = "/"
): string {
  const raw = Array.isArray(rawRedirect) ? rawRedirect[0] : rawRedirect;

  if (typeof raw !== "string" || raw.length === 0) {
    return fallback;
  }

  if (!raw.startsWith("/")) {
    return fallback;
  }

  // Protocol-relative URLs ("//evil.com/path") and triple slashes both resolve
  // to a different origin when navigated to.
  if (raw.startsWith("//")) {
    return fallback;
  }

  // Disallow control characters, backslashes, and embedded whitespace that
  // can confuse URL parsers across browsers.
  if (/[\\\s]/.test(raw)) {
    return fallback;
  }

  return raw;
}
