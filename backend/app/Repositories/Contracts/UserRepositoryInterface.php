<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): User;

    public function findByEmail(string $email): ?User;

    /**
     * Persist a partial set of attributes against the given user. The
     * repository is the only place allowed to write `name`/`email`; password
     * mutations have their own dedicated method below so we never mix
     * unhashed input into a generic update path by accident.
     *
     * @param array<string, mixed> $data
     */
    public function update(User $user, array $data): User;

    /**
     * Persist a new password hash for the user. Receives the *hashed* value;
     * hashing lives in the service layer so this contract stays pure.
     */
    public function updatePassword(User $user, string $hashedPassword): User;

    public function paginate(int $perPage = 20): LengthAwarePaginator;

    public function count(): int;
}
