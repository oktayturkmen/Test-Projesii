<?php

namespace App\Services\Currency;

use App\Exceptions\Domain\CurrencyConversionException;
use App\Exceptions\Domain\UnsupportedBaseCurrencyException;

/**
 * Thin orchestrator over the currency stack:
 *  - {@see CurrencyRateResolver}: provider chain + circuit breaker
 *  - {@see CurrencyRateCache}: fresh + snapshot caches with a runtime memo
 *  - {@see CurrencyRatePolicy}: which fallbacks are acceptable in which flow
 *
 * Each public method is a tiny choreography of those collaborators; the heavy
 * branching that lived in the legacy CurrencyService (cache hydration, stale
 * rules, static fallback gate) is now owned by the right collaborator.
 */
class CurrencyService
{
    /**
     * @var array<int, string>
     */
    private readonly array $supportedCurrencies;

    private readonly string $baseCurrency;

    private readonly int $transactionGraceMinutes;

    public function __construct(
        private readonly CurrencyRateResolver $resolver,
        private readonly CurrencyRateCache $cache,
    ) {
        $this->baseCurrency = (string) config('currency.base', 'TRY');
        $this->supportedCurrencies = (array) config('currency.supported', ['TRY', 'USD', 'EUR']);
        $this->transactionGraceMinutes = (int) config('currency.cache.transaction_grace_minutes', 60);
    }

    /**
     * @return array<string, float>
     */
    public function getRates(string $base = 'TRY'): array
    {
        return $this->getRatesWithPolicy($base, CurrencyRatePolicy::display());
    }

    /**
     * Strict mode for financial operations: static fallback is forbidden.
     *
     * @return array<string, float>
     */
    public function getRatesForTransaction(string $base = 'TRY'): array
    {
        return $this->getRatesWithPolicy(
            $base,
            CurrencyRatePolicy::transaction($this->transactionGraceMinutes)
        );
    }

    /**
     * Refresh provider-backed cache outside the request path (queues, cron).
     *
     * @return array<string, float>
     */
    public function refreshRates(string $base = 'TRY'): array
    {
        $base = $this->normalizeBase($base);

        $resolved = $this->resolver->resolve($base, $this->supportedCurrencies);
        if ($resolved === null) {
            throw new CurrencyConversionException('Currency provider unavailable for refresh.');
        }

        $this->cache->storeFresh($base, $resolved);
        $this->cache->storeSnapshot($base, $resolved);

        return $resolved->rates;
    }

    /**
     * @return array<string, float>
     */
    private function getRatesWithPolicy(string $base, CurrencyRatePolicy $policy): array
    {
        $base = $this->normalizeBase($base);

        $runtime = $this->cache->getRuntime($base);
        if ($runtime !== null && $policy->acceptsSource($runtime->source)) {
            return $runtime->rates;
        }

        $fresh = $this->cache->getFresh($base);
        if ($fresh !== null && $policy->acceptsSource($fresh->source)) {
            return $fresh->rates;
        }

        $resolved = $this->resolver->resolve($base, $this->supportedCurrencies);
        if ($resolved !== null) {
            $this->cache->storeFresh($base, $resolved);
            $this->cache->storeSnapshot($base, $resolved);
            return $resolved->rates;
        }

        $stale = $this->resolveUsableStaleSnapshot($base, $policy);
        if ($stale !== null) {
            $this->cache->rememberRuntime($base, $stale);
            return $stale->rates;
        }

        if (! $policy->allowStaticFallback) {
            throw new CurrencyConversionException('Currency provider unavailable for transactional conversion.');
        }

        $fallback = new ResolvedRates(
            rates: $this->fallbackRates($base),
            source: 'static_fallback',
            fetchedAt: now()->toIso8601String(),
        );
        $this->cache->storeFresh($base, $fallback);

        return $fallback->rates;
    }

    private function resolveUsableStaleSnapshot(string $base, CurrencyRatePolicy $policy): ?ResolvedRates
    {
        $snapshot = $this->cache->getSnapshot($base);
        if ($snapshot === null) {
            return null;
        }

        if (! $policy->acceptsSource($snapshot->source)) {
            return null;
        }

        $fetchedAt = strtotime($snapshot->fetchedAt);
        if ($fetchedAt === false) {
            return null;
        }

        $ageMinutes = (int) floor((time() - $fetchedAt) / 60);
        if (! $policy->acceptsSnapshotAge($ageMinutes)) {
            return null;
        }

        // Mark the source so downstream policy checks recognize this as a
        // provider-derived (not static) value.
        return new ResolvedRates(
            rates: $snapshot->rates,
            source: 'stale_provider_cache',
            fetchedAt: $snapshot->fetchedAt,
        );
    }

    private function normalizeBase(string $base): string
    {
        $base = strtoupper(trim($base));

        if (! in_array($base, $this->supportedCurrencies, true)) {
            throw new UnsupportedBaseCurrencyException('Unsupported base currency.');
        }

        return $base;
    }

    /**
     * @return array<string, float>
     */
    private function fallbackRates(string $base): array
    {
        $tryBase = [
            'TRY' => 1.0,
            'USD' => 0.026,
            'EUR' => 0.024,
        ];

        if ($base === $this->baseCurrency) {
            return $tryBase;
        }

        $baseToTry = 1 / $tryBase[$base];

        return [
            'TRY' => $baseToTry,
            'USD' => $baseToTry * $tryBase['USD'],
            'EUR' => $baseToTry * $tryBase['EUR'],
        ];
    }
}
