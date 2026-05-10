import { apiClient } from "@/lib/axios";
import type { OrderStatus } from "@/lib/constants";

export type OrderProduct = {
  id: number;
  name: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  product_name?: string;
  product_sku?: string | null;
  product_image?: string | null;
  quantity: number;
  price: string;
  product?: OrderProduct | null;
};

export type CreatedOrder = {
  id: number;
  user_id: number;
  status: OrderStatus;
  total_price: string;
  currency: string;
  items?: OrderItem[];
};

export type CreateOrderResponse = {
  success: boolean;
  message: string;
  data?: {
    order: CreatedOrder;
  };
};

export type CreateOrderPayload = {
  currency?: string;
};

export type OrderSummary = {
  id: number;
  user_id: number;
  status: OrderStatus;
  total_price: string;
  currency: string;
  items?: OrderItem[];
};

export type OrdersListResponse = {
  success: boolean;
  message: string;
  data?: {
    orders: OrderSummary[];
    pagination?: {
      current_page: number;
      per_page: number;
      last_page: number;
      total: number;
    };
  };
};

export type OrderDetailResponse = {
  success: boolean;
  message: string;
  data?: {
    order: OrderSummary;
  };
};

export async function createOrder(payload?: CreateOrderPayload): Promise<CreateOrderResponse> {
  const { data } = await apiClient.post<CreateOrderResponse>("/orders", payload ?? {});
  return data;
}

export async function fetchOrders(page = 1, perPage = 15): Promise<OrdersListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  const { data } = await apiClient.get<OrdersListResponse>(`/orders?${params.toString()}`);
  return data;
}

export async function fetchOrder(orderId: number): Promise<OrderDetailResponse> {
  const { data } = await apiClient.get<OrderDetailResponse>(`/orders/${orderId}`);
  return data;
}
