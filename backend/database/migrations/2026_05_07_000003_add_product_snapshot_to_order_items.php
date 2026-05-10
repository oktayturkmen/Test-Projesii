<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('order_items', 'product_name')) {
            return;
        }

        Schema::table('order_items', function (Blueprint $table): void {
            $table->string('product_name')->nullable()->after('product_id');
            $table->string('product_sku')->nullable()->after('product_name');
            $table->string('product_image')->nullable()->after('product_sku');
        });

        $items = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->select([
                'order_items.id',
                'products.id as product_id',
                'products.name',
                'products.image',
            ])
            ->get();

        foreach ($items as $item) {
            DB::table('order_items')
                ->where('id', $item->id)
                ->update([
                    'product_name' => $item->name,
                    'product_sku' => 'PRD-'.$item->product_id,
                    'product_image' => $item->image,
                ]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('order_items', 'product_name')) {
            return;
        }

        Schema::table('order_items', function (Blueprint $table): void {
            $table->dropColumn(['product_name', 'product_sku', 'product_image']);
        });
    }
};
