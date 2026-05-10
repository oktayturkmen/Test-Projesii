import { createProxyRoute } from "@/lib/server/route-factory";

export const DELETE = createProxyRoute<{ id: string }>({
  protected: true,
  backendPath: ({ params }) => `/api/cart/remove/${params.id}`,
});
