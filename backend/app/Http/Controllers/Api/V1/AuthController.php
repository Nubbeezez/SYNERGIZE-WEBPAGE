<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\SteamAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function __construct(
        private SteamAuthService $steamAuthService
    ) {}

    /**
     * Initialize Steam login - return redirect URL.
     */
    public function steamInit(): JsonResponse
    {
        $redirectUrl = $this->steamAuthService->getLoginUrl();

        return response()->json([
            'data' => [
                'redirect_url' => $redirectUrl,
            ],
        ]);
    }

    /**
     * Handle Steam callback.
     */
    public function steamCallback(Request $request): RedirectResponse
    {
        $params = $request->all();
        $frontendUrl = config('app.frontend_url', config('app.url'));

        // Validate the Steam response
        $steamId = $this->steamAuthService->validateCallback($params);

        if (!$steamId) {
            return redirect($frontendUrl . '?error=steam_auth_failed');
        }

        // Find or create user
        $user = $this->steamAuthService->findOrCreateUser($steamId);

        if (!$user) {
            return redirect($frontendUrl . '?error=user_creation_failed');
        }

        // Check if user is banned
        if ($user->isCurrentlyBanned()) {
            return redirect($frontendUrl . '?error=user_banned');
        }

        // Log the user in
        Auth::login($user, true);

        // Redirect to frontend
        return redirect($frontendUrl . '?login=success');
    }

    /**
     * Logout current user.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'data' => [
                'message' => 'Successfully logged out',
            ],
        ]);
    }
}
