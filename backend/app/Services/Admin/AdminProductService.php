<?php

namespace App\Services\Admin;

use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AdminProductService
{
    public function __construct(
        private readonly ProductRepositoryInterface $products,
    ) {
    }

    public function list(int $perPage): LengthAwarePaginator
    {
        return $this->products->paginate($perPage);
    }

    public function show(int $id): Product
    {
        return $this->products->findOrFail($id);
    }
}
