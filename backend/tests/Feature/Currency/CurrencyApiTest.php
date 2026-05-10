<?php

namespace Tests\Feature\Currency;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CurrencyApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_currency_rates_endpoint_returns_try_usd_eur(): void
    {
        Http::fake([
            'api.exchangerate.host/*' => Http::response([
                'rates' => [
                    'TRY' => 1.0,
                    'USD' => 0.031,
                    'EUR' => 0.028,
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/currency/rates?base=TRY');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.base', 'TRY')
            ->assertJsonPath('data.rates.TRY', 1)
            ->assertJsonPath('data.rates.USD', 0.031)
            ->assertJsonPath('data.rates.EUR', 0.028);
    }

    public function test_currency_rates_returns_user_friendly_message_for_unsupported_base(): void
    {
        // Validation-shaped error: the user supplied an unsupported base
        // currency code. Per the project status-code policy this maps to 422,
        // not to a 5xx upstream code.
        $response = $this->getJson('/api/currency/rates?base=GBP');

        $response->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'unsupported_base_currency')
            ->assertJsonPath('message', 'Desteklenmeyen baz para birimi.');
    }
}
