/**
 * Single source of truth for cross-cutting domain constants on the
 * frontend. Anything that has an enum equivalent in `backend/app/Enums`
 * should also live here so the two sides stay in lock-step.
 */

export const SUPPORTED_CURRENCIES = ["TRY", "USD", "EUR"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const BASE_CURRENCY: SupportedCurrency = "TRY";

export function normalizeCurrency(value: string | null | undefined): SupportedCurrency {
  if (typeof value !== "string") {
    return BASE_CURRENCY;
  }

  const upper = value.trim().toUpperCase();

  return (SUPPORTED_CURRENCIES as readonly string[]).includes(upper)
    ? (upper as SupportedCurrency)
    : BASE_CURRENCY;
}

export const ORDER_STATUSES = ["pending", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Beklemede",
  completed: "Tamamlandı",
  cancelled: "İptal edildi",
};

export const USER_ROLES = ["admin", "user"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROUTES = {
  home: "/",
  products: "/products",
  cart: "/cart",
  checkout: "/checkout",
  orders: "/orders",
  login: "/login",
  register: "/register",
  admin: "/admin",
} as const;
