import { createProxyRoute } from "@/lib/server/route-factory";
import { sanitizeAuthPayload } from "@/lib/server/sanitize";

export const PATCH = createProxyRoute({
  protected: true,
  backendPath: "/api/auth/profile",
  sanitize: sanitizeAuthPayload,
});
