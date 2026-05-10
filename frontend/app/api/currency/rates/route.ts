import { createProxyRoute } from "@/lib/server/route-factory";

export const GET = createProxyRoute({
  protected: false,
  backendPath: "/api/currency/rates",
  forwardQuery: true,
});
