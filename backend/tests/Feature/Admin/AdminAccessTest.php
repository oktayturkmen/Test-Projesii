<?php

namespace Tests\Feature\Admin;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * End-to-end authorization contract for the `/api/admin/*` surface.
 *
 * Each endpoint must satisfy the same three-state contract:
 *   - unauthenticated request  -> 401
 *   - authenticated non-admin  -> 403
 *   - authenticated admin      -> 200
 *
 * Driving every endpoint through the same provider keeps the matrix honest;
 * adding a new admin route only requires a single line in the data set.
 */
class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{method: string, pathFactory: callable(self): string}>
     */
    public static function adminEndpoints(): array
    {
        return [
            'stats' => [
                'method' => 'GET',
                'pathFactory' => static fn (): string => '/api/admin/stats',
            ],
            'orders' => [
                'method' => 'GET',
                'pathFactory' => static fn (): string => '/api/admin/orders',
            ],
            'users' => [
                'method' => 'GET',
                'pathFactory' => static fn (): string => '/api/admin/users',
            ],
            'products list' => [
                'method' => 'GET',
                'pathFactory' => static fn (): string => '/api/admin/products',
            ],
            'product detail' => [
                'method' => 'GET',
                'pathFactory' => static function (self $test): string {
                    $product = Product::factory()->create();

                    return '/api/admin/products/'.$product->id;
                },
            ],
        ];
    }

    #[DataProvider('adminEndpoints')]
    public function test_admin_endpoints_reject_unauthenticated_requests(string $method, callable $pathFactory): void
    {
        $path = $pathFactory($this);

        $this->json($method, $path)->assertStatus(401);
    }

    #[DataProvider('adminEndpoints')]
    public function test_admin_endpoints_reject_non_admin_users(string $method, callable $pathFactory): void
    {
        $path = $pathFactory($this);

        $token = $this->loginAs(User::factory()->create([
            'email' => 'regular-'.uniqid().'@example.com',
            'password' => 'password123',
            'role' => 'user',
        ]));

        $this->withHeader('Authorization', "Bearer {$token}")
            ->json($method, $path)
            ->assertForbidden();
    }

    #[DataProvider('adminEndpoints')]
    public function test_admin_endpoints_allow_admin_users(string $method, callable $pathFactory): void
    {
        $path = $pathFactory($this);

        $admin = User::factory()->admin()->create([
            'email' => 'admin-'.uniqid().'@example.com',
            'password' => 'password123',
        ]);

        $token = $this->loginAs($admin);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->json($method, $path)
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_admin_stats_returns_aggregated_totals(): void
    {
        Product::factory()->count(3)->create();
        User::factory()->count(2)->create();

        $admin = User::factory()->admin()->create([
            'email' => 'stats-admin@example.com',
            'password' => 'password123',
        ]);

        $token = $this->loginAs($admin);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/stats')
            ->assertOk();

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'totals' => ['products', 'orders', 'users'],
            ],
        ]);

        $this->assertSame(3, $response->json('data.totals.products'));
    }

    public function test_admin_products_returns_raw_price_without_currency_conversion(): void
    {
        Product::factory()->create([
            'name' => 'Raw Price Product',
            'price' => 199.99,
            'stock' => 10,
        ]);

        $admin = User::factory()->admin()->create([
            'email' => 'rawprice-admin@example.com',
            'password' => 'password123',
        ]);

        $token = $this->loginAs($admin);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/products?per_page=5')
            ->assertOk();

        $response->assertJsonStructure([
            'data' => [
                'products' => [['id', 'name', 'price', 'stock']],
                'pagination' => ['current_page', 'per_page', 'last_page', 'total'],
            ],
        ]);

        // The admin contract MUST expose raw `price` and MUST NOT carry the
        // presentation-only fields that the storefront response decorates.
        $first = $response->json('data.products.0');
        $this->assertArrayHasKey('price', $first);
        $this->assertArrayNotHasKey('price_in_currency', $first);
        $this->assertArrayNotHasKey('selected_currency', $first);
    }

    public function test_admin_can_update_order_status(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);
        $admin = User::factory()->admin()->create([
            'email' => 'status-admin@example.com',
            'password' => 'password123',
        ]);

        $token = $this->loginAs($admin);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'completed',
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order.status', 'completed');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'completed',
        ]);
    }

    public function test_order_status_update_requires_admin_access(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);

        $this->patchJson("/api/admin/orders/{$order->id}/status", [
            'status' => 'completed',
        ])->assertUnauthorized();

        $token = $this->loginAs(User::factory()->create([
            'email' => 'regular-status@example.com',
            'password' => 'password123',
            'role' => 'user',
        ]));

        $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'completed',
            ])
            ->assertForbidden();
    }

    public function test_order_status_update_rejects_unknown_status(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);
        $admin = User::factory()->admin()->create([
            'email' => 'invalid-status-admin@example.com',
            'password' => 'password123',
        ]);

        $token = $this->loginAs($admin);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'shipped',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    /**
     * Authenticate the given user against the public login endpoint and
     * return the JWT issued in the `X-Auth-Token` response header. We log in
     * via the real flow (rather than minting a token directly) so the test
     * also exercises the cookie/header contract.
     */
    private function loginAs(User $user): string
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertOk();

        return (string) $response->headers->get('X-Auth-Token');
    }
}
