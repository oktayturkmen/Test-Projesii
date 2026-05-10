<?php

namespace Tests\Feature\Product;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_model_works_with_products_table(): void
    {
        $product = Product::query()->create([
            'name' => 'Test Product',
            'description' => 'Test Description',
            'price' => 199.99,
            'stock' => 15,
            'image' => 'https://example.com/product.jpg',
        ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Test Product',
            'stock' => 15,
        ]);

        $this->assertSame('199.99', $product->price);
    }
}
