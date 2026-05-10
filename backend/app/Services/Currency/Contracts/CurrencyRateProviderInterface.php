<?php

namespace App\Services\Currency\Contracts;

interface CurrencyRateProviderInterface
{
    /**
     * Stable, machine-readable identifier (used for cache keys, logs, and
     * the `source` field surfaced in cached payloads).
     */
    public function name(): string;

    /**
     * Fetch rates from the upstream provider.
     *
     * @param array<int, string> $supportedCurrencies
     * @return array<string, float>|null Null when the provider could not deliver
     *                                   a complete, valid response.
     */
    public function fetch(string $base, array $supportedCurrencies): ?array;
}
