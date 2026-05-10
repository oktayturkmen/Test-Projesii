import { createProxyRoute } from "@/lib/server/route-factory";

export const GET = createProxyRoute({
  protected: true,
  backendPath: "/api/orders",
  forwardQuery: true,
});

export const POST = createProxyRoute({
  protected: true,
  backendPath: "/api/orders",
});
