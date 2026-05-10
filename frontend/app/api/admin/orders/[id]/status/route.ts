import { createProxyRoute } from "@/lib/server/route-factory";

export const PATCH = createProxyRoute<{ id: string }>({
  protected: true,
  backendPath: ({ params }) => `/api/admin/orders/${encodeURIComponent(params.id)}/status`,
});
