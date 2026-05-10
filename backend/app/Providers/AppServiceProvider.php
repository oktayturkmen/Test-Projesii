<?php

namespace App\Providers;

use App\Repositories\CartRepository;
use App\Repositories\Contracts\CartRepositoryInterface;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\OrderRepository;
use App\Repositories\ProductRepository;
use App\Repositories\UserRepository;
use App\Services\Contracts\TransactionManagerInterface;
use App\Services\Currency\CurrencyRateCache;
use App\Services\Currency\CurrencyRateResolver;
use App\Services\Infrastructure\LaravelTransactionManager;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(CartRepositoryInterface::class, CartRepository::class);
        $this->app->bind(OrderRepositoryInterface::class, OrderRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, ProductRepository::class);
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(TransactionManagerInterface::class, LaravelTransactionManager::class);

        $this->registerCurrencyServices();
    }

    private function registerCurrencyServices(): void
    {
        $this->app->singleton(CurrencyRateResolver::class, function (Application $app) {
            $providers = collect((array) config('currency.providers', []))
                ->filter(static fn ($cfg): bool => ($cfg['enabled'] ?? true) === true)
                ->map(static fn ($cfg) => $app->make($cfg['class']))
                ->values()
                ->all();

            return new CurrencyRateResolver(
                $providers,
                (int) config('currency.circuit_breaker.cool_down_seconds', 60),
            );
        });

        $this->app->singleton(CurrencyRateCache::class, function (): CurrencyRateCache {
            return new CurrencyRateCache(
                supportedCurrencies: (array) config('currency.supported', ['TRY', 'USD', 'EUR']),
                freshTtlMinutes: (int) config('currency.cache.fresh_ttl_minutes', 5),
                snapshotTtlMinutes: (int) config('currency.cache.snapshot_ttl_minutes', 240),
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->assertEnvironmentInvariants();

        RateLimiter::for('api', function (Request $request): Limit {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth-login', function (Request $request): Limit {
            $email = (string) $request->input('email', '');
            $normalizedEmail = mb_strtolower(trim($email));
            $key = $request->ip().'|'.$normalizedEmail;

            return Limit::perMinute(5)->by($key);
        });

        // Two-tier registration limit:
        //   1) 5/min per (IP + email) — gives a real user headroom for
        //      password-policy retries (typos / casing / digits) while
        //      blocking quick spam against a single mailbox.
        //   2) 20/hour per IP        — caps automated email-cycling attacks
        //      where a botnet rotates `email` to dodge the per-email tier.
        // Returning an array makes Laravel apply the *first hit* as the 429
        // response; both windows must pass for the request to be allowed.
        RateLimiter::for('auth-register', function (Request $request): array {
            $email = (string) $request->input('email', '');
            $normalizedEmail = mb_strtolower(trim($email));
            $perEmailKey = $request->ip().'|'.$normalizedEmail;

            return [
                Limit::perMinute(5)->by($perEmailKey),
                Limit::perHour(20)->by('ip:'.$request->ip()),
            ];
        });

        // Authenticated cart mutations: per-user budget, IP fallback for the
        // edge case where an unauthenticated request slips through.
        RateLimiter::for('cart-write', function (Request $request): Limit {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // Order creation is comparatively expensive (lock-for-update on
        // products + external currency provider). 10/min/user is generous for
        // real users and tight enough to prevent abuse.
        RateLimiter::for('order-write', function (Request $request): Limit {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // Account self-service (profile / password). Tighter than `api` so a
        // compromised session can't grind on password changes, but loose
        // enough to allow legitimate retries on validation errors.
        RateLimiter::for('account-write', function (Request $request): Limit {
            return Limit::perMinute(6)->by($request->user()?->id ?: $request->ip());
        });
    }

    /**
     * Enforces deploy-time invariants that we can only safely check after
     * the env file has been loaded. Bootstrapping these in bootstrap/app.php
     * would silently no-op on local CLI runs, where env() returns null until
     * Laravel's loader runs.
     */
    private function assertEnvironmentInvariants(): void
    {
        if ($this->app->environment('production') && config('app.debug')) {
            throw new \RuntimeException('APP_DEBUG must be false in production.');
        }

        // Proxy isolation contract — read both the secret and the list of
        // tolerated environments from `config/proxy.php` so this check and
        // the per-request `EnsureProxyRequest` middleware stay coherent and
        // survive `php artisan config:cache`.
        $optionalEnvironments = (array) config('proxy.optional_environments', ['testing']);
        $currentEnv = (string) $this->app->environment();

        if (! in_array($currentEnv, $optionalEnvironments, true)
            && (string) config('proxy.secret', '') === ''
        ) {
            throw new \RuntimeException(
                "BACKEND_PROXY_SECRET must be configured for environment [{$currentEnv}]."
            );
        }
    }
}
