import { apiClient } from "@/lib/axios";

export type Product = {
  id: number;
  name: string;
  description: string;
  image?: string | null;
  stock: number;
  /**
   * Raw, base-currency (TRY) price stored in the database. Always present in
   * API responses and is the canonical value to feed admin write-paths back
   * into. Decimal-typed columns are serialized as strings by Eloquent.
   */
  price: string;
  /** Optional currency-converted price for the customer view. */
  selected_currency?: string;
  price_in_currency?: string;
};

export type ProductListResponse = {
  success: boolean;
  message: string;
  data?: {
    products: Product[];
    pagination?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
};

export type ProductDetailResponse = {
  success: boolean;
  message: string;
  data?: Product;
};

/** Public product list ordering; omit or leave unset for default (newest first). */
export type ProductListSort = "price_asc" | "price_desc";

export async function fetchProducts(
  currency: string,
  page = 1,
  perPage = 15,
  sort?: ProductListSort
): Promise<ProductListResponse> {
  const params = new URLSearchParams({
    currency,
    page: String(page),
    per_page: String(perPage),
  });
  if (sort) {
    params.set("sort", sort);
  }
  const { data } = await apiClient.get<ProductListResponse>(`/products?${params.toString()}`);
  return data;
}

export async function fetchProductDetail(id: string, currency: string): Promise<ProductDetailResponse> {
  const { data } = await apiClient.get<ProductDetailResponse>(
    `/products/${encodeURIComponent(id)}?currency=${encodeURIComponent(currency)}`
  );
  return data;
}
