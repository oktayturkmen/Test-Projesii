<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Hardens the product `image` field against SSRF-style abuse.
 *
 * The customer-facing storefront and the Next.js `_next/image` optimizer
 * both fetch this URL server-side at render time. Without scheme + host
 * restrictions an admin could submit URLs pointing at internal services
 * (e.g. AWS metadata 169.254.169.254, container links, RFC1918 ranges) and
 * have the application proxy fetch them.
 *
 * Layered with `next.config.ts` `images.remotePatterns` allowlist on the
 * frontend so the rejection happens at both ingress and presentation.
 */
class SafeImageUrl implements ValidationRule
{
    /**
     * Hostname patterns that must never be reachable through user-supplied
     * URLs. Covers loopback, link-local, RFC1918 private ranges, the
     * IMDS metadata endpoint, and the IPv6 equivalents.
     */
    private const BLOCKED_HOST_PATTERNS = [
        '/^localhost$/i',
        '/^127\./',
        '/^0\./',
        '/^10\./',
        '/^192\.168\./',
        '/^172\.(1[6-9]|2\d|3[01])\./',
        '/^169\.254\./',
        '/^::1$/',
        '/^fe80:/i',
        '/^fc00:/i',
        '/^fd[0-9a-f]{2}:/i',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            return;
        }

        $parts = parse_url($value);

        if ($parts === false || ! isset($parts['scheme'], $parts['host'])) {
            $fail('Gecersiz gorsel URL formati.');

            return;
        }

        if (strtolower($parts['scheme']) !== 'https') {
            $fail('Gorsel URL HTTPS protokolu kullanmalidir.');

            return;
        }

        $host = strtolower($parts['host']);

        foreach (self::BLOCKED_HOST_PATTERNS as $pattern) {
            if (preg_match($pattern, $host) === 1) {
                $fail('Gorsel URL ozel/iclayalanli bir adrese isaret edemez.');

                return;
            }
        }
    }
}
