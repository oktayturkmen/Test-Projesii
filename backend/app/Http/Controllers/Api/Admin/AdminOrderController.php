<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexAdminListRequest;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Services\Admin\AdminOrderService;
use App\Support\PaginationMeta;
use Illuminate\Http\JsonResponse;

/**
 * Admin-scope listing across every customer's orders. Re-uses OrderResource
 * (which conditionally surfaces the buyer when the `user` relation is
 * eager-loaded) so we don't leak a parallel resource definition.
 */
class AdminOrderController extends Controller
{
    public function __construct(
        private readonly AdminOrderService $orders,
    ) {
    }

    public function index(IndexAdminListRequest $request): JsonResponse
    {
        $orders = $this->orders->list($request->resolvePerPage());

        return response()->json([
            'success' => true,
            'message' => 'Tum siparisler getirildi.',
            'data' => [
                'orders' => OrderResource::collection($orders->getCollection())->resolve($request),
                'pagination' => PaginationMeta::from($orders),
            ],
        ]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, int $id): JsonResponse
    {
        $order = $this->orders->updateStatus($id, $request->resolveStatus());

        return response()->json([
            'success' => true,
            'message' => 'Siparis durumu guncellendi.',
            'data' => [
                'order' => (new OrderResource($order))->resolve($request),
            ],
        ]);
    }
}
