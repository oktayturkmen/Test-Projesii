<?php

namespace Tests\Feature\Auth;

use App\Http\Middleware\EnsureAdminAccess;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class AdminAuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_action_is_written_to_audit_log_context(): void
    {
        Log::spy();

        $admin = User::factory()->create([
            'email' => 'admin-audit@example.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $admin->email,
            'password' => 'password123',
        ])->assertOk();

        $token = (string) $loginResponse->headers->get('X-Auth-Token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/products', [
                'name' => 'Audit Product',
                'description' => 'Audit action test product',
                'price' => 99.99,
                'stock' => 5,
                'image' => 'https://example.com/audit-product.jpg',
            ])
            ->assertCreated();

        Log::shouldHaveReceived('info')->withArgs(function (string $message, array $context): bool {
            return $message === 'admin_action'
                && ($context['method'] ?? null) === 'POST'
                && ($context['path'] ?? null) === 'api/products'
                && isset($context['user_id'], $context['user_hash'], $context['ip']);
        })->once();
    }

    public function test_non_admin_denied_attempt_is_written_to_warning_audit_log(): void
    {
        Log::spy();

        $user = User::factory()->create([
            'email' => 'user-audit@example.com',
            'password' => 'password123',
            'role' => 'user',
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertOk();

        $token = (string) $loginResponse->headers->get('X-Auth-Token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/products', [
                'name' => 'Forbidden Product',
                'description' => 'Forbidden action test product',
                'price' => 99.99,
                'stock' => 5,
                'image' => 'https://example.com/forbidden-product.jpg',
            ])
            ->assertForbidden();

        Log::shouldHaveReceived('warning')->withArgs(function (string $message, array $context): bool {
            return $message === 'admin_access_denied'
                && ($context['reason'] ?? null) === 'forbidden'
                && ($context['path'] ?? null) === 'api/products'
                && isset($context['user_id'], $context['user_hash'], $context['ip']);
        })->once();
    }

    public function test_unauthenticated_attempt_is_written_to_warning_audit_log(): void
    {
        Log::spy();

        $request = Request::create('/api/products', 'POST');
        $middleware = new EnsureAdminAccess();

        $response = $middleware->handle($request, fn (): \Symfony\Component\HttpFoundation\Response => response()->noContent());

        $this->assertSame(401, $response->getStatusCode());

        Log::shouldHaveReceived('warning')->withArgs(function (string $message, array $context): bool {
            return $message === 'admin_access_denied'
                && ($context['reason'] ?? null) === 'unauthenticated'
                && ($context['path'] ?? null) === 'api/products'
                && isset($context['ip']);
        })->once();
    }
}
