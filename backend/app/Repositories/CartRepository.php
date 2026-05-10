<?php

namespace App\Repositories;

use App\Models\Cart;
use App\Models\CartItem;
use App\Repositories\Contracts\CartRepositoryInterface;
use Illuminate\Support\Collection;

class CartRepository implements CartRepositoryInterface
{
    public function firstOrCreateByUserId(int $userId): Cart
    {
        return Cart::query()->firstOrCreate([
            'user_id' => $userId,
        ]);
    }

    public function findItemByCartAndProduct(int $cartId, int $productId): ?CartItem
    {
        return CartItem::query()
            ->where('cart_id', $cartId)
            ->where('product_id', $productId)
            ->first();
    }

    public function findItemByCartAndProductForUpdate(int $cartId, int $productId): ?CartItem
    {
        return CartItem::query()
            ->where('cart_id', $cartId)
            ->where('product_id', $productId)
            ->lockForUpdate()
            ->first();
    }

    public function findItemByIdForUser(int $userId, int $cartItemId): ?CartItem
    {
        return CartItem::query()
            ->where('id', $cartItemId)
            ->whereHas('cart', static function ($query) use ($userId): void {
                $query->where('user_id', $userId);
            })
            ->lockForUpdate()
            ->with('product')
            ->first();
    }

    public function createItem(array $data): CartItem
    {
        return CartItem::query()->create($data);
    }

    public function updateItemQuantity(CartItem $item, int $quantity): CartItem
    {
        $item->update([
            'quantity' => $quantity,
        ]);

        return $item->refresh();
    }

    public function removeItemById(int $cartId, int $cartItemId): bool
    {
        return (bool) CartItem::query()
            ->where('cart_id', $cartId)
            ->where('id', $cartItemId)
            ->delete();
    }

    public function clearItemsByIds(int $cartId, array $cartItemIds): void
    {
        if ($cartItemIds === []) {
            return;
        }

        CartItem::query()
            ->where('cart_id', $cartId)
            ->whereIn('id', $cartItemIds)
            ->delete();
    }

    public function getItemsByCartId(int $cartId): Collection
    {
        return CartItem::query()
            ->with('product')
            ->where('cart_id', $cartId)
            ->orderBy('id')
            ->get();
    }

    public function getItemsByCartIdForUpdate(int $cartId): Collection
    {
        return CartItem::query()
            ->with('product')
            ->where('cart_id', $cartId)
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
    }
}
