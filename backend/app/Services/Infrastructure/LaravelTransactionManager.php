<?php

namespace App\Services\Infrastructure;

use App\Services\Contracts\TransactionManagerInterface;
use Illuminate\Support\Facades\DB;

class LaravelTransactionManager implements TransactionManagerInterface
{
    public function run(callable $callback): mixed
    {
        return DB::transaction($callback);
    }
}
