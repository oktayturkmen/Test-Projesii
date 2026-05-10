<?php

namespace Tests\Feature\Order;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_can_be_created_from_cart(): void
    {
        [$token, $product] = $this->authenticateAndCreateProduct();
        $product->update(['stock' => 10]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cart/add', [
                'product_id' => $product->id,
                'quantity' => 2,
            ])->assertCreated();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/orders');

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Siparis basariyla olusturuldu.')
            ->assertJsonPath('data.order.items.0.product_id', $product->id)
            ->assertJsonPath('data.order.items.0.product_name', $product->name)
            ->assertJsonPath('data.order.items.0.quantity', 2);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 8,
        ]);
    }

    public function test_user_orders_can_be_listed(): void
    {
        [$token, $product] = $this->authenticateAndCreateProduct();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cart/add', [
                'product_id' => $product->id,
                'quantity' => 1,
            ])->assertCreated();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/orders')
            ->assertCreated();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/orders');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Siparisler basariyla getirildi.')
            ->assertJsonPath('data.orders.0.status', 'pending');
    }

    public function test_order_can_be_created_with_selected_currency(): void
    {
        Http::fake([
            'https://api.exchangerate.host/latest*' => Http::response([
                'rates' => [
                    'TRY' => 1,
                    'USD' => 0.5,
                    'EUR' => 0.4,
                ],
            ], 200),
        ]);

        [$token, $product] = $this->authenticateAndCreateProduct();
        $product->update(['price' => 100.00]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cart/add', [
                'product_id' => $product->id,
                'quantity' => 2,
            ])->assertCreated();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/orders', [
                'currency' => 'USD',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.order.currency', 'USD')
            ->assertJsonPath('data.order.total_price', '100.00')
            ->assertJsonPath('data.order.items.0.price', '50.00');
    }

    public function test_order_creation_rejects_unsupported_currency(): void
    {
        [$token, $product] = $this->authenticateAndCreateProduct();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cart/add', [
                'product_id' => $product->id,
                'quantity' => 1,
            ])->assertCreated();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/orders', [
                'currency' => 'GBP',
            ]);

        $response->assertUnprocessable()
            ->assertJsonPath('success', false);
    }

    public function test_order_creation_fails_when_stock_is_insufficient(): void
    {
        [$token, $product] = $this->authenticateAndCreateProduct();
        $product->update(['stock' => 2]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cart/add', [
                'product_id' => $product->id,
                'quantity' => 2,
            ])->assertCreated();

        // Simulate stock change after item was added to cart.
        $product->update(['stock' => 1]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/orders', [
                'currency' => 'TRY',
            ]);

        $response->assertUnprocessable()
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 1,
        ]);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_order_creation_returns_user_friendly_message_when_currency_provider_is_unavailable(): void
    {
        Http::fake([
            'https://api.exchangerate.host/latest*' => Http::response([], 500),
            'https://open.er-api.com/*' => Http::response([], 500),
        ]);

        [$token, $product] = $this->authenticateAndCreateProduct();
        $product->update(['stock' => 5]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cart/add', [
                'product_id' => $product->id,
                'quantity' => 1,
            ])->assertCreated();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/orders', [
                'currency' => 'USD',
            ]);

        // Upstream failure: every configured currency provider returned 5xx,
        // so the API surfaces a 502 Bad Gateway. Per the project status-code
        // policy upstream/proxy issues map to 502, not to 422.
        $response->assertStatus(502)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'currency_provider_unavailable')
            ->assertJsonPath('message', 'Kur bilgisi su anda alinamiyor. Lutfen kisa bir sure sonra tekrar deneyin.');
    }

    /**
     * @return array{0: string, 1: Product}
     */
    private function authenticateAndCreateProduct(): array
    {
        $user = User::factory()->create([
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password123',
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertOk();

        $product = Product::factory()->create([
            'price' => 150.00,
        ]);
        $token = (string) $loginResponse->headers->get('X-Auth-Token');

        return [$token, $product];
    }
}
