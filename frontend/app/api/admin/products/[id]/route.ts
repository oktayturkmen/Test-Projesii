import { createProxyRoute } from "@/lib/server/route-factory";

export const GET = createProxyRoute<{ id: string }>({
  protected: true,
  backendPath: ({ params }) => `/api/admin/products/${encodeURIComponent(params.id)}`,
});
