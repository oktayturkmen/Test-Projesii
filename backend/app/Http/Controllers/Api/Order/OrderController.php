<?php

namespace App\Http\Controllers\Api\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\IndexOrderRequest;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Services\Order\OrderService;
use App\Support\PaginationMeta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService
    ) {
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $payload = $this->orderService->createFromCart(
            (int) $request->user()->id,
            $request->resolveCurrency(),
        );

        return response()->json([
            'success' => true,
            'message' => 'Siparis basariyla olusturuldu.',
            'data' => [
                'order' => (new OrderResource($payload['order']))->resolve($request),
            ],
        ], 201);
    }

    public function index(IndexOrderRequest $request): JsonResponse
    {
        $orders = $this->orderService->listByUser(
            (int) $request->user()->id,
            $request->resolvePerPage(),
        );

        return response()->json([
            'success' => true,
            'message' => 'Siparisler basariyla getirildi.',
            'data' => [
                'orders' => OrderResource::collection($orders->getCollection())->resolve($request),
                'pagination' => PaginationMeta::from($orders),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $order = $this->orderService->showForUser((int) $request->user()->id, $id);

        return response()->json([
            'success' => true,
            'message' => 'Siparis basariyla getirildi.',
            'data' => [
                'order' => (new OrderResource($order))->resolve($request),
            ],
        ]);
    }
}
