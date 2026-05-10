<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $payload = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password1234',
            'password_confirmation' => 'Password1234',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertCreated()
            ->assertHeader('X-Auth-Token')
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Kullanici basariyla kaydedildi.')
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'created_at', 'updated_at'],
                ],
            ])
            ->assertJsonMissingPath('data.token');

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
        ]);
        $this->assertInstanceOf(User::class, User::query()->where('email', 'test@example.com')->first());
    }
}
