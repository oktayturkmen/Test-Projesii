<?php

namespace App\Repositories\Contracts;

use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Support\Collection;

interface CartRepositoryInterface
{
    public function firstOrCreateByUserId(int $userId): Cart;

    public function findItemByCartAndProduct(int $cartId, int $productId): ?CartItem;

    public function findItemByCartAndProductForUpdate(int $cartId, int $productId): ?CartItem;

    public function findItemByIdForUser(int $userId, int $cartItemId): ?CartItem;

    /**
     * @param array<string, mixed> $data
     */
    public function createItem(array $data): CartItem;

    public function updateItemQuantity(CartItem $item, int $quantity): CartItem;

    public function removeItemById(int $cartId, int $cartItemId): bool;

    /**
     * @param array<int, int> $cartItemIds
     */
    public function clearItemsByIds(int $cartId, array $cartItemIds): void;

    /**
     * @return Collection<int, CartItem>
     */
    public function getItemsByCartId(int $cartId): Collection;

    /**
     * @return Collection<int, CartItem>
     */
    public function getItemsByCartIdForUpdate(int $cartId): Collection;
}
