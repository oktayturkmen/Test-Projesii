<?php

namespace Tests;

use App\Http\Middleware\EnsureProxyRequest;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    /**
     * Defense-in-depth guardrail. The primary check lives in
     * `tests/bootstrap.php` and aborts the suite before any test class is
     * even loaded — long before `RefreshDatabase` can touch a connection.
     * This hook covers the residual case where a service provider rewrites
     * `database.default` AFTER Laravel boots, by re-validating the live
     * connection once Laravel is ready (i.e. after `parent::setUp()`).
     *
     * Tests must run on an isolated SQLite (memory or file) connection or
     * against a database whose name explicitly opts in via the
     * `_test`/`_testing` suffix.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->assertSafeTestDatabase();
        // Replace `EnsureProxyRequest` in the container so HTTP tests never depend
        // on `X-Proxy-Secret` / env merge (CI-safe; `Pipeline` resolves middleware via `make()`).
        $this->withoutMiddleware([EnsureProxyRequest::class]);
        $this->seedProxySecretIntoDefaultServerVariables();
    }

    /**
     * Belt-and-suspenders with {@see call()}: merge the proxy secret into the
     * default Symfony server bag so sub-requests still see X-Proxy-Secret even
     * if a code path bypasses our overridden call() (rare) or $server omits it.
     */
    private function seedProxySecretIntoDefaultServerVariables(): void
    {
        $secret = trim((string) config('proxy.secret', ''));

        if ($secret === '') {
            return;
        }

        $headerName = (string) config('proxy.header', 'X-Proxy-Secret');
        $this->serverVariables[$this->proxySecretServerVariableKey($headerName)] = $secret;
    }

    /**
     * Inject the proxy shared secret on every in-process HTTP request.
     *
     * `MakesHttpRequests::$defaultHeaders` is cleared in Laravel's tear-down; relying
     * only on `withHeader()` in setUp is brittle. Under `proxy.only`, missing
     * `X-Proxy-Secret` yields 403 before JWT runs — so we merge into `$server` here
     * (same mechanism Symfony uses for incoming headers).
     *
     * @param  array<string, mixed>  $parameters
     * @param  array<string, mixed>  $cookies
     * @param  array<string, mixed>  $files
     * @param  array<string, mixed>  $server
     */
    public function call($method, $uri, $parameters = [], $cookies = [], $files = [], $server = [], $content = null)
    {
        $secret = trim((string) config('proxy.secret', ''));

        if ($secret !== '') {
            $headerName = (string) config('proxy.header', 'X-Proxy-Secret');
            $serverKey = $this->proxySecretServerVariableKey($headerName);

            if (($server[$serverKey] ?? '') === '') {
                $server[$serverKey] = $secret;
            }
        }

        return parent::call($method, $uri, $parameters, $cookies, $files, $server, $content);
    }

    private function proxySecretServerVariableKey(string $headerName): string
    {
        $normalized = strtoupper(str_replace('-', '_', $headerName));

        return str_starts_with($normalized, 'HTTP_')
            ? $normalized
            : 'HTTP_'.$normalized;
    }

    private function assertSafeTestDatabase(): void
    {
        $connection = DB::connection();
        $driver = (string) $connection->getDriverName();
        $database = (string) $connection->getDatabaseName();

        if ($driver === 'sqlite') {
            return;
        }

        if (str_ends_with($database, '_test') || str_ends_with($database, '_testing')) {
            return;
        }

        throw new \RuntimeException(sprintf(
            "Refusing to run tests against an unsafe database. driver=%s db=%s. "
                ."Set DB_CONNECTION=sqlite + DB_DATABASE=:memory: in phpunit.xml, "
                ."or use a database name ending with `_test` / `_testing`.",
            $driver,
            $database
        ));
    }
}

