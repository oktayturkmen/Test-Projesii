<?php

namespace App\Enums;

/**
 * Supported display & transactional currencies.
 *
 * The ordering of {@see self::SUPPORTED} in {@see CurrencyService} is the
 * source of truth for "which currencies do we sell in?". Any new currency
 * MUST be added here first and then explicitly enabled in the provider chain.
 */
enum Currency: string
{
    case TRY = 'TRY';
    case USD = 'USD';
    case EUR = 'EUR';

    public const BASE = self::TRY;

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $case): string => $case->value, self::cases());
    }

    /**
     * Normalize an arbitrary user-supplied input to a supported currency.
     */
    public static function tryFromInput(string|null $input): ?self
    {
        if ($input === null) {
            return null;
        }

        return self::tryFrom(strtoupper(trim($input)));
    }
}
