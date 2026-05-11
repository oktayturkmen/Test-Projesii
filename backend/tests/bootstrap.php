<?php

/**
 * Must match `BACKEND_PROXY_SECRET` in `phpunit.xml` (and the CI workflow).
 * Pinning here overwrites any value inherited from the shell or from `.env`
 * before Laravel boots, so `config('proxy.secret')` and the in-request
 * `X-Proxy-Secret` injection in `Tests\TestCase` always agree.
 */
$__phpunitBackendProxySecret = '__PHPUNIT_BACKEND_PROXY_SECRET__';
putenv('BACKEND_PROXY_SECRET='.$__phpunitBackendProxySecret);
$_ENV['BACKEND_PROXY_SECRET'] = $__phpunitBackendProxySecret;
$_SERVER['BACKEND_PROXY_SECRET'] = $__phpunitBackendProxySecret;

/**
 * Test bootstrap — runs BEFORE any test class is loaded.
 *
 * Purpose: refuse to run the suite if the active database connection is
 * not isolated from real data. This is the earliest line of defense against
 * the Laravel `RefreshDatabase` trait truncating a developer's MySQL/Postgres
 * dev DB. The `Tests\TestCase` class also asserts the same invariant during
 * setUp() (defense in depth), but that runs AFTER the framework boots and
 * AFTER `RefreshDatabase` has had a chance to begin transactions.
 *
 * The values read here are populated by PHPUnit's `<env>` directives in
 * `phpunit.xml` (and merged with the OS environment), which is why the
 * check works without booting Laravel.
 */
require_once __DIR__.'/../vendor/autoload.php';

(static function (): void {
    $resolveEnv = static function (string $key): string {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);

        return $value === false ? '' : (string) $value;
    };

    $appEnv = $resolveEnv('APP_ENV');
    $dbConnection = $resolveEnv('DB_CONNECTION');
    $dbDatabase = $resolveEnv('DB_DATABASE');

    // SQLite memory / file is always safe.
    if ($dbConnection === 'sqlite') {
        return;
    }

    // Explicit opt-in: a database name ending in `_test` / `_testing` is
    // assumed to be an isolated test fixture chosen by the operator.
    if (str_ends_with($dbDatabase, '_test') || str_ends_with($dbDatabase, '_testing')) {
        return;
    }

    fwrite(
        STDERR,
        "\n[test-bootstrap] REFUSING TO RUN TEST SUITE\n"
        ."  APP_ENV={$appEnv}\n"
        ."  DB_CONNECTION={$dbConnection}\n"
        ."  DB_DATABASE={$dbDatabase}\n"
        ."Tests must run on DB_CONNECTION=sqlite (DB_DATABASE=:memory: recommended)\n"
        ."or against a database whose name ends with `_test` / `_testing`.\n"
        ."Update phpunit.xml or use --env=testing with an isolated DB.\n\n"
    );

    exit(1);
})();
