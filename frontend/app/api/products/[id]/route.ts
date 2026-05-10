import { createProxyRoute } from "@/lib/server/route-factory";

export const GET = createProxyRoute<{ id: string }>({
  protected: false,
  backendPath: ({ params }) => `/api/products/${params.id}`,
  forwardQuery: true,
});

export const PUT = createProxyRoute<{ id: string }>({
  protected: true,
  backendPath: ({ params }) => `/api/products/${params.id}`,
});

export const DELETE = createProxyRoute<{ id: string }>({
  protected: true,
  backendPath: ({ params }) => `/api/products/${params.id}`,
});
