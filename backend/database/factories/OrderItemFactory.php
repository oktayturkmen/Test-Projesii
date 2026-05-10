<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Order items keep a snapshot of the product image at purchase time;
        // when seeding tests we don't want to fabricate URLs that don't exist
        // anywhere. Real flows will copy the value from `products.image`.
        return [
            'order_id' => Order::factory(),
            'product_id' => Product::factory(),
            'product_name' => fake()->words(3, true),
            'product_sku' => 'PRD-'.fake()->unique()->numberBetween(1000, 9999),
            'product_image' => null,
            'quantity' => fake()->numberBetween(1, 5),
            'price' => fake()->randomFloat(2, 10, 10000),
        ];
    }
}
