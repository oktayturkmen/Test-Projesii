<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class LogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_logout_and_token_becomes_invalid(): void
    {
        Config::set('cache.default', 'database');
        Config::set('jwt.blacklist_enabled', true);

        User::query()->create([
            'name' => 'Logout User',
            'email' => 'logout@example.com',
            'password' => 'password123',
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'logout@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->headers->get('X-Auth-Token');

        $logoutResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout');

        $logoutResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Cikis basarili.');

        $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');

        $meResponse->assertUnauthorized();
    }
}
