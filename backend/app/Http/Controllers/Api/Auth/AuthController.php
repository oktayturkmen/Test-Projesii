<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService
    ) {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->authService->register($request->validated());
        $loginPayload = $this->authService->login([
            'email' => $user->email,
            'password' => $request->validated('password'),
        ]);
        $token = (string) ($loginPayload['token'] ?? '');

        return response()->json([
            'success' => true,
            'message' => 'Kullanici basariyla kaydedildi.',
            'data' => [
                'user' => $user->only(['id', 'name', 'email', 'role', 'created_at', 'updated_at']),
            ],
        ], 201)->header('X-Auth-Token', $token);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $loginPayload = $this->authService->login($request->validated());

        if (! $loginPayload) {
            return response()->json([
                'success' => false,
                'message' => 'Gecersiz kimlik bilgileri.',
            ], 401);
        }

        $token = (string) $loginPayload['token'];

        return response()->json([
            'success' => true,
            'message' => 'Giris basarili.',
            'data' => [
                'user' => $loginPayload['user']->only(['id', 'name', 'email', 'role', 'created_at', 'updated_at']),
            ],
        ])->header('X-Auth-Token', $token);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'message' => 'Kimligi dogrulanmis kullanici getirildi.',
            'data' => [
                'user' => $user?->only(['id', 'name', 'email', 'role', 'created_at', 'updated_at']),
            ],
        ]);
    }

    public function logout(): JsonResponse
    {
        if (! $this->authService->logout()) {
            return response()->json([
                'success' => false,
                'message' => 'Cikis islemi basarisiz.',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cikis basarili.',
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Oturum bulunamadi.',
            ], 401);
        }

        $updated = $this->authService->updateProfile($user, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Profil bilgileri guncellendi.',
            'data' => [
                'user' => $updated->only(['id', 'name', 'email', 'role', 'created_at', 'updated_at']),
            ],
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Oturum bulunamadi.',
            ], 401);
        }

        $changed = $this->authService->changePassword(
            $user,
            (string) $request->validated('current_password'),
            (string) $request->validated('new_password'),
        );

        if (! $changed) {
            // 422 keeps this aligned with the validation/business-logic
            // bucket in `config/api_errors.php` instead of leaking a 401
            // (which would also trip the frontend's auto-logout interceptor).
            return response()->json([
                'success' => false,
                'message' => 'Mevcut sifre dogrulanamadi.',
                'errors' => [
                    'current_password' => ['Mevcut sifre dogru degil.'],
                ],
            ], 422);
        }

        // The previous JWT was invalidated by the service. Issue a fresh
        // one against the (refreshed) user so the client can stay signed
        // in without bouncing through the login flow.
        $token = JWTAuth::fromUser($user->refresh());

        return response()->json([
            'success' => true,
            'message' => 'Sifre basariyla guncellendi.',
        ])->header('X-Auth-Token', $token);
    }
}
