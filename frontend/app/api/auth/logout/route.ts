import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/server/backend";
import { clearCsrfCookie } from "@/lib/server/csrf";
import { createProxyRoute } from "@/lib/server/route-factory";

export const POST = createProxyRoute({
  protected: true,
  backendPath: "/api/auth/logout",
  onResponse: ({ response }) => {
    response.cookies.set(AUTH_COOKIE_NAME, "", authCookieOptions(0));
    clearCsrfCookie(response);
  },
});
