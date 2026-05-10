<?php

namespace Tests\Feature\Cart;

use App\Models\Cart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_cart_model_works_with_database(): void
    {
        $user = User::factory()->create();

        $cart = Cart::query()->create([
            'user_id' => $user->id,
        ]);

        $this->assertDatabaseHas('carts', [
            'id' => $cart->id,
            'user_id' => $user->id,
        ]);
    }
}
