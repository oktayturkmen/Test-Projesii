<?php

namespace App\Services\Order;

use App\Enums\Currency;
use App\Enums\OrderStatus;
use App\Exceptions\Domain\CartException;
use App\Exceptions\Domain\InventoryException;
use App\Exceptions\Domain\ProductUnavailableException;
use App\Models\Product;
use App\Repositories\Contracts\CartRepositoryInterface;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Services\Contracts\TransactionManagerInterface;
use App\Services\Pricing\CurrencyConversionService;
use App\Support\Pricing;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class OrderService
{
    public function __construct(
        private readonly CartRepositoryInterface $cartRepository,
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly ProductRepositoryInterface $productRepository,
        private readonly CurrencyConversionService $currencyConversionService,
        private readonly TransactionManagerInterface $transactionManager
    ) {
    }

    public function createFromCart(int $userId, string $currency = Currency::BASE->value): array
    {
        $currency = $this->currencyConversionService->normalizeCurrency($currency);
        $rates = $this->currencyConversionService->ratesForTransaction($currency);

        return $this->transactionManager->run(function () use ($userId, $currency, $rates) {
            $cart = $this->cartRepository->firstOrCreateByUserId($userId);
            $cartItems = $this->cartRepository->getItemsByCartIdForUpdate($cart->id);

            if ($cartItems->isEmpty()) {
                throw new CartException('Cart is empty.');
            }

            $lockedProducts = $this->lockProductsForCart($cartItems);
            $orderLines = $this->buildOrderLines($cartItems, $lockedProducts, $currency, $rates);

            $order = $this->orderRepository->create([
                'user_id' => $userId,
                'status' => OrderStatus::Pending->value,
                'total_price' => $this->sumLineTotals($orderLines),
                'currency' => $currency,
            ]);

            $this->orderRepository->createItems($order, $orderLines);
            $this->decrementStocks($orderLines);
            $this->cartRepository->clearItemsByIds(
                $cart->id,
                $cartItems->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all(),
            );

            $order->load(['items.product']);

            return [
                'order' => $order,
            ];
        });
    }

    public function listByUser(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->orderRepository->listByUserId($userId, $perPage);
    }

    public function showForUser(int $userId, int $orderId): object
    {
        return $this->orderRepository->findByUserIdOrFail($userId, $orderId);
    }

    /**
     * @param Collection<int, \App\Models\CartItem> $cartItems
     * @return Collection<int, Product> keyed by product id
     */
    private function lockProductsForCart(Collection $cartItems): Collection
    {
        $productIds = $cartItems
            ->pluck('product_id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->unique()
            ->values()
            ->all();

        $lockedProducts = $this->productRepository->findManyForUpdate($productIds);

        if ($lockedProducts->count() !== count($productIds)) {
            throw new ProductUnavailableException('Some products in cart were not found.');
        }

        return $lockedProducts;
    }

    /**
     * @param Collection<int, \App\Models\CartItem> $cartItems
     * @param Collection<int, Product> $lockedProducts
     * @param array<string, float>|null $rates
     * @return array<int, array<string, mixed>>
     */
    private function buildOrderLines(
        Collection $cartItems,
        Collection $lockedProducts,
        string $currency,
        ?array $rates
    ): array {
        return $cartItems->map(function ($item) use ($currency, $rates, $lockedProducts): array {
            $productId = (int) $item->product_id;
            $product = $lockedProducts->get($productId);

            if (! $product) {
                throw new ProductUnavailableException('Some products in cart were not found.');
            }

            $quantity = (int) $item->quantity;

            if ((int) $product->stock < $quantity) {
                throw new InventoryException("Insufficient stock for product #{$product->id}.");
            }

            $unitPrice = $this->currencyConversionService->convert(
                (string) $product->price,
                $currency,
                $rates
            );

            return [
                'product_id' => $productId,
                'product_name' => (string) $product->name,
                'product_sku' => 'PRD-'.$product->id,
                'product_image' => $product->image,
                'quantity' => $quantity,
                'price' => $unitPrice,
            ];
        })->values()->all();
    }

    /**
     * @param array<int, array<string, mixed>> $orderLines
     */
    private function sumLineTotals(array $orderLines): string
    {
        $total = Pricing::zero();

        foreach ($orderLines as $line) {
            $lineTotal = Pricing::multiply((string) $line['price'], (int) $line['quantity']);
            $total = Pricing::add($total, $lineTotal);
        }

        return $total;
    }

    /**
     * @param array<int, array<string, mixed>> $orderLines
     */
    private function decrementStocks(array $orderLines): void
    {
        $idToQuantity = [];

        foreach ($orderLines as $line) {
            $productId = (int) $line['product_id'];
            // Aggregate quantities so the same product appearing on multiple
            // lines still produces a single CASE branch.
            $idToQuantity[$productId] = ($idToQuantity[$productId] ?? 0) + (int) $line['quantity'];
        }

        $this->productRepository->decrementStocksBatch($idToQuantity);
    }
}
