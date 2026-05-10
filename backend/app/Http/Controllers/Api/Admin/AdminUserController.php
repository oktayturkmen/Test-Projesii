<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexAdminListRequest;
use App\Models\User;
use App\Services\Admin\AdminUserService;
use App\Support\PaginationMeta;
use Illuminate\Http\JsonResponse;

class AdminUserController extends Controller
{
    public function __construct(
        private readonly AdminUserService $users,
    ) {
    }

    public function index(IndexAdminListRequest $request): JsonResponse
    {
        $users = $this->users->list($request->resolvePerPage());

        $items = $users->getCollection()
            ->map(static fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at,
            ])
            ->all();

        return response()->json([
            'success' => true,
            'message' => 'Kullanicilar getirildi.',
            'data' => [
                'users' => $items,
                'pagination' => PaginationMeta::from($users),
            ],
        ]);
    }
}
