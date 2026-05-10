import { createProxyRoute } from "@/lib/server/route-factory";

export const GET = createProxyRoute({
  protected: false,
  backendPath: "/api/products",
  forwardQuery: true,
});

// Admin-only on the backend (jwt.auth + admin.access). Auth/CSRF cookies are
// handled by `protected: true` -> proxyProtectedJson, so the proxy stays in
// charge of credential isolation while the backend stays in charge of
// authorization.
export const POST = createProxyRoute({
  protected: true,
  backendPath: "/api/products",
});
