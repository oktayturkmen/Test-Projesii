import {
  AUTH_COOKIE_NAME,
  ONE_DAY_IN_SECONDS,
  authCookieOptions,
} from "@/lib/server/backend";
import { rotateCsrfCookie } from "@/lib/server/csrf";
import { createProxyRoute } from "@/lib/server/route-factory";
import { sanitizeAuthPayload } from "@/lib/server/sanitize";

export const PUT = createProxyRoute({
  protected: true,
  backendPath: "/api/auth/password",
  sanitize: sanitizeAuthPayload,
  // Backend invalidates the previous JWT and issues a fresh one in
  // `X-Auth-Token`. We re-set the auth cookie + rotate the CSRF cookie
  // because a privilege-changing operation (password rotation) should
  // never reuse credentials that may have been observed by an attacker.
  onSuccess: ({ response, backend }) => {
    if (!backend.token) {
      return;
    }

    response.cookies.set(
      AUTH_COOKIE_NAME,
      backend.token,
      authCookieOptions(ONE_DAY_IN_SECONDS)
    );
    rotateCsrfCookie(response);
  },
});
