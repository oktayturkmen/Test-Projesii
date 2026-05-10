<?php

namespace App\Http\Controllers\Api\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\IndexProductRequest;
use App\Http\Requests\Product\ShowProductRequest;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Services\Product\ProductService;
use App\Support\PaginationMeta;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService
    ) {
    }

    public function index(IndexProductRequest $request): JsonResponse
    {
        $products = $this->productService->list(
            $request->resolvePerPage(),
            $request->resolveCurrency(),
            $request->resolvePriceSort(),
        );

        return response()->json([
            'success' => true,
            'message' => 'Urunler basariyla getirildi.',
            'data' => [
                'products' => ProductResource::collection($products->getCollection())->resolve($request),
                'pagination' => PaginationMeta::from($products),
            ],
        ]);
    }

    public function show(ShowProductRequest $request, int $id): JsonResponse
    {
        $product = $this->productService->show($id, $request->resolveCurrency());

        return response()->json([
            'success' => true,
            'message' => 'Urun basariyla getirildi.',
            'data' => (new ProductResource($product))->resolve($request),
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->productService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Urun basariyla olusturuldu.',
            'data' => (new ProductResource($product))->resolve($request),
        ], 201);
    }

    public function update(UpdateProductRequest $request, int $id): JsonResponse
    {
        $product = $this->productService->update($id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Urun basariyla guncellendi.',
            'data' => (new ProductResource($product))->resolve($request),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->productService->delete($id);

        return response()->json([
            'success' => true,
            'message' => 'Urun basariyla silindi.',
        ]);
    }
}
