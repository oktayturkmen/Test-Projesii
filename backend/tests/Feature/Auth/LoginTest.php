<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_without_exposing_token_in_body(): void
    {
        User::query()->create([
            'name' => 'Login User',
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertHeader('X-Auth-Token')
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Giris basarili.')
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'created_at', 'updated_at'],
                ],
            ])
            ->assertJsonMissingPath('data.token');
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::query()->create([
            'name' => 'Login User',
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Gecersiz kimlik bilgileri.');
    }
}
