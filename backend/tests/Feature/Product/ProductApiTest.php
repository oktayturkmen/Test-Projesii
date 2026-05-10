<?php

namespace Tests\Feature\Product;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_products_endpoints_support_crud_operations(): void
    {
        $token = $this->authenticateAdmin();

        $createResponse = $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/products', [
            'name' => 'Phone',
            'description' => 'Smart phone',
            'price' => 19999.99,
            'stock' => 25,
            'image' => 'https://example.com/phone.jpg',
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Phone');

        $productId = $createResponse->json('data.id');

        $listResponse = $this->getJson('/api/products');
        $listResponse->assertOk()
            ->assertJsonPath('success', true);

        $showResponse = $this->getJson("/api/products/{$productId}");
        $showResponse->assertOk()
            ->assertJsonPath('data.id', $productId);

        $updateResponse = $this->withHeader('Authorization', "Bearer {$token}")->putJson("/api/products/{$productId}", [
            'stock' => 40,
            'price' => 18999.50,
        ]);
        $updateResponse->assertOk()
            ->assertJsonPath('data.stock', 40);

        $deleteResponse = $this->withHeader('Authorization', "Bearer {$token}")->deleteJson("/api/products/{$productId}");
        $deleteResponse->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('products', ['id' => $productId]);
    }

    public function test_product_store_validation_returns_errors_for_missing_fields(): void
    {
        $token = $this->authenticateAdmin();
        $response = $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/products', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'description', 'price', 'stock']);
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function unsafeImageUrls(): array
    {
        return [
            'http scheme' => ['http://example.com/img.jpg'],
            'loopback' => ['https://127.0.0.1/img.jpg'],
            'localhost host' => ['https://localhost/img.jpg'],
            'rfc1918 10.x' => ['https://10.0.0.5/img.jpg'],
            'rfc1918 192.168' => ['https://192.168.1.10/img.jpg'],
            'metadata 169.254' => ['https://169.254.169.254/latest/meta-data/'],
        ];
    }

    #[DataProvider('unsafeImageUrls')]
    public function test_product_store_rejects_unsafe_image_urls(string $unsafeUrl): void
    {
        $token = $this->authenticateAdmin();

        $response = $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/products', [
            'name' => 'Phone',
            'description' => 'Smart phone',
            'price' => 19999.99,
            'stock' => 25,
            'image' => $unsafeUrl,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['image']);
    }

    public function test_product_show_rejects_non_numeric_id_with_404(): void
    {
        $response = $this->getJson('/api/products/not-a-number');

        $response->assertNotFound();
    }

    public function test_products_endpoint_is_accessible(): void
    {
        Product::factory()->count(2)->create();

        $response = $this->getJson('/api/products');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'products',
                    'pagination' => ['current_page', 'per_page', 'last_page', 'total'],
                ],
            ]);
    }

    public function test_products_list_rejects_invalid_sort_parameter(): void
    {
        $response = $this->getJson('/api/products?sort=not-a-valid-sort');

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['sort']);
    }

    public function test_products_list_sorts_by_price_ascending(): void
    {
        Product::factory()->create(['name' => 'High', 'price' => 300]);
        Product::factory()->create(['name' => 'Low', 'price' => 100]);
        Product::factory()->create(['name' => 'Mid', 'price' => 200]);

        $response = $this->getJson('/api/products?sort=price_asc');

        $response->assertOk();
        $names = collect($response->json('data.products'))->pluck('name')->all();
        $this->assertSame(['Low', 'Mid', 'High'], $names);
    }

    public function test_products_list_sorts_by_price_descending(): void
    {
        Product::factory()->create(['name' => 'High', 'price' => 300]);
        Product::factory()->create(['name' => 'Low', 'price' => 100]);
        Product::factory()->create(['name' => 'Mid', 'price' => 200]);

        $response = $this->getJson('/api/products?sort=price_desc');

        $response->assertOk();
        $names = collect($response->json('data.products'))->pluck('name')->all();
        $this->assertSame(['High', 'Mid', 'Low'], $names);
    }

    private function authenticateAdmin(): string
    {
        $email = fake()->unique()->safeEmail();
        User::factory()->create([
            'email' => $email,
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'password123',
        ])->assertOk();

        return (string) $loginResponse->headers->get('X-Auth-Token');
    }
}
