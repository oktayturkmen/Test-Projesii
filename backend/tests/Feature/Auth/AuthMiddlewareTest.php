<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_protected_route_cannot_be_accessed_without_token(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertUnauthorized();
    }

    public function test_protected_route_can_be_accessed_with_valid_token(): void
    {
        User::query()->create([
            'name' => 'Auth User',
            'email' => 'auth@example.com',
            'password' => 'password123',
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'auth@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->headers->get('X-Auth-Token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Kimligi dogrulanmis kullanici getirildi.')
            ->assertJsonPath('data.user.email', 'auth@example.com');
    }
}
