import { createProxyRoute } from "@/lib/server/route-factory";

export const POST = createProxyRoute({
  protected: true,
  backendPath: "/api/cart/add",
});
