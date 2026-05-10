<?php

namespace App\Support;

use App\Exceptions\Domain\DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

final class ApiDomainExceptionResponder
{
    public static function toResponse(DomainException $exception, Request $request): JsonResponse
    {
        Log::warning('api_domain_error', [
            'event_version' => 1,
            'actor_type' => $request->user() ? 'user' : 'anonymous',
            'trace_id' => $request->headers->get('x-request-id') ?? (string) Str::uuid(),
            'user_id' => $request->user()?->id,
            'error_code' => $exception->errorCode(),
            'message' => $exception->getMessage(),
            'method' => $request->method(),
            'path' => $request->path(),
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'success' => false,
            'message' => ApiRuntimeErrorMapper::toUserMessage($exception),
            'error_code' => $exception->errorCode(),
        ], self::statusCode($exception));
    }

    private static function statusCode(DomainException $exception): int
    {
        /** @var array<string, int> $statusCodes */
        $statusCodes = (array) config('api_errors.status_codes', []);

        return (int) ($statusCodes[$exception->errorCode()] ?? 422);
    }
}
