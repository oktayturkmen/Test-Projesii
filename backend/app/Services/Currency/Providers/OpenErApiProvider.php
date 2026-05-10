<?php

namespace App\Services\Currency\Providers;

use App\Services\Currency\Contracts\CurrencyRateProviderInterface;
use Illuminate\Support\Facades\Http;

class OpenErApiProvider implements CurrencyRateProviderInterface
{
    public function name(): string
    {
        return 'open_er_api';
    }

    public function fetch(string $base, array $supportedCurrencies): ?array
    {
        $timeout = (int) config('currency.http.timeout_seconds', 3);

        $response = Http::timeout($timeout)->get("https://open.er-api.com/v6/latest/{$base}");

        if (! $response->successful()) {
            return null;
        }

        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        $rates = $payload['rates'] ?? null;

        if (! is_array($rates) || ! $this->hasAllSupportedRates($rates, $supportedCurrencies)) {
            return null;
        }

        return $this->normalizeRates($rates, $supportedCurrencies);
    }

    /**
     * @param array<string, mixed> $rates
     * @param array<int, string> $supportedCurrencies
     */
    private function hasAllSupportedRates(array $rates, array $supportedCurrencies): bool
    {
        foreach ($supportedCurrencies as $currency) {
            if (! array_key_exists($currency, $rates) || ! is_numeric($rates[$currency])) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param array<string, mixed> $rates
     * @param array<int, string> $supportedCurrencies
     * @return array<string, float>
     */
    private function normalizeRates(array $rates, array $supportedCurrencies): array
    {
        $normalized = [];

        foreach ($supportedCurrencies as $currency) {
            $normalized[$currency] = (float) $rates[$currency];
        }

        return $normalized;
    }
}
