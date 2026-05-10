"use client";

import { create } from "zustand";
import { getSafeApiMessage } from "@/lib/api-error";
import {
  addToCart,
  fetchCart,
  removeFromCart,
  updateCartItem,
  type AddToCartPayload,
  type AddToCartResponse,
  type CartItemDto,
  type RemoveFromCartResponse,
  type UpdateCartItemPayload,
  type UpdateCartItemResponse,
} from "@/services/cart.service";

type CartStore = {
  items: CartItemDto[];
  isLoading: boolean;
  error: string | null;
  loadCart: (currency?: string) => Promise<void>;
  addItem: (payload: AddToCartPayload) => Promise<AddToCartResponse>;
  removeItem: (cartItemId: number) => Promise<RemoveFromCartResponse>;
  updateItem: (payload: UpdateCartItemPayload) => Promise<UpdateCartItemResponse>;
  clear: () => void;
};

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  loadCart: async (currency) => {
    set({ isLoading: true, error: null });

    try {
      const data = await fetchCart(currency);

      if (!data.success || !data.data) {
        set({ items: [], error: getSafeApiMessage(data.message, "Sepet yüklenemedi.") });
        return;
      }

      set({ items: data.data.items ?? [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (payload) => {
    const result = await addToCart(payload);

    if (result.success && result.data?.item) {
      const addedItem = result.data.item;

      set((state) => {
        const existingItem = state.items.find((item) => item.id === addedItem.id);

        return {
          items: existingItem
            ? state.items.map((item) => (item.id === addedItem.id ? addedItem : item))
            : [...state.items, addedItem],
        };
      });
    }

    return result;
  },

  removeItem: async (cartItemId) => {
    const result = await removeFromCart(cartItemId);

    if (result.success) {
      set((state) => ({
        items: state.items.filter((item) => item.id !== cartItemId),
      }));
    }

    return result;
  },

  updateItem: async (payload) => {
    const result = await updateCartItem(payload);

    if (result.success && result.data?.item) {
      set((state) => ({
        items: state.items.map((item) =>
          item.id === result.data?.item.id ? result.data.item : item
        ),
      }));
    }

    return result;
  },

  clear: () => set({ items: [], error: null }),
}));
