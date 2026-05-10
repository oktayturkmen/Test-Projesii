<?php

namespace Tests\Feature\Cart;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartItemModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_cart_item_relationships_work_properly(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();
        $cart = Cart::factory()->create(['user_id' => $user->id]);

        $item = CartItem::query()->create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $this->assertSame($cart->id, $item->cart->id);
        $this->assertSame($product->id, $item->product->id);
        $this->assertCount(1, $cart->items);
    }
}
