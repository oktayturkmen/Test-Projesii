<?php

namespace App\Services\Currency;

use App\Services\Currency\Contracts\CurrencyRateProviderInterface;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Walks an ordered chain of {@see CurrencyRateProviderInterface} instances
 * and returns the first usable result. Each provider is wrapped in a tiny
 * "cool-down" circuit breaker: a recent failure marks the provider as
 * tripped for a configured window, so subsequent requests don't pay the
 * timeout penalty for a known-dead upstream.
 *
 * The provider chain is supplied from configuration (`config/currency.php`),
 * which keeps the resolver closed to modification when a new source is added.
 */
class CurrencyRateResolver
{
    /**
     * @param iterable<CurrencyRateProviderInterface> $providers
     */
    public function __construct(
        private readonly iterable $providers,
        private readonly int $coolDownSeconds = 60,
    ) {
    }

    /**
     * @param array<int, string> $supportedCurrencies
     */
    public function resolve(string $base, array $supportedCurrencies): ?ResolvedRates
    {
        foreach ($this->providers as $provider) {
            if ($this->isTripped($provider->name())) {
                continue;
            }

            try {
                $rates = $provider->fetch($base, $supportedCurrencies);
            } catch (Throwable) {
                $this->trip($provider->name());
                continue;
            }

            if ($rates === null) {
                $this->trip($provider->name());
                continue;
            }

            return new ResolvedRates(
                rates: $rates,
                source: $provider->name(),
                fetchedAt: now()->toIso8601String(),
            );
        }

        return null;
    }

    private function circuitKey(string $providerName): string
    {
        return "currency_provider_circuit:{$providerName}";
    }

    private function isTripped(string $providerName): bool
    {
        if ($this->coolDownSeconds <= 0) {
            return false;
        }

        return (bool) Cache::get($this->circuitKey($providerName));
    }

    private function trip(string $providerName): void
    {
        if ($this->coolDownSeconds <= 0) {
            return;
        }

        Cache::put(
            $this->circuitKey($providerName),
            true,
            now()->addSeconds($this->coolDownSeconds)
        );
    }
}
