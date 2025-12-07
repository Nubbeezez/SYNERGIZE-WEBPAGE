<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\ServerController;
use App\Http\Controllers\Api\V1\LeaderboardController;
use App\Http\Controllers\Api\V1\BanController;
use App\Http\Controllers\Api\V1\ShopController;
use App\Http\Controllers\Api\V1\Admin\AdminBanController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\Admin\AdminLogController;
use App\Http\Controllers\Api\V1\Admin\AdminServerController;
use App\Http\Controllers\Api\V1\Admin\AdminShopController;
use App\Http\Controllers\Api\V1\Admin\AdminSettingsController;
use App\Http\Controllers\Api\V1\SettingsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api/v1
|
*/

Route::prefix('v1')->middleware('throttle:api')->group(function () {
    /*
    |--------------------------------------------------------------------------
    | Public Routes
    |--------------------------------------------------------------------------
    */

    // Authentication (stricter rate limiting)
    Route::prefix('auth')->middleware('throttle:auth')->group(function () {
        Route::get('steam/init', [AuthController::class, 'steamInit']);
        Route::get('steam/callback', [AuthController::class, 'steamCallback']);
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    });

    // Servers
    Route::get('servers', [ServerController::class, 'index']);
    Route::get('servers/{server}', [ServerController::class, 'show']);

    // Leaderboards
    Route::get('leaderboards', [LeaderboardController::class, 'index']);
    Route::get('leaderboards/player/{steamId}', [LeaderboardController::class, 'player']);

    // Bans (public view)
    Route::get('bans', [BanController::class, 'index']);
    Route::get('bans/check/{steamId}', [BanController::class, 'check']);

    // Shop
    Route::get('shop/items', [ShopController::class, 'index']);

    // Public settings (for frontend)
    Route::get('settings', [SettingsController::class, 'public']);

    /*
    |--------------------------------------------------------------------------
    | Authenticated Routes
    |--------------------------------------------------------------------------
    */

    Route::middleware('auth:sanctum')->group(function () {
        // Current user
        Route::get('users/me', [UserController::class, 'me']);
        Route::put('users/me', [UserController::class, 'update']);

        // Shop (purchase - stricter rate limiting)
        Route::post('shop/purchase', [ShopController::class, 'purchase'])
            ->middleware('throttle:purchases');
    });

    /*
    |--------------------------------------------------------------------------
    | Admin Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('admin')->middleware(['auth:sanctum', 'admin', 'throttle:admin'])->group(function () {
        // Ban management (sensitive operations have stricter limits)
        Route::get('bans', [AdminBanController::class, 'index']);
        Route::post('bans', [AdminBanController::class, 'store'])->middleware('throttle:sensitive');
        Route::delete('bans/{ban}', [AdminBanController::class, 'destroy'])->middleware('throttle:sensitive');

        // User/Role management (manager or owner only)
        Route::prefix('users')->middleware('manager')->group(function () {
            Route::get('/', [AdminUserController::class, 'index']);
            Route::get('/{user}', [AdminUserController::class, 'show']);
            Route::put('/{user}/roles', [AdminUserController::class, 'updateRoles'])->middleware('throttle:sensitive');
            // Search has stricter rate limiting to prevent enumeration
            Route::get('/search/{query}', [AdminUserController::class, 'search'])->middleware('throttle:sensitive');
        });

        // Server management (owner only)
        Route::prefix('servers')->group(function () {
            Route::get('/', [AdminServerController::class, 'index']);
            Route::post('/', [AdminServerController::class, 'store'])->middleware(['owner', 'throttle:sensitive']);
            Route::put('/{server}', [AdminServerController::class, 'update'])->middleware(['owner', 'throttle:sensitive']);
            Route::delete('/{server}', [AdminServerController::class, 'destroy'])->middleware(['owner', 'throttle:sensitive']);
        });

        // Shop management (admin can view, owner can modify)
        Route::prefix('shop')->group(function () {
            Route::get('/', [AdminShopController::class, 'index']);
            Route::get('/{item}', [AdminShopController::class, 'show']);
            Route::post('/', [AdminShopController::class, 'store'])->middleware(['owner', 'throttle:sensitive']);
            Route::put('/{item}', [AdminShopController::class, 'update'])->middleware(['owner', 'throttle:sensitive']);
            Route::delete('/{item}', [AdminShopController::class, 'destroy'])->middleware(['owner', 'throttle:sensitive']);
            Route::post('/{item}/toggle', [AdminShopController::class, 'toggleAvailability'])->middleware('owner');
        });

        // Audit logs
        Route::get('logs', [AdminLogController::class, 'index']);

        // Site settings (owner only)
        Route::prefix('settings')->middleware('owner')->group(function () {
            Route::get('/', [AdminSettingsController::class, 'index']);
            Route::put('/', [AdminSettingsController::class, 'update'])->middleware('throttle:sensitive');
            Route::put('/batch', [AdminSettingsController::class, 'updateBatch'])->middleware('throttle:sensitive');
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Health Check
    |--------------------------------------------------------------------------
    */

    Route::get('health', function () {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ]);
    });
});
