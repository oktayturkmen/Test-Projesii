<?php

/**
 * Backend Proxy Isolation Contract
 *
 * The Laravel API is intended to be reachable ONLY through the Next.js proxy
 * layer in production. The shared secret defined here is enforced by
 * `EnsureProxyRequest` middleware (per-request) and validated for presence by
 * `AppServiceProvider::assertEnvironmentInvariants()` (per-deploy).
 *
 * Both code paths MUST read from this single source of truth — never call
 * `env('BACKEND_PROXY_SECRET')` directly elsewhere — so the contract stays
 * coherent and `php artisan config:cache` keeps working in production.
 */
$configuredSecret = trim((string) env('BACKEND_PROXY_SECRET', ''));

return [
    /*
    |--------------------------------------------------------------------------
    | Shared secret with the Next.js proxy
    |--------------------------------------------------------------------------
    |
    | The Next.js proxy attaches this value as the `X-Proxy-Secret` header on
    | every request it forwards. An empty string is tolerated only for
    | environments explicitly listed in `optional_environments`.
    */
    'secret' => $configuredSecret,

    /*
    |--------------------------------------------------------------------------
    | Header that carries the secret
    |--------------------------------------------------------------------------
    */
    'header' => 'X-Proxy-Secret',

    /*
    |--------------------------------------------------------------------------
    | Environments where running without a proxy secret is tolerated
    |--------------------------------------------------------------------------
    |
    | Any environment NOT listed here must resolve a non-empty `secret` or the
    | application will refuse to boot / reject proxied routes.
    */
    'optional_environments' => ['testing'],
];
