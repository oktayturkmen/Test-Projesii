<?php

$allowedOrigins = array_values(array_filter(array_map(
    static fn (string $origin): string => trim($origin),
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000'))
)));

$isProduction = env('APP_ENV') === 'production';

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => $isProduction
        ? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
        : ['*'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => $isProduction
        ? ['Accept', 'Authorization', 'Content-Type', 'X-Requested-With']
        : ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
