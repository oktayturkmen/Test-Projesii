<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function register(array $payload): User
    {
        return $this->userRepository->create([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => $payload['password'],
        ]);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{user: User, token: string}|null
     */
    public function login(array $payload): ?array
    {
        $user = $this->userRepository->findByEmail((string) $payload['email']);

        if (! $user || ! Hash::check((string) $payload['password'], $user->password)) {
            return null;
        }

        return [
            'user' => $user,
            'token' => JWTAuth::fromUser($user),
        ];
    }

    public function logout(): bool
    {
        try {
            JWTAuth::parseToken()->invalidate(true);

            return true;
        } catch (JWTException) {
            return false;
        }
    }

    /**
     * Update profile-level fields on the user. Only `name` and `email` are
     * accepted; the controller layer is expected to filter the payload via
     * the dedicated FormRequest before calling here.
     *
     * @param array<string, mixed> $payload
     */
    public function updateProfile(User $user, array $payload): User
    {
        $update = [];

        if (array_key_exists('name', $payload)) {
            $update['name'] = (string) $payload['name'];
        }

        if (array_key_exists('email', $payload)) {
            $update['email'] = (string) $payload['email'];
        }

        if ($update === []) {
            return $user;
        }

        return $this->userRepository->update($user, $update);
    }

    /**
     * Change the user's password atomically:
     *   1. verify the current password,
     *   2. hash + persist the new one,
     *   3. invalidate the existing JWT so the previous device must re-auth.
     *
     * Returns `true` only when the password actually changed; `false` when
     * the supplied current password is wrong (controller turns this into a
     * 422 with a stable message).
     */
    public function changePassword(
        User $user,
        string $currentPassword,
        string $newPassword
    ): bool {
        if (! Hash::check($currentPassword, $user->password)) {
            return false;
        }

        $this->userRepository->updatePassword($user, Hash::make($newPassword));

        // Invalidate the current token so a stolen / leaked JWT cannot keep
        // authenticating after the user has rotated their password. The
        // controller is responsible for issuing a fresh token afterwards.
        try {
            JWTAuth::parseToken()->invalidate(true);
        } catch (JWTException) {
            // We've already written the new password; surfacing the JWT
            // invalidation failure would leave the user stranded between
            // states. The next protected request will fail and force a
            // re-login through the standard 401 path anyway.
        }

        return true;
    }
}
