<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminStatsService;
use Illuminate\Http\JsonResponse;

/**
 * Aggregates the three top-level counters surfaced on the admin dashboard.
 * Kept intentionally thin — it is just a read projection over existing
 * repositories. If usage grows (e.g. revenue, last-7d trends) split it
 * into a dedicated AdminStatsService.
 */
class AdminStatsController extends Controller
{
    public function __construct(
        private readonly AdminStatsService $stats,
    ) {
    }

    public function __invoke(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Yonetim ozeti getirildi.',
            'data' => [
                'totals' => $this->stats->totals(),
            ],
        ]);
    }
}
