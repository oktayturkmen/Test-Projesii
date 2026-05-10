<?php

namespace App\Repositories;

use App\Exceptions\Domain\ProductUnavailableException;
use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProductRepository implements ProductRepositoryInterface
{
    public function paginate(int $perPage = 15, ?string $priceSort = null): LengthAwarePaginator
    {
        $query = Product::query();

        if ($priceSort === 'price_asc') {
            $query->orderBy('price', 'asc')->orderBy('id', 'asc');
        } elseif ($priceSort === 'price_desc') {
            $query->orderBy('price', 'desc')->orderBy('id', 'desc');
        } else {
            $query->latest();
        }

        return $query->paginate($perPage);
    }

    public function count(): int
    {
        return Product::query()->count();
    }

    public function findOrFail(int $id): Product
    {
        try {
            return Product::query()->findOrFail($id);
        } catch (ModelNotFoundException) {
            throw new ProductUnavailableException("Product #{$id} not found.");
        }
    }

    public function findForUpdate(int $id): ?Product
    {
        return Product::query()->whereKey($id)->lockForUpdate()->first();
    }

    public function findManyForUpdate(array $ids): Collection
    {
        return Product::query()
            ->whereIn('id', $ids)
            ->lockForUpdate()
            ->get()
            ->keyBy('id');
    }

    public function create(array $data): Product
    {
        return Product::query()->create($data);
    }

    public function update(Product $product, array $data): Product
    {
        $product->fill($data);
        $product->save();

        return $product->refresh();
    }

    public function delete(Product $product): bool
    {
        return (bool) $product->delete();
    }

    public function decrementStock(int $id, int $quantity): void
    {
        Product::query()->whereKey($id)->decrement('stock', $quantity);
    }

    public function decrementStocksBatch(array $idToQuantity): void
    {
        if (empty($idToQuantity)) {
            return;
        }

        $cases = [];
        foreach ($idToQuantity as $id => $quantity) {
            // (int) casts make the values safe to inline; using bindings
            // through DB::raw() in an Eloquent update() is awkward and the
            // values are always integer ids/quantities here.
            $cases[] = 'WHEN '.(int) $id.' THEN '.(int) $quantity;
        }

        $caseSql = 'stock - (CASE id '.implode(' ', $cases).' ELSE 0 END)';

        Product::query()
            ->whereIn('id', array_keys($idToQuantity))
            ->update([
                'stock' => DB::raw($caseSql),
            ]);
    }

    public function hasOrderItems(int $id): bool
    {
        return Product::query()
            ->whereKey($id)
            ->whereHas('orderItems')
            ->exists();
    }
}
