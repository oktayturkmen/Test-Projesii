<?php

namespace Tests;

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
