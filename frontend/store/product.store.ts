"use client";

import { create } from "zustand";
import { getSafeApiMessage } from "@/lib/api-error";
import {
  fetchProductDetail as fetchProductDetailRequest,
  fetchProducts as fetchProductsRequest,
  type Product,
  type ProductListSort,
} from "@/services/product.service";

type ProductStore = {
  products: Product[];
  currentProduct: Product | null;
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  isLoading: boolean;
  error: string | null;
  loadProducts: (currency: string, page?: number, sort?: ProductListSort) => Promise<void>;
  loadProductDetail: (id: string, currency: string) => Promise<void>;
};

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  currentProduct: null,
  pagination: {
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
  },
  isLoading: false,
  error: null,

  loadProducts: async (currency, page = 1, sort) => {
    set({ isLoading: true, error: null });

    try {
      const data = await fetchProductsRequest(currency, page, 15, sort);

      if (!data.success) {
        set({ products: [], error: getSafeApiMessage(data.message, "Ürünler alınamadı.") });
        return;
      }

      set({
        products: data.data?.products ?? [],
        pagination: {
          currentPage: data.data?.pagination?.current_page ?? page,
          lastPage: data.data?.pagination?.last_page ?? 1,
          perPage: data.data?.pagination?.per_page ?? 15,
          total: data.data?.pagination?.total ?? 0,
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  loadProductDetail: async (id, currency) => {
    const productId = Number(id);

    set((state) => ({
      currentProduct:
        Number.isFinite(productId) && state.currentProduct?.id === productId
          ? state.currentProduct
          : null,
      isLoading: true,
      error: null,
    }));

    try {
      const data = await fetchProductDetailRequest(id, currency);

      if (!data.success || !data.data) {
        set({ error: getSafeApiMessage(data.message, "Ürün detayı alınamadı.") });
        return;
      }

      set({ currentProduct: data.data });
    } finally {
      set({ isLoading: false });
    }
  },
}));
