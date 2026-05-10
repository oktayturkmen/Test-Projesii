<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthRateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_is_rate_limited_after_five_attempts_per_minute(): void
    {
        User::query()->create([
            'name' => 'Rate Limit User',
            'email' => 'ratelimit@example.com',
            'password' => 'password123',
        ]);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/auth/login', [
                'email' => 'ratelimit@example.com',
                'password' => 'wrong-password',
            ])->assertUnauthorized();
        }

        $response = $this->postJson('/api/auth/login', [
            'email' => 'ratelimit@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(429);
    }

    public function test_register_is_rate_limited_after_five_attempts_per_minute(): void
    {
        $payload = [
            'name' => 'Rate Register User',
            'email' => 'rate-register@example.com',
            'password' => 'Password1234',
            'password_confirmation' => 'Password1234',
        ];

        $this->postJson('/api/auth/register', $payload)->assertCreated();
        $this->postJson('/api/auth/register', $payload)->assertUnprocessable();
        $this->postJson('/api/auth/register', $payload)->assertUnprocessable();
        $this->postJson('/api/auth/register', $payload)->assertUnprocessable();
        $this->postJson('/api/auth/register', $payload)->assertUnprocessable();

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(429);
        $response->assertJsonPath('error_code', 'rate_limited');
        $response->assertJsonStructure(['message', 'retry_after']);
    }

    /**
     * IP-wide hourly cap protects against email-cycling attacks where the
     * per-(IP+email) limiter would otherwise be sidestepped by rotating the
     * `email` field on each request.
     */
    public function test_register_is_rate_limited_per_ip_when_emails_are_rotated(): void
    {
        // 20 distinct emails from the same IP should saturate the IP cap.
        for ($attempt = 1; $attempt <= 20; $attempt++) {
            $this->postJson('/api/auth/register', [
                'name' => "IP Rotator {$attempt}",
                'email' => "rotator-{$attempt}@example.com",
                'password' => 'Password1234',
                'password_confirmation' => 'Password1234',
            ])->assertCreated();
        }

        $response = $this->postJson('/api/auth/register', [
            'name' => 'IP Rotator Overflow',
            'email' => 'rotator-overflow@example.com',
            'password' => 'Password1234',
            'password_confirmation' => 'Password1234',
        ]);

        $response->assertStatus(429);
        $response->assertJsonPath('error_code', 'rate_limited');
    }
}
