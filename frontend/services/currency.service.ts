import { apiClient } from "@/lib/axios";

export type CurrencyRatesResponse = {
  success: boolean;
  message: string;
  data?: {
    base: string;
    rates: Record<string, number>;
  };
};

export async function fetchCurrencyRates(base = "TRY"): Promise<CurrencyRatesResponse> {
  const query = base ? `?base=${encodeURIComponent(base)}` : "";
  const { data } = await apiClient.get<CurrencyRatesResponse>(`/currency/rates${query}`);
  return data;
}
