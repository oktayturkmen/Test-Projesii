<?php

namespace App\Services\Currency;

use Illuminate\Support\Facades\Cache;

/**
 * Owns every cache interaction for currency rates: short-lived "fresh" cache,
 * long-lived "snapshot" cache (used as a stale fallback when every provider
 * is failing), and a per-request runtime memo to avoid re-hitting Cache::get
 * inside the same HTTP request.
 */
class CurrencyRateCache
{
    /**
     * @var array<string, ResolvedRates>
     */
    private array $runtime = [];

    /**
     * @param array<int, string> $supportedCurrencies
     */
    public function __construct(
        private readonly array $supportedCurrencies,
        private readonly int $freshTtlMinutes,
        private readonly int $snapshotTtlMinutes,
    ) {
    }

    public function getRuntime(string $base): ?ResolvedRates
    {
        return $this->runtime[$base] ?? null;
    }

    public function getFresh(string $base): ?ResolvedRates
    {
        $payload = $this->hydrate(Cache::get($this->freshKey($base)));

        if ($payload !== null) {
            $this->runtime[$base] = $payload;
        }

        return $payload;
    }

    public function getSnapshot(string $base): ?ResolvedRates
    {
        return $this->hydrate(Cache::get($this->snapshotKey($base)));
    }

    public function storeFresh(string $base, ResolvedRates $rates): void
    {
        Cache::put(
            $this->freshKey($base),
            $rates->toCachePayload(),
            now()->addMinutes($this->freshTtlMinutes)
        );

        $this->runtime[$base] = $rates;
    }

    public function storeSnapshot(string $base, ResolvedRates $rates): void
    {
        Cache::put(
            $this->snapshotKey($base),
            $rates->toCachePayload(),
            now()->addMinutes($this->snapshotTtlMinutes)
        );
    }

    public function rememberRuntime(string $base, ResolvedRates $rates): void
    {
        $this->runtime[$base] = $rates;
    }

    private function freshKey(string $base): string
    {
        return "currency_rates_{$base}";
    }

    private function snapshotKey(string $base): string
    {
        return "currency_rates_snapshot_{$base}";
    }

    private function hydrate(mixed $cached): ?ResolvedRates
    {
        if (! is_array($cached)) {
            return null;
        }

        if (isset($cached['rates'], $cached['source'], $cached['fetched_at']) && is_array($cached['rates'])) {
            $rates = $this->normalizeRates($cached['rates']);
            if ($rates === null) {
                return null;
            }

            return new ResolvedRates(
                rates: $rates,
                source: (string) $cached['source'],
                fetchedAt: (string) $cached['fetched_at'],
            );
        }

        // Legacy cache payload: a flat <currency, float> map without metadata.
        $rates = $this->normalizeRates($cached);
        if ($rates === null) {
            return null;
        }

        return new ResolvedRates(
            rates: $rates,
            source: 'legacy_cache',
            fetchedAt: now()->toIso8601String(),
        );
    }

    /**
     * @param array<string, mixed> $rates
     * @return array<string, float>|null
     */
    private function normalizeRates(array $rates): ?array
    {
        $normalized = [];

        foreach ($this->supportedCurrencies as $currency) {
            if (! array_key_exists($currency, $rates) || ! is_numeric($rates[$currency])) {
                return null;
            }

            $normalized[$currency] = (float) $rates[$currency];
        }

        return $normalized;
    }
}
