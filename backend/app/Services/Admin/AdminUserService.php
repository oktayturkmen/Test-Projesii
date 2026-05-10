<?php

namespace App\Services\Admin;

use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AdminUserService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
    ) {
    }

    public function list(int $perPage): LengthAwarePaginator
    {
        return $this->users->paginate($perPage);
    }
}
