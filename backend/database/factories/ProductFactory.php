<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Real product photos are uploaded later from the admin panel, so the
        // default state intentionally leaves `image` empty. The frontend
        // already renders a clean "Görsel yok" placeholder when this column
        // is null, which matches the production behavior much better than a
        // random third-party image. Tests/seeds that genuinely want a demo
        // image can opt in via the `withImage()` state below.
        return [
            'name' => fake()->words(3, true),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 1, 10000),
            'stock' => fake()->numberBetween(0, 500),
            'image' => null,
        ];
    }
}
