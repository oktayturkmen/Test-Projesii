import { AUTH_COOKIE_NAME, ONE_DAY_IN_SECONDS, authCookieOptions } from "@/lib/server/backend";
import { rotateCsrfCookie } from "@/lib/server/csrf";
import { createProxyRoute } from "@/lib/server/route-factory";
import { sanitizeAuthPayload } from "@/lib/server/sanitize";

export const POST = createProxyRoute({
  protected: false,
  backendPath: "/api/auth/register",
  sanitize: sanitizeAuthPayload,
  onSuccess: ({ response, backend }) => {
    if (!backend.token) {
      return;
    }

    response.cookies.set(
      AUTH_COOKIE_NAME,
      backend.token,
      authCookieOptions(ONE_DAY_IN_SECONDS)
    );
    // Always rotate the CSRF cookie on a privilege transition; an attacker
    // could have planted the previous value before authentication.
    rotateCsrfCookie(response);
  },
});
