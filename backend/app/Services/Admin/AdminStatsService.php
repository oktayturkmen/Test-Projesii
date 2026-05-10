<?php

namespace App\Services\Admin;

use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;

class AdminStatsService
{
    public function __construct(
        private readonly ProductRepositoryInterface $products,
        private readonly OrderRepositoryInterface $orders,
        private readonly UserRepositoryInterface $users,
    ) {
    }

    /**
     * @return array{products: int, orders: int, users: int}
     */
    public function totals(): array
    {
        return [
            'products' => $this->products->count(),
            'orders' => $this->orders->count(),
            'users' => $this->users->count(),
        ];
    }
}
