<?php

namespace App\Services\Contracts;

interface TransactionManagerInterface
{
    /**
     * @template TReturn
     * @param callable(): TReturn $callback
     * @return TReturn
     */
    public function run(callable $callback): mixed;
}
