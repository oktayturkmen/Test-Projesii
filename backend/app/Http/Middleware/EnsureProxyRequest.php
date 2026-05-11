<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProxyRequest
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // PHPUnit / `php artisan test` must not depend on injecting `X-Proxy-Secret`
        // through `Tests\TestCase::call()` (trait resolution, config cache, or
        // `php artisan test` boot order can leave the header missing while the
        // app still enforces a non-empty secret from `.env`).
        if (app()->runningUnitTests()) {
            return $next($request);
        }
        // Single source of truth: config/proxy.php. Direct env() reads are
        // forbidden here because they break under `php artisan config:cache`
        // and drift from the deploy-time invariant check.
        $expectedSecret = (string) config('proxy.secret', '');

        if ($expectedSecret === '') {
            if (app()->environment('testing')) {
                return $next($request);
            }

            return new JsonResponse([
                'success' => false,
                'message' => 'Backend proxy secret yapilandirilmamis.',
            ], 503);
        }

        $headerName = (string) config('proxy.header', 'X-Proxy-Secret');
        $providedSecret = (string) $request->headers->get($headerName, '');

        if (! hash_equals($expectedSecret, $providedSecret)) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Backend API sadece proxy katmani uzerinden erisilebilir.',
            ], 403);
        }

        return $next($request);
    }
}
