import { createProxyRoute } from "@/lib/server/route-factory";

export const GET = createProxyRoute({
  protected: true,
  backendPath: "/api/admin/orders",
  forwardQuery: true,
});
