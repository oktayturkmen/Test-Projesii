import { apiClient } from "@/lib/axios";
import type { OrderStatus, UserRole } from "@/lib/constants";
import type { OrderSummary } from "@/services/order.service";

/**
 * Admin-scope product DTO. Intentionally separate from the customer-facing
 * `Product` (in `services/product.service.ts`) because the storefront type
 * carries presentation-layer fields (`price_in_currency`, `selected_currency`)
 * that admin write-paths must NEVER round-trip back to the API. Keeping the
 * shapes apart makes that contract checkable at the type level.
 */
export type AdminProduct = {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  image?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminProductsResponse = {
  success: boolean;
  message: string;
  data?: {
    products: AdminProduct[];
    pagination?: {
      current_page: number;
      per_page: number;
      last_page: number;
      total: number;
    };
  };
};

export type AdminProductDetailResponse = {
  success: boolean;
  message: string;
  data?: AdminProduct;
};

export type AdminStatsResponse = {
  success: boolean;
  message: string;
  data?: {
    totals: {
      products: number;
      orders: number;
      users: number;
    };
  };
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string | null;
};

export type AdminUsersResponse = {
  success: boolean;
  message: string;
  data?: {
    users: AdminUser[];
    pagination?: {
      current_page: number;
      per_page: number;
      last_page: number;
      total: number;
    };
  };
};

export type AdminOrder = OrderSummary & {
  user?: { id: number; name: string; email: string } | null;
  created_at?: string | null;
};

export type AdminOrdersResponse = {
  success: boolean;
  message: string;
  data?: {
    orders: AdminOrder[];
    pagination?: {
      current_page: number;
      per_page: number;
      last_page: number;
      total: number;
    };
  };
};

export type AdminOrderStatusResponse = {
  success: boolean;
  message: string;
  data?: {
    order: AdminOrder;
  };
};

export type AdminProductPayload = {
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string | null;
};

export type AdminProductResponse = {
  success: boolean;
  message: string;
  data?: AdminProduct;
};

export async function fetchAdminStats(): Promise<AdminStatsResponse> {
  const { data } = await apiClient.get<AdminStatsResponse>("/admin/stats");
  return data;
}

export async function fetchAdminOrders(page = 1, perPage = 20): Promise<AdminOrdersResponse> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const { data } = await apiClient.get<AdminOrdersResponse>(`/admin/orders?${params.toString()}`);
  return data;
}

export async function updateAdminOrderStatus(
  id: number,
  status: OrderStatus
): Promise<AdminOrderStatusResponse> {
  const { data } = await apiClient.patch<AdminOrderStatusResponse>(
    `/admin/orders/${encodeURIComponent(String(id))}/status`,
    { status }
  );
  return data;
}

export async function fetchAdminUsers(page = 1, perPage = 20): Promise<AdminUsersResponse> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const { data } = await apiClient.get<AdminUsersResponse>(`/admin/users?${params.toString()}`);
  return data;
}

export async function fetchAdminProducts(
  page = 1,
  perPage = 15
): Promise<AdminProductsResponse> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const { data } = await apiClient.get<AdminProductsResponse>(
    `/admin/products?${params.toString()}`
  );
  return data;
}

export async function fetchAdminProductDetail(id: number): Promise<AdminProductDetailResponse> {
  const { data } = await apiClient.get<AdminProductDetailResponse>(
    `/admin/products/${encodeURIComponent(String(id))}`
  );
  return data;
}

export async function createAdminProduct(payload: AdminProductPayload): Promise<AdminProductResponse> {
  const { data } = await apiClient.post<AdminProductResponse>("/products", payload);
  return data;
}

export async function updateAdminProduct(
  id: number,
  payload: Partial<AdminProductPayload>
): Promise<AdminProductResponse> {
  const { data } = await apiClient.put<AdminProductResponse>(`/products/${id}`, payload);
  return data;
}

export async function deleteAdminProduct(id: number): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.delete<{ success: boolean; message: string }>(`/products/${id}`);
  return data;
}
