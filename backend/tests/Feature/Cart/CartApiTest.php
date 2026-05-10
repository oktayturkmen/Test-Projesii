<?php

namespace Tests\Feature\Cart;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CartApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_can_be_added_to_cart(): void
    {
        [$token, $product] = $this->authenticateAndCreateProduct();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cart/add', [
                'product_id' => $product->id,
                'quantity' => 3,
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Urun sepete basariyla eklendi.')
            ->assertJsonPath('data.item.quantity', 3);
    }

    public function test_product_can_be_removed_from_cart(): void
    {
        [$token, $product] = $this->authenticateAndCreateProduct();

        $addResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cart/add', [
                'product_id' => $product->id,
                'quantity' => 1,
            ]);

        $itemId = $addResponse->json('data.item.id');

        $removeResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/cart/remove/{$itemId}");

        $removeResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Urun sepetten basariyla kaldirildi.');
    }

    public function test_user_cart_can_be_listed(): void
    {
        [$token, $product] = $this->authenticateAndCreateProduct();
        $product->update([
            'price' => 100.00,
            'stock' => 10,
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cart/add', [
                'product_id' => $product->id,
                'quantity' => 2,
            ])->assertCreated();

        $listResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/cart');

        $listResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Sepet basariyla getirildi.')
            ->assertJsonPath('data.items.0.product_id', $product->id)
            ->assertJsonPath('data.items.0.quantity', 2);
    }

    public function test_user_cart_can_be_listed_with_selected_currency(): void
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
            ->getJson('/api/cart?currency=USD');

        $response->assertOk()
            ->assertJsonPath('data.items.0.product.selected_currency', 'USD')
            ->assertJsonPath('data.items.0.product.price_in_currency', '50.00');
    }

    public function test_user_cart_returns_validation_error_for_unsupported_currency(): void
    {
        [$token, $product] = $this->authenticateAndCreateProduct();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cart/add', [
                'product_id' => $product->id,
                'quantity' => 1,
            ])->assertCreated();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/cart?currency=GBP');

        $response->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Desteklenmeyen para birimi.');
    }

    public function test_add_to_cart_rejects_quantity_over_stock(): void
    {
        [$token, $product] = $this->authenticateAndCreateProduct();
        $product->update(['stock' => 2]);

        $firstAdd = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cart/add', [
                'product_id' => $product->id,
                'quantity' => 2,
            ]);

        $firstAdd->assertCreated()
            ->assertJsonPath('data.item.quantity', 2);

        $secondAdd = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cart/add', [
                'product_id' => $product->id,
                'quantity' => 1,
            ]);

        $secondAdd->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Eklenmek istenen adet mevcut stogu asiyor.');
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

        $product = Product::factory()->create();
        $token = (string) $loginResponse->headers->get('X-Auth-Token');

        return [$token, $product];
    }
}
