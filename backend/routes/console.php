<?php

use App\Enums\UserRole;
use App\Models\User;
use App\Services\Currency\CurrencyService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('user:make-admin {email : User email}', function (string $email) {
    $normalizedEmail = strtolower(trim($email));
    $user = User::query()->whereRaw('LOWER(email) = ?', [$normalizedEmail])->first();

    if (! $user) {
        $this->error("User not found: {$email}");
        return self::FAILURE;
    }

    if ($user->role === UserRole::Admin->value) {
        $this->info("User is already admin: {$user->email}");
        return self::SUCCESS;
    }

    // `role` is intentionally not in $fillable to block mass-assignment
    // privilege escalation, so a plain ->update(['role' => 'admin']) would
    // be silently dropped here. The dedicated setter uses forceFill().
    $user->promoteToAdmin();

    $this->info("User promoted to admin: {$user->email}");
    return self::SUCCESS;
})->purpose('Promote an existing user to admin role');

Artisan::command('currency:warm-cache {--base=TRY : Base currency to warm}', function (CurrencyService $currencyService): int {
    $base = strtoupper((string) $this->option('base'));
    $lockKey = "currency_warm_lock_{$base}";

    $lock = Cache::lock($lockKey, 120);
    if (! $lock->get()) {
        $this->info("Warmup atlandi (lock aktif): {$base}");
        return self::SUCCESS;
    }

    try {
        $rates = $currencyService->refreshRates($base);
    } catch (\Throwable $exception) {
        Log::warning('currency_cache_warm_failed', [
            'base' => $base,
            'message' => $exception->getMessage(),
        ]);

        $this->error("Kur cache warmup basarisiz: {$base}");

        return self::FAILURE;
    } finally {
        optional($lock)->release();
    }

    $this->info("Kur cache refreshed: {$base} (TRY={$rates['TRY']}, USD={$rates['USD']}, EUR={$rates['EUR']})");

    return self::SUCCESS;
})->purpose('Refresh currency rates cache outside request path')
    ->name('currency-warm-cache')
    ->everyFiveMinutes()
    ->withoutOverlapping(10)
    ->onOneServer();

Artisan::command('env:assert-production-safety', function (): int {
    /**
     * Pre-deploy gate. Run with `APP_ENV=production` to verify the env file
     * about to ship satisfies every invariant the application enforces at
     * boot. CI calls this directly so unsafe configs never reach a runtime
     * where they would `abort(500)` after deployment.
     */
    $appEnv = (string) env('APP_ENV', 'local');
    $errors = [];

    $appDebug = filter_var(env('APP_DEBUG', false), FILTER_VALIDATE_BOOL);
    if ($appEnv === 'production' && $appDebug) {
        $errors[] = 'APP_DEBUG must be false in production.';
    }

    $appKey = (string) env('APP_KEY', '');
    if ($appEnv === 'production' && $appKey === '') {
        $errors[] = 'APP_KEY is empty.';
    }

    $jwtSecret = (string) env('JWT_SECRET', '');
    if ($appEnv === 'production' && $jwtSecret === '') {
        $errors[] = 'JWT_SECRET is empty.';
    }

    // Proxy isolation contract is the same one enforced at boot via
    // `AppServiceProvider::assertEnvironmentInvariants()` and per-request via
    // `EnsureProxyRequest`. Verify both pieces are configured together so
    // staging/prod cannot ship with one half wired up.
    $optionalEnvironments = (array) config('proxy.optional_environments', ['testing']);
    $proxySecret = (string) config('proxy.secret', '');
    if (! in_array($appEnv, $optionalEnvironments, true) && $proxySecret === '') {
        $errors[] = "BACKEND_PROXY_SECRET must be configured for environment [{$appEnv}].";
    }

    if ($errors !== []) {
        $this->error('Production safety check failed:');
        foreach ($errors as $error) {
            $this->error('  - '.$error);
        }
        return self::FAILURE;
    }

    $this->info('Production safety check passed.');
    return self::SUCCESS;
})->purpose('Fail deployment if unsafe production env flags are set');
