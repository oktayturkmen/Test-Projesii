<?php

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserRepository implements UserRepositoryInterface
{
    public function create(array $data): User
    {
        return User::query()->create($data);
    }

    public function findByEmail(string $email): ?User
    {
        return User::query()->where('email', $email)->first();
    }

    public function update(User $user, array $data): User
    {
        $user->fill($data)->save();

        return $user->refresh();
    }

    public function updatePassword(User $user, string $hashedPassword): User
    {
        // `forceFill` bypasses `$fillable`; password is allowed there but
        // staying explicit makes the intent obvious at the call site.
        $user->forceFill(['password' => $hashedPassword])->save();

        return $user->refresh();
    }

    public function paginate(int $perPage = 20): LengthAwarePaginator
    {
        return User::query()->latest()->paginate($perPage);
    }

    public function count(): int
    {
        return User::query()->count();
    }
}
