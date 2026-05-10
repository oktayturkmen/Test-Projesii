<?php

use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\Admin\AdminProductController;
use App\Http\Controllers\Api\Admin\AdminStatsController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Cart\CartController;
use App\Http\Controllers\Api\Currency\CurrencyController;
use App\Http\Controllers\Api\Order\OrderController;
use App\Http\Controllers\Api\Product\ProductController;
use Illuminate\Support\Facades\Route;

Route::middleware(['proxy.only', 'throttle:api'])->group(function (): void {
    Route::get('/health', fn () => response()->json([
        'success' => true,
        'message' => 'Backend saglikli.',
    ]));

    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth-register');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth-login');
        Route::middleware('jwt.auth')->group(function (): void {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
            // Account self-service (profile + password). Both are
            // authenticated writes so they sit behind the dedicated
            // `account-write` throttle that's tighter than the general
            // `api` budget but more permissive than `auth-login`.
            Route::patch('/profile', [AuthController::class, 'updateProfile'])
                ->middleware('throttle:account-write');
            Route::put('/password', [AuthController::class, 'changePassword'])
                ->middleware('throttle:account-write');
        });
    });

    // Dynamic {id} segments are constrained to digits across the API. Without
    // this, a malformed ID (e.g. "/products/abc") reaches the controller and
    // its `int $id` signature triggers a TypeError → 500 instead of a clean
    // 404. Mirrors the explicit `whereNumber('id')` already on admin routes.
    Route::prefix('products')->group(function (): void {
        Route::get('/', [ProductController::class, 'index']);
        Route::get('/{id}', [ProductController::class, 'show'])->whereNumber('id');
        Route::middleware(['jwt.auth', 'admin.access'])->group(function (): void {
            Route::post('/', [ProductController::class, 'store']);
            Route::put('/{id}', [ProductController::class, 'update'])->whereNumber('id');
            Route::delete('/{id}', [ProductController::class, 'destroy'])->whereNumber('id');
        });
    });

    Route::prefix('cart')->middleware('jwt.auth')->group(function (): void {
        Route::get('/', [CartController::class, 'index']);
        Route::post('/add', [CartController::class, 'add'])->middleware('throttle:cart-write');
        Route::put('/update', [CartController::class, 'update'])->middleware('throttle:cart-write');
        Route::delete('/remove/{id}', [CartController::class, 'remove'])->middleware('throttle:cart-write')->whereNumber('id');
    });

    Route::prefix('orders')->middleware('jwt.auth')->group(function (): void {
        Route::post('/', [OrderController::class, 'store'])->middleware('throttle:order-write');
        Route::get('/', [OrderController::class, 'index']);
        Route::get('/{id}', [OrderController::class, 'show'])->whereNumber('id');
    });

    Route::prefix('currency')->group(function (): void {
        Route::get('/rates', [CurrencyController::class, 'rates']);
    });

    Route::prefix('admin')->middleware(['jwt.auth', 'admin.access'])->group(function (): void {
        Route::get('/stats', AdminStatsController::class);
        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::patch('/orders/{id}/status', [AdminOrderController::class, 'updateStatus'])->whereNumber('id');
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/products', [AdminProductController::class, 'index']);
        Route::get('/products/{id}', [AdminProductController::class, 'show'])->whereNumber('id');
    });
});
