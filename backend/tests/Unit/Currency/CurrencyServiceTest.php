<?php

namespace Tests\Unit\Currency;

use App\Services\Currency\CurrencyService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class CurrencyServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_it_returns_rates_from_primary_provider(): void
    {
        Http::fake([
            'https://api.exchangerate.host/*' => Http::response([
                'rates' => [
                    'TRY' => 1.0,
                    'USD' => 0.031,
                    'EUR' => 0.028,
                ],
            ], 200),
        ]);

        $service = app(CurrencyService::class);
        $rates = $service->getRates('TRY');

        $this->assertSame(1.0, $rates['TRY']);
        $this->assertSame(0.031, $rates['USD']);
        $this->assertSame(0.028, $rates['EUR']);
    }

    public function test_it_uses_secondary_provider_when_primary_payload_is_invalid(): void
    {
        Http::fake([
            'https://api.exchangerate.host/*' => Http::response([
                'success' => false,
            ], 200),
            'https://open.er-api.com/*' => Http::response([
                'rates' => [
                    'TRY' => 1.0,
                    'USD' => 0.025,
                    'EUR' => 0.023,
                ],
            ], 200),
        ]);

        $service = app(CurrencyService::class);
        $rates = $service->getRates('TRY');

        $this->assertSame(1.0, $rates['TRY']);
        $this->assertSame(0.025, $rates['USD']);
        $this->assertSame(0.023, $rates['EUR']);
    }

    public function test_it_falls_back_to_local_rates_when_providers_fail(): void
    {
        Http::fake([
            'https://api.exchangerate.host/*' => Http::response([], 500),
            'https://open.er-api.com/*' => Http::response([], 500),
        ]);

        $service = app(CurrencyService::class);
        $rates = $service->getRates('TRY');

        $this->assertSame(1.0, $rates['TRY']);
        $this->assertArrayHasKey('USD', $rates);
        $this->assertArrayHasKey('EUR', $rates);
        $this->assertGreaterThan(0, $rates['USD']);
        $this->assertGreaterThan(0, $rates['EUR']);
    }

    public function test_it_throws_for_unsupported_base_currency(): void
    {
        $service = app(CurrencyService::class);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Unsupported base currency.');

        $service->getRates('GBP');
    }

    public function test_transactional_rates_throw_when_providers_fail_and_no_stale_cache_exists(): void
    {
        Http::fake([
            'https://api.exchangerate.host/*' => Http::response([], 500),
            'https://open.er-api.com/*' => Http::response([], 500),
        ]);

        $service = app(CurrencyService::class);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Currency provider unavailable for transactional conversion.');

        $service->getRatesForTransaction('TRY');
    }

    public function test_transactional_rates_use_stale_provider_snapshot_when_available(): void
    {
        Cache::put('currency_rates_snapshot_TRY', [
            'rates' => [
                'TRY' => 1.0,
                'USD' => 0.03,
                'EUR' => 0.027,
            ],
            'source' => 'exchangerate_host',
            'fetched_at' => now()->subMinutes(15)->toIso8601String(),
        ], now()->addHours(4));

        Http::fake([
            'https://api.exchangerate.host/*' => Http::response([], 500),
            'https://open.er-api.com/*' => Http::response([], 500),
        ]);

        $service = app(CurrencyService::class);
        $rates = $service->getRatesForTransaction('TRY');

        $this->assertSame(1.0, $rates['TRY']);
        $this->assertSame(0.03, $rates['USD']);
        $this->assertSame(0.027, $rates['EUR']);
    }
}
