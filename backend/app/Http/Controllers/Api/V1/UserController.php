<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Get current authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'steam_id' => $user->steam_id,
                'username' => $user->username,
                'avatar_url' => $user->avatar_url,
                'credits' => $user->credits,
                'roles' => $user->roles,
                'is_banned' => $user->is_banned,
                'created_at' => $user->created_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Update current user's profile.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'email' => 'nullable|email|max:255',
        ]);

        $user->update($validated);

        return response()->json([
            'data' => [
                'message' => 'Profile updated successfully',
            ],
        ]);
    }
}
