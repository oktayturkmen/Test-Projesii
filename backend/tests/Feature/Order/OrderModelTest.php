<?php

namespace Tests\Feature\Order;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_model_relationships_work_with_database(): void
    {
        $user = User::factory()->create();

        $order = Order::query()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'total_price' => 120.50,
            'currency' => 'TRY',
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        $this->assertSame($user->id, $order->user->id);
    }
}
