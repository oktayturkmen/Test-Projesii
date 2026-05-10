<?php

namespace App\Services\Cart;

use App\Exceptions\Domain\CartException;
use App\Exceptions\Domain\InventoryException;
use App\Exceptions\Domain\ProductUnavailableException;
use App\Repositories\Contracts\CartRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Services\Contracts\TransactionManagerInterface;
use App\Services\Pricing\CurrencyConversionService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;

class CartService
{
    public function __construct(
        private readonly CartRepositoryInterface $cartRepository,
        private readonly ProductRepositoryInterface $productRepository,
        private readonly CurrencyConversionService $currencyConversionService,
        private readonly TransactionManagerInterface $transactionManager
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function addItem(int $userId, array $payload): array
    {
        return $this->runWithUniqueConstraintRetry(function () use ($userId, $payload): array {
            $cart = $this->cartRepository->firstOrCreateByUserId($userId);
            $productId = (int) $payload['product_id'];
            $quantityToAdd = (int) $payload['quantity'];

            $product = $this->productRepository->findForUpdate($productId);
            if (! $product) {
                throw new ProductUnavailableException('Product not found.');
            }

            $existingItem = $this->cartRepository->findItemByCartAndProductForUpdate($cart->id, $productId);

            $currentQuantity = (int) ($existingItem?->quantity ?? 0);
            $nextQuantity = $currentQuantity + $quantityToAdd;

            if ($nextQuantity > (int) $product->stock) {
                throw new InventoryException('Requested quantity exceeds available stock.');
            }

            if ($existingItem) {
                $item = $this->cartRepository->updateItemQuantity($existingItem, $nextQuantity);
            } else {
                $item = $this->cartRepository->createItem([
                    'cart_id' => $cart->id,
                    'product_id' => $productId,
                    'quantity' => $quantityToAdd,
                ]);
            }

            $item->load('product');

            return [
                'cart_id' => $cart->id,
                'item' => $item,
            ];
        });
    }

    private function runWithUniqueConstraintRetry(callable $callback): array
    {
        for ($attempt = 0; $attempt < 2; $attempt++) {
            try {
                return $this->transactionManager->run($callback);
            } catch (QueryException $exception) {
                if ($attempt === 0 && $this->isUniqueConstraintViolation($exception)) {
                    continue;
                }

                throw $exception;
            }
        }

        throw new CartException('Cart item could not be created.');
    }

    private function isUniqueConstraintViolation(QueryException $exception): bool
    {
        $sqlState = (string) ($exception->errorInfo[0] ?? '');
        $driverCode = (string) ($exception->errorInfo[1] ?? '');

        return $sqlState === '23000' || in_array($driverCode, ['1062', '19'], true);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function updateItem(int $userId, array $payload): array
    {
        return $this->transactionManager->run(function () use ($userId, $payload): array {
            $cartItemId = (int) $payload['cart_item_id'];
            $quantity = (int) $payload['quantity'];
            $item = $this->cartRepository->findItemByIdForUser($userId, $cartItemId);

            if (! $item) {
                throw new CartException('Cart item not found.');
            }

            $product = $this->productRepository->findForUpdate((int) $item->product_id);
            if (! $product) {
                throw new ProductUnavailableException('Product not found.');
            }

            if ($quantity > (int) $product->stock) {
                throw new InventoryException('Requested quantity exceeds available stock.');
            }

            $updatedItem = $this->cartRepository->updateItemQuantity($item, $quantity);
            $updatedItem->load('product');

            return [
                'cart_id' => (int) $updatedItem->cart_id,
                'item' => $updatedItem,
            ];
        });
    }

    public function removeItem(int $userId, int $cartItemId): bool
    {
        $cart = $this->cartRepository->firstOrCreateByUserId($userId);

        return $this->cartRepository->removeItemById($cart->id, $cartItemId);
    }

    /**
     * @return array{cart_id: int, items: Collection<int, \App\Models\CartItem>}
     */
    public function listItems(int $userId, string $currency = 'TRY'): array
    {
        $currency = $this->currencyConversionService->normalizeCurrency($currency);
        $cart = $this->cartRepository->firstOrCreateByUserId($userId);
        $items = $this->cartRepository->getItemsByCartId($cart->id);
        $rates = $this->currencyConversionService->ratesForDisplay($currency);

        $mappedItems = $items->map(function ($item) use ($currency, $rates) {
            if (! $item->product) {
                return $item;
            }

            $this->currencyConversionService->decorateProduct($item->product, $currency, $rates);

            return $item;
        });

        return [
            'cart_id' => $cart->id,
            'items' => $mappedItems,
        ];
    }
}
