<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminAccess
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            Log::warning('admin_access_denied', [
                'event_version' => 1,
                'actor_type' => 'anonymous',
                'trace_id' => $request->headers->get('x-request-id') ?? (string) \Illuminate\Support\Str::uuid(),
                'reason' => 'unauthenticated',
                'method' => $request->method(),
                'path' => $request->path(),
                'ip' => $request->ip(),
            ]);

            return new JsonResponse([
                'success' => false,
                'message' => 'Yetkisiz erisim.',
            ], 401);
        }

        if (! method_exists($user, 'isAdmin') || ! $user->isAdmin()) {
            Log::warning('admin_access_denied', [
                'event_version' => 1,
                'actor_type' => 'user',
                'trace_id' => $request->headers->get('x-request-id') ?? (string) \Illuminate\Support\Str::uuid(),
                'reason' => 'forbidden',
                'user_id' => $user->id,
                'user_hash' => $this->userHash($user),
                'method' => $request->method(),
                'path' => $request->path(),
                'ip' => $request->ip(),
            ]);

            return new JsonResponse([
                'success' => false,
                'message' => 'Bu islem icin yetkiniz yok.',
            ], 403);
        }

        Log::info('admin_action', [
            'event_version' => 1,
            'actor_type' => 'admin',
            'trace_id' => $request->headers->get('x-request-id') ?? (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'user_hash' => $this->userHash($user),
            'method' => $request->method(),
            'path' => $request->path(),
            'ip' => $request->ip(),
        ]);

        return $next($request);
    }

    private function userHash(Authenticatable $user): string
    {
        $email = (string) ($user->email ?? '');
        $salt = (string) config('app.key', 'app-key');

        return hash('sha256', strtolower(trim($email)).'|'.$salt);
    }
}
