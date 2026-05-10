import { attachCsrfCookie } from "@/lib/server/csrf";
import { createProxyRoute } from "@/lib/server/route-factory";

export const GET = createProxyRoute({
  protected: true,
  backendPath: "/api/auth/me",
  onSuccess: ({ request, response }) => {
    attachCsrfCookie(response, request);
  },
});
