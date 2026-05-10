<?php

namespace Tests\Feature\Order;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderItemModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_item_relationships_work_properly(): void
    {
        $order = Order::factory()->create();
        $product = Product::factory()->create();

        $item = OrderItem::query()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => 'PRD-'.$product->id,
            'product_image' => $product->image,
            'quantity' => 2,
            'price' => 99.90,
        ]);

        $this->assertSame($order->id, $item->order->id);
        $this->assertSame($product->id, $item->product->id);
        $this->assertCount(1, $order->items);
    }
}
