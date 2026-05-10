<?php

namespace App\Services\Admin;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Repositories\Contracts\OrderRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AdminOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orders,
    ) {
    }

    public function list(int $perPage): LengthAwarePaginator
    {
        return $this->orders->paginateAll($perPage);
    }

    public function updateStatus(int $orderId, OrderStatus $status): Order
    {
        return $this->orders->updateStatus($orderId, $status);
    }
}
