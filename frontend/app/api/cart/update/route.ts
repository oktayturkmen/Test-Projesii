import { createProxyRoute } from "@/lib/server/route-factory";

export const PUT = createProxyRoute({
  protected: true,
  backendPath: "/api/cart/update",
});
