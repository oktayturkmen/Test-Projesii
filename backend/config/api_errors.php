<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Domain Error -> HTTP Status Code Map
    |--------------------------------------------------------------------------
    |
    | Status code policy (single source of truth, kept in lockstep with tests):
    |
    |   - 422  Validation / business logic violations. The request was
    |          syntactically valid and authenticated, but the application
    |          state or the supplied data prevents fulfilment.
    |   - 502  Upstream / proxy / external service communication failures.
    |          Anything that depends on a network hop outside our control
    |          (currency providers, third-party APIs, ...).
    |
    | Adding a new domain exception? Pick the bucket above; do not introduce
    | additional 4xx/5xx variants without updating tests AND
    | ApiDomainExceptionResponder consumers.
    |
    */
    'status_codes' => [
        // Business logic (422)
        'cart_error' => 422,
        'inventory_error' => 422,
        'product_has_orders' => 422,
        'product_unavailable' => 422,
        'unsupported_base_currency' => 422,
        'unsupported_currency' => 422,

        // Upstream / external service (502)
        'currency_provider_unavailable' => 502,
    ],

    /*
    |--------------------------------------------------------------------------
    | Exact Runtime Error Messages
    |--------------------------------------------------------------------------
    |
    | Use this map when the technical exception message is deterministic and
    | should be converted to a stable user-facing message one-to-one.
    |
    */
    'messages' => [
        'currency_provider_unavailable'
            => 'Kur bilgisi su anda alinamiyor. Lutfen kisa bir sure sonra tekrar deneyin.',
        'inventory_error'
            => 'Eklenmek istenen adet mevcut stogu asiyor.',
        'unsupported_currency'
            => 'Desteklenmeyen para birimi.',
        'unsupported_base_currency'
            => 'Desteklenmeyen baz para birimi.',
        'product_unavailable'
            => 'Sepetteki urunlerden biri bulunamadi.',
        'product_has_orders'
            => 'Bu urun siparis gecmisinde kullanildigi icin silinemez.',
    ],
    /*
    |--------------------------------------------------------------------------
    | Prefix-based Runtime Error Messages
    |--------------------------------------------------------------------------
    |
    | Use this map for dynamic exception messages that include variable data
    | (e.g. IDs). Key is the technical prefix, value is user-facing message.
    |
    */
    'prefix_messages' => [],
];
