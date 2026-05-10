<?php

namespace App\Services\Currency;

/**
 * Immutable, value-object representation of a successfully resolved set of
 * currency rates. Owning a single shape across the cache, resolver and
 * service layers prevents the "is this a legacy payload?" branching that
 * used to live inline.
 */
final class ResolvedRates
{
    /**
     * @param array<string, float> $rates
     */
    public function __construct(
        public readonly array $rates,
        public readonly string $source,
        public readonly string $fetchedAt,
    ) {
    }

    /**
     * @return array{rates: array<string, float>, source: string, fetched_at: string}
     */
    public function toCachePayload(): array
    {
        return [
            'rates' => $this->rates,
            'source' => $this->source,
            'fetched_at' => $this->fetchedAt,
        ];
    }
}
