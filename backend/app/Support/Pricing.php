<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * Decimal-safe price arithmetic backed by bcmath.
 *
 * All inputs are normalized to a fixed-point decimal string before any
 * arithmetic, so callers may pass strings, ints or floats; floats are
 * converted defensively. Outputs are always 2-decimal strings (e.g. "100.00")
 * which match the storage scale of every monetary column in the schema.
 */
final class Pricing
{
    public const SCALE = 2;

    /**
     * Internal scale used while accumulating intermediate calculations to
     * avoid losing precision through repeated 2-decimal rounding.
     */
    private const INTERNAL_SCALE = 8;

    public static function multiply(string|int|float $a, string|int|float $b): string
    {
        return self::round(bcmul(self::normalize($a), self::normalize($b), self::INTERNAL_SCALE));
    }

    public static function add(string|int|float $a, string|int|float $b): string
    {
        return self::round(bcadd(self::normalize($a), self::normalize($b), self::INTERNAL_SCALE));
    }

    public static function format(string|int|float $value): string
    {
        return self::round(self::normalize($value));
    }

    public static function zero(): string
    {
        return '0.00';
    }

    private static function normalize(string|int|float $value): string
    {
        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '' || ! is_numeric($trimmed)) {
                throw new InvalidArgumentException('Pricing value must be numeric.');
            }

            return $trimmed;
        }

        if (is_int($value)) {
            return (string) $value;
        }

        if (! is_finite($value)) {
            throw new InvalidArgumentException('Pricing value must be a finite number.');
        }

        // number_format avoids exponential / locale formatting that bcmath rejects.
        return number_format($value, self::INTERNAL_SCALE, '.', '');
    }

    private static function round(string $value): string
    {
        // bcmath truncates rather than rounding, so add half-unit before truncation.
        $bump = bccomp($value, '0', self::INTERNAL_SCALE) >= 0 ? '0.005' : '-0.005';

        return bcadd($value, $bump, self::SCALE);
    }
}
