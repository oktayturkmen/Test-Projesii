<?php

namespace App\Repositories\Contracts;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ProductRepositoryInterface
{
    public function paginate(int $perPage = 15, ?string $priceSort = null): LengthAwarePaginator;

    public function count(): int;

    public function findOrFail(int $id): Product;

    public function findForUpdate(int $id): ?Product;

    /**
     * @param array<int, int> $ids
     * @return Collection<int, Product>
     */
    public function findManyForUpdate(array $ids): Collection;

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): Product;

    /**
     * @param array<string, mixed> $data
     */
    public function update(Product $product, array $data): Product;

    public function delete(Product $product): bool;

    public function decrementStock(int $id, int $quantity): void;

    /**
     * Atomic, single-statement decrement for many products in one round trip.
     *
     * @param array<int, int> $idToQuantity Map of product id => quantity.
     */
    public function decrementStocksBatch(array $idToQuantity): void;

    public function hasOrderItems(int $id): bool;
}
