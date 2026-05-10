<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexAdminListRequest;
use App\Http\Resources\ProductResource;
use App\Services\Admin\AdminProductService;
use App\Support\PaginationMeta;
use Illuminate\Http\JsonResponse;

/**
 * Admin-scope product reads.
 *
 * Customer-facing `ProductController` accepts a `currency` query parameter
 * and decorates the response with `price_in_currency` / `selected_currency`
 * for the storefront. Admin write-paths (price edits, stock updates) must
 * never see those decorated values, otherwise an admin viewing a USD-priced
 * row would round-trip the converted number back as the new raw price.
 *
 * This controller exposes a minimal, currency-free read contract that the
 * admin panel can pair with the existing POST/PUT/DELETE endpoints.
 */
class AdminProductController extends Controller
{
    public function __construct(
        private readonly AdminProductService $products,
    ) {
    }

    public function index(IndexAdminListRequest $request): JsonResponse
    {
        $products = $this->products->list($request->resolvePerPage());

        return response()->json([
            'success' => true,
            'message' => 'Yonetim icin urunler getirildi.',
            'data' => [
                'products' => ProductResource::collection($products->getCollection())->resolve($request),
                'pagination' => PaginationMeta::from($products),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $product = $this->products->show($id);

        return response()->json([
            'success' => true,
            'message' => 'Yonetim icin urun getirildi.',
            'data' => (new ProductResource($product))->resolve(),
        ]);
    }
}
