<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Base & Supported Currencies
    |--------------------------------------------------------------------------
    |
    | The base currency in which prices are stored, and the list of currencies
    | the public API is allowed to convert into. Mirrored in
    | App\Enums\Currency.
    */

    'base' => 'TRY',
    'supported' => ['TRY', 'USD', 'EUR'],

    /*
    |--------------------------------------------------------------------------
    | Cache Policy
    |--------------------------------------------------------------------------
    |
    | fresh_ttl_minutes        -> primary cache window for hot reads
    | snapshot_ttl_minutes     -> long-lived "last good provider answer" used
    |                              when every provider is currently failing
    | transaction_grace_minutes -> max age of a stale snapshot we will trust
    |                               on transactional (orders) flows
    */

    'cache' => [
        'fresh_ttl_minutes' => 5,
        'snapshot_ttl_minutes' => 240,
        'transaction_grace_minutes' => 60,
    ],

    /*
    |--------------------------------------------------------------------------
    | HTTP & Resilience
    |--------------------------------------------------------------------------
    */

    'http' => [
        'timeout_seconds' => 3,
    ],

    'circuit_breaker' => [
        // How long to skip a failing provider before retrying it. Keeps a
        // single dead provider from adding `timeout_seconds * N requests`
        // of latency to every request that hits the resolver.
        'cool_down_seconds' => 60,
    ],

    /*
    |--------------------------------------------------------------------------
    | Provider Chain
    |--------------------------------------------------------------------------
    |
    | The resolver walks the chain in order and stops at the first usable
    | answer. New providers can be added here without modifying any service
    | code (Open/Closed Principle).
    */

    'providers' => [
        'exchangerate_host' => [
            'class' => \App\Services\Currency\Providers\ExchangeRateHostProvider::class,
            'enabled' => true,
        ],
        'open_er_api' => [
            'class' => \App\Services\Currency\Providers\OpenErApiProvider::class,
            'enabled' => true,
        ],
    ],
];
