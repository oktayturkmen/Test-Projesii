<?php

namespace Tests\Feature\Product;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ProductCurrencyConversionTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_prices_can_be_returned_in_selected_currency(): void
    {
        Product::factory()->create([
            'price' => 100.00,
        ]);

        Http::fake([
            'api.exchangerate.host/*' => Http::response([
                'rates' => [
                    'TRY' => 1.0,
                    'USD' => 0.03,
                    'EUR' => 0.028,
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/products?currency=USD');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.products.0.selected_currency', 'USD')
            ->assertJsonPath('data.products.0.price_in_currency', '3.00');
    }
}
