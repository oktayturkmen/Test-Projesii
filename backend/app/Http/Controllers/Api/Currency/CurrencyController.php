<?php

namespace App\Http\Controllers\Api\Currency;

use App\DTOs\CurrencyRatesData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Currency\CurrencyRatesRequest;
use App\Services\Currency\CurrencyService;
use Illuminate\Http\JsonResponse;

class CurrencyController extends Controller
{
    public function __construct(
        private readonly CurrencyService $currencyService
    ) {
    }

    public function rates(CurrencyRatesRequest $request): JsonResponse
    {
        $base = $request->resolveCurrency('base');

        $rates = $this->currencyService->getRates($base);

        return response()->json([
            'success' => true,
            'message' => 'Kur oranlari basariyla getirildi.',
            'data' => (new CurrencyRatesData($base, $rates))->toArray(),
        ]);
    }
}
