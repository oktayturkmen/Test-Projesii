import { apiClient } from "@/lib/axios";

export type CartProduct = {
  id: number;
  name: string;
  description?: string;
  price: string;
  price_in_currency?: string;
  selected_currency?: string;
  stock: number;
  image?: string | null;
};

export type CartItemDto = {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  product?: CartProduct | null;
};

export type CartPayload = {
  cart_id: number;
  items: CartItemDto[];
};

export type CartApiResponse = {
  success: boolean;
  message: string;
  data?: CartPayload;
};

export type AddToCartPayload = {
  product_id: number;
  quantity: number;
};

export type AddToCartResponse = {
  success: boolean;
  message: string;
  data?: {
    cart_id: number;
    item: CartItemDto;
  };
};

export type RemoveFromCartResponse = {
  success: boolean;
  message: string;
};

export type UpdateCartItemPayload = {
  cart_item_id: number;
  quantity: number;
};

export type UpdateCartItemResponse = {
  success: boolean;
  message: string;
  data?: {
    cart_id: number;
    item: CartItemDto;
  };
};

export async function fetchCart(currency?: string): Promise<CartApiResponse> {
  const query = currency ? `?currency=${encodeURIComponent(currency)}` : "";
  const { data } = await apiClient.get<CartApiResponse>(`/cart${query}`);
  return data;
}

export async function addToCart(payload: AddToCartPayload): Promise<AddToCartResponse> {
  const { data } = await apiClient.post<AddToCartResponse>("/cart/add", payload);
  return data;
}

export async function removeFromCart(cartItemId: number): Promise<RemoveFromCartResponse> {
  const { data } = await apiClient.delete<RemoveFromCartResponse>(`/cart/remove/${cartItemId}`);
  return data;
}

export async function updateCartItem(
  payload: UpdateCartItemPayload
): Promise<UpdateCartItemResponse> {
  const { data } = await apiClient.put<UpdateCartItemResponse>("/cart/update", payload);
  return data;
}
