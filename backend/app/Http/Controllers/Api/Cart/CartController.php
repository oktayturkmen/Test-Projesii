<?php

namespace App\Http\Controllers\Api\Cart;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\AddToCartRequest;
use App\Http\Requests\Cart\IndexCartRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Http\Resources\CartItemResource;
use App\Services\Cart\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(
        private readonly CartService $cartService
    ) {
    }

    public function index(IndexCartRequest $request): JsonResponse
    {
        $payload = $this->cartService->listItems(
            (int) $request->user()->id,
            $request->resolveCurrency(),
        );

        return response()->json([
            'success' => true,
            'message' => 'Sepet basariyla getirildi.',
            'data' => [
                'cart_id' => $payload['cart_id'],
                'items' => CartItemResource::collection($payload['items'])->resolve($request),
            ],
        ]);
    }

    public function add(AddToCartRequest $request): JsonResponse
    {
        $payload = $this->cartService->addItem((int) $request->user()->id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Urun sepete basariyla eklendi.',
            'data' => [
                'cart_id' => $payload['cart_id'],
                'item' => (new CartItemResource($payload['item']))->resolve($request),
            ],
        ], 201);
    }

    public function update(UpdateCartItemRequest $request): JsonResponse
    {
        $payload = $this->cartService->updateItem((int) $request->user()->id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Sepet urunu basariyla guncellendi.',
            'data' => [
                'cart_id' => $payload['cart_id'],
                'item' => (new CartItemResource($payload['item']))->resolve($request),
            ],
        ]);
    }

    public function remove(Request $request, int $id): JsonResponse
    {
        $removed = $this->cartService->removeItem((int) $request->user()->id, $id);

        if (! $removed) {
            return response()->json([
                'success' => false,
                'message' => 'Sepet urunu bulunamadi.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Urun sepetten basariyla kaldirildi.',
        ]);
    }
}
