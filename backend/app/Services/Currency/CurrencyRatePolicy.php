<?php

namespace App\Services\Currency;

/**
 * Encapsulates the rules around which "rate sources" are acceptable and how
 * stale a snapshot may be in a given context. The CurrencyService used to
 * inline these rules with `bool $allowStaticFallback` flags scattered across
 * methods; lifting them to a value object makes it trivial to reason about
 * which guarantees a particular caller is asking for.
 */
final class CurrencyRatePolicy
{
    private const PROVIDER_SOURCES = [
        'exchangerate_host',
        'open_er_api',
        'stale_provider_cache',
    ];

    public function __construct(
        public readonly bool $allowStaticFallback,
        public readonly int $staleSnapshotGraceMinutes,
    ) {
    }

    /**
     * Display flows are allowed to use the hard-coded fallback rates so the
     * UI never blocks on upstream outages.
     */
    public static function display(): self
    {
        return new self(
            allowStaticFallback: true,
            staleSnapshotGraceMinutes: PHP_INT_MAX,
        );
    }

    /**
     * Transactional flows (orders, invoicing) MUST never use static fallback;
     * a stale provider snapshot may be used only inside the configured grace
     * window so we don't lock customers into ancient rates.
     */
    public static function transaction(int $staleSnapshotGraceMinutes): self
    {
        return new self(
            allowStaticFallback: false,
            staleSnapshotGraceMinutes: $staleSnapshotGraceMinutes,
        );
    }

    public function acceptsSource(string $source): bool
    {
        if ($this->allowStaticFallback) {
            return true;
        }

        return in_array($source, self::PROVIDER_SOURCES, true);
    }

    public function acceptsSnapshotAge(int $ageMinutes): bool
    {
        return $ageMinutes <= $this->staleSnapshotGraceMinutes;
    }
}
