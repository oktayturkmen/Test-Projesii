<?php

namespace App\Repositories\Contracts;

use App\Models\Order;
use App\Enums\OrderStatus;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface OrderRepositoryInterface
{
    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): Order;

    /**
     * @param array<int, array<string, mixed>> $items
     */
    public function createItems(Order $order, array $items): void;

    public function listByUserId(int $userId, int $perPage = 15): LengthAwarePaginator;

    public function findByUserIdOrFail(int $userId, int $orderId): Order;

    /**
     * Admin-scope listing across all users (eager-loads buyer + items.product
     * so the admin order grid does not trigger N+1 queries).
     */
    public function paginateAll(int $perPage = 20): LengthAwarePaginator;

    public function updateStatus(int $orderId, OrderStatus $status): Order;

    public function count(): int;
}
