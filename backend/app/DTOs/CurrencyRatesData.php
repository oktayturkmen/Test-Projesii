<?php

namespace App\DTOs;

final readonly class CurrencyRatesData
{
    /**
     * @param array<string, float> $rates
     */
    public function __construct(
        public string $base,
        public array $rates
    ) {
    }

    /**
     * @return array{base: string, rates: array<string, float>}
     */
    public function toArray(): array
    {
        return [
            'base' => $this->base,
            'rates' => $this->rates,
        ];
    }
}
