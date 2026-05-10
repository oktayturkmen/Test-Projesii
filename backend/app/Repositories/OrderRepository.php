<?php

namespace App\Repositories;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Repositories\Contracts\OrderRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class OrderRepository implements OrderRepositoryInterface
{
    public function create(array $data): Order
    {
        return Order::query()->create($data);
    }

    public function createItems(Order $order, array $items): void
    {
        $order->items()->createMany($items);
    }

    public function listByUserId(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return Order::query()
            ->with(['items.product'])
            ->where('user_id', $userId)
            ->latest()
            ->paginate($perPage);
    }

    public function findByUserIdOrFail(int $userId, int $orderId): Order
    {
        return Order::query()
            ->with(['items.product'])
            ->where('user_id', $userId)
            ->whereKey($orderId)
            ->firstOrFail();
    }

    public function paginateAll(int $perPage = 20): LengthAwarePaginator
    {
        return Order::query()
            ->with(['items.product', 'user:id,name,email'])
            ->latest()
            ->paginate($perPage);
    }

    public function updateStatus(int $orderId, OrderStatus $status): Order
    {
        $order = Order::query()
            ->with(['items.product', 'user:id,name,email'])
            ->findOrFail($orderId);

        $order->status = $status->value;
        $order->save();

        return $order->refresh()->load(['items.product', 'user:id,name,email']);
    }

    public function count(): int
    {
        return Order::query()->count();
    }
}
