<?php

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use App\Exceptions\Domain\DomainException;
use App\Http\Middleware\EnsureAdminAccess;
use App\Http\Middleware\EnsureProxyRequest;
use App\Support\ApiDomainExceptionResponder;
use PHPOpenSourceSaver\JWTAuth\Http\Middleware\Authenticate;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

// NOTE: Environment-dependent invariants (APP_DEBUG, BACKEND_PROXY_SECRET,
// ...) are enforced inside AppServiceProvider::boot(), AFTER the .env file
// is loaded. Running them here would always see empty values on local CLI
// invocations because Laravel's env loader has not run yet.

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'jwt.auth' => Authenticate::class,
            'admin.access' => EnsureAdminAccess::class,
            'proxy.only' => EnsureProxyRequest::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Throwable $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $status = 500;
            $message = 'Server Error';
            $response = [
                'success' => false,
                'message' => $message,
            ];

            if ($exception instanceof ValidationException) {
                $status = 422;
                $response['message'] = $exception->getMessage() ?: 'Validation failed.';
                $response['errors'] = $exception->errors();
            } elseif ($exception instanceof DomainException) {
                return ApiDomainExceptionResponder::toResponse($exception, $request);
            } elseif ($exception instanceof ModelNotFoundException) {
                $status = 404;
                $response['message'] = 'Resource not found.';
            } elseif ($exception instanceof AuthenticationException) {
                $status = 401;
                $response['message'] = 'Unauthorized';
            } elseif ($exception instanceof ThrottleRequestsException) {
                // Map Laravel's default English "Too Many Attempts." to a localized,
                // user-friendly message and surface the upstream Retry-After header
                // as `retry_after` (seconds) so the UI can show a precise countdown.
                $status = 429;
                $retryAfter = (int) ($exception->getHeaders()['Retry-After'] ?? 60);
                $response['message'] = 'Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin.';
                $response['error_code'] = 'rate_limited';
                $response['retry_after'] = $retryAfter;

                return response()->json($response, $status, [
                    'Retry-After' => (string) $retryAfter,
                ]);
            } elseif ($exception instanceof HttpExceptionInterface) {
                $status = $exception->getStatusCode();
                $response['message'] = $exception->getMessage() !== '' ? $exception->getMessage() : 'Request failed.';
            } elseif (config('app.debug') && $exception->getMessage() !== '') {
                $response['message'] = $exception->getMessage();
            }

            return response()->json($response, $status);
        });
    })->create();
