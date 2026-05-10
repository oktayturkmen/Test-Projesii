<?php

namespace App\Services\Product;

use App\Exceptions\Domain\ProductDeletionException;
use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Services\Pricing\CurrencyConversionService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductService
{
    public function __construct(
        private readonly ProductRepositoryInterface $productRepository,
        private readonly CurrencyConversionService $currencyConversionService
    ) {
    }

    public function list(int $perPage = 15, string $currency = 'TRY', ?string $priceSort = null): LengthAwarePaginator
    {
        $currency = $this->currencyConversionService->normalizeCurrency($currency);
        $paginator = $this->productRepository->paginate($perPage, $priceSort);
        $rates = $this->currencyConversionService->ratesForDisplay($currency);
        $collection = $paginator->getCollection()->map(
            fn (Product $product): Product => $this->currencyConversionService->decorateProduct($product, $currency, $rates)
        );
        $paginator->setCollection($collection);

        return $paginator;
    }

    public function show(int $id, string $currency = 'TRY'): Product
    {
        $product = $this->productRepository->findOrFail($id);
        $currency = $this->currencyConversionService->normalizeCurrency($currency);
        $rates = $this->currencyConversionService->ratesForDisplay($currency);

        return $this->currencyConversionService->decorateProduct($product, $currency, $rates);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): Product
    {
        return $this->productRepository->create($payload);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function update(int $id, array $payload): Product
    {
        $product = $this->productRepository->findOrFail($id);

        return $this->productRepository->update($product, $payload);
    }

    public function delete(int $id): bool
    {
        $product = $this->productRepository->findOrFail($id);

        if ($this->productRepository->hasOrderItems($id)) {
            throw new ProductDeletionException('Product has historical order items and cannot be deleted.');
        }

        return $this->productRepository->delete($product);
    }
}
