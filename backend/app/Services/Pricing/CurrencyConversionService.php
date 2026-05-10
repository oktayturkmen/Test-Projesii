<?php

namespace App\Services\Pricing;

use App\Enums\Currency;
use App\Exceptions\Domain\CurrencyConversionException;
use App\Exceptions\Domain\UnsupportedCurrencyException;
use App\Models\Product;
use App\Services\Currency\CurrencyService;
use App\Support\Pricing;

class CurrencyConversionService
{
    public function __construct(
        private readonly CurrencyService $currencyService
    ) {
    }

    public function normalizeCurrency(string $currency): string
    {
        $resolved = Currency::tryFromInput($currency);

        if ($resolved === null) {
            throw new UnsupportedCurrencyException('Unsupported currency.');
        }

        return $resolved->value;
    }

    /**
     * @return array<string, float>|null
     */
    public function ratesForDisplay(string $currency): ?array
    {
        $currency = $this->normalizeCurrency($currency);

        return $currency === Currency::BASE->value
            ? null
            : $this->currencyService->getRates(Currency::BASE->value);
    }

    /**
     * @return array<string, float>|null
     */
    public function ratesForTransaction(string $currency): ?array
    {
        $currency = $this->normalizeCurrency($currency);

        return $currency === Currency::BASE->value
            ? null
            : $this->currencyService->getRatesForTransaction(Currency::BASE->value);
    }

    /**
     * @param array<string, float>|null $rates
     */
    public function convert(string|float|int $basePrice, string $currency, ?array $rates = null): string
    {
        $currency = $this->normalizeCurrency($currency);

        if ($currency === Currency::BASE->value) {
            return Pricing::format($basePrice);
        }

        $rate = $rates[$currency] ?? null;
        if (! is_numeric($rate)) {
            throw new CurrencyConversionException('Currency rates response is invalid.');
        }

        return Pricing::multiply($basePrice, (string) $rate);
    }

    /**
     * @param array<string, float>|null $rates
     */
    public function decorateProduct(Product $product, string $currency, ?array $rates = null): Product
    {
        $convertedPrice = $this->convert((string) $product->price, $currency, $rates);

        $product->setAttribute('price_in_currency', $convertedPrice);
        $product->setAttribute('selected_currency', $this->normalizeCurrency($currency));

        return $product;
    }
}
