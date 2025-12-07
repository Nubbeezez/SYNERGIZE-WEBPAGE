<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\ServerController;
use App\Http\Controllers\Api\V1\LeaderboardController;
use App\Http\Controllers\Api\V1\BanController;
use App\Http\Controllers\Api\V1\ShopController;
use App\Http\Controllers\Api\V1\Admin\AdminBanController;
use App\Http\Controllers\Api\V1\Admin\AdminRoleController;
use App\Http\Controllers\Api\V1\Admin\AdminLogController;
use App\Http\Controllers\Api\V1\Admin\AdminServerController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api/v1
|
*/

Route::prefix('v1')->group(function () {
    /*
    |--------------------------------------------------------------------------
    | Public Routes
    |--------------------------------------------------------------------------
    */

    // Authentication
    Route::prefix('auth')->group(function () {
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

    /*
    |--------------------------------------------------------------------------
    | Authenticated Routes
    |--------------------------------------------------------------------------
    */

    Route::middleware('auth:sanctum')->group(function () {
        // Current user
        Route::get('users/me', [UserController::class, 'me']);
        Route::put('users/me', [UserController::class, 'update']);

        // Shop (purchase)
        Route::post('shop/purchase', [ShopController::class, 'purchase']);
    });

    /*
    |--------------------------------------------------------------------------
    | Admin Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
        // Ban management
        Route::get('bans', [AdminBanController::class, 'index']);
        Route::post('bans', [AdminBanController::class, 'store']);
        Route::delete('bans/{ban}', [AdminBanController::class, 'destroy']);

        // Role management (superadmin only)
        Route::post('assign-role', [AdminRoleController::class, 'assign'])->middleware('superadmin');
        Route::delete('roles/{assignment}', [AdminRoleController::class, 'revoke'])->middleware('superadmin');

        // Server management
        Route::get('servers', [AdminServerController::class, 'index']);
        Route::put('servers/{server}', [AdminServerController::class, 'update']);

        // Audit logs
        Route::get('logs', [AdminLogController::class, 'index']);
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
