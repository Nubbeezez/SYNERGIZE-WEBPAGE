<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * Configure rate limiting for the application.
     */
    protected function configureRateLimiting(): void
    {
        // General API rate limiting - configurable, default 60 requests per minute
        RateLimiter::for('api', function (Request $request) {
            $limit = (int) config('app.rate_limits.api', 60);
            return Limit::perMinute($limit)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function () {
                    return response()->json([
                        'error' => 'Too many requests. Please try again later.',
                        'retry_after' => 60,
                    ], 429);
                });
        });

        // Admin endpoints - 30 requests per minute
        RateLimiter::for('admin', function (Request $request) {
            $limit = (int) config('app.rate_limits.admin', 30);
            return Limit::perMinute($limit)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function () {
                    return response()->json([
                        'error' => 'Too many admin requests. Please slow down.',
                        'retry_after' => 60,
                    ], 429);
                });
        });

        // Authentication endpoints - 5 requests per minute (prevent brute force)
        RateLimiter::for('auth', function (Request $request) {
            $limit = (int) config('app.rate_limits.auth', 5);
            return Limit::perMinute($limit)
                ->by($request->ip())
                ->response(function () {
                    return response()->json([
                        'error' => 'Too many authentication attempts. Please wait before trying again.',
                        'retry_after' => 60,
                    ], 429);
                });
        });

        // Sensitive operations (bans, role changes) - 10 per minute
        RateLimiter::for('sensitive', function (Request $request) {
            $limit = (int) config('app.rate_limits.sensitive', 10);
            return Limit::perMinute($limit)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function () {
                    return response()->json([
                        'error' => 'Too many sensitive operations. Please slow down.',
                        'retry_after' => 60,
                    ], 429);
                });
        });

        // Shop purchases - 5 per minute
        RateLimiter::for('purchases', function (Request $request) {
            $limit = (int) config('app.rate_limits.purchases', 5);
            return Limit::perMinute($limit)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function () {
                    return response()->json([
                        'error' => 'Too many purchase attempts. Please wait.',
                        'retry_after' => 60,
                    ], 429);
                });
        });

        // Strict rate limiting for password-like operations - 3 per 5 minutes
        RateLimiter::for('strict', function (Request $request) {
            return Limit::perMinutes(5, 3)
                ->by($request->ip())
                ->response(function () {
                    return response()->json([
                        'error' => 'Rate limit exceeded. Please wait 5 minutes.',
                        'retry_after' => 300,
                    ], 429);
                });
        });
    }
}
