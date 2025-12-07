<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    /**
     * List all users with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search' => 'nullable|string|max:100',
            'role' => 'nullable|string|in:' . implode(',', User::getValidRoles()),
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $query = User::query();

        // Filter by role
        if ($request->filled('role')) {
            $role = $request->get('role');
            $query->whereJsonContains('roles', $role);
        }

        // Search by username or steam_id (escape LIKE wildcards to prevent pattern injection)
        if ($request->filled('search')) {
            $search = str_replace(['%', '_'], ['\%', '\_'], $request->get('search'));
            $query->where(function ($q) use ($search) {
                $q->where('username', 'like', "%{$search}%")
                  ->orWhere('steam_id', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->get('per_page', 20), 100);
        $users = $query->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'data' => $users->items(),
            'meta' => [
                'total' => $users->total(),
                'page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'last_page' => $users->lastPage(),
            ],
        ]);
    }

    /**
     * Search users by username or Steam ID.
     */
    public function search(string $query): JsonResponse
    {
        // Limit query length and escape LIKE wildcards
        $query = substr($query, 0, 100);
        $search = str_replace(['%', '_'], ['\%', '\_'], $query);

        $users = User::where('username', 'like', "%{$search}%")
            ->orWhere('steam_id', 'like', "%{$search}%")
            ->limit(10)
            ->get(['id', 'steam_id', 'username', 'avatar_url', 'roles']);

        return response()->json(['data' => $users]);
    }

    /**
     * Get a single user.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'data' => [
                'id' => $user->id,
                'steam_id' => $user->steam_id,
                'username' => $user->username,
                'avatar_url' => $user->avatar_url,
                'roles' => $user->roles,
                'credits' => $user->credits,
                'is_banned' => $user->is_banned,
                'banned_until' => $user->banned_until,
                'created_at' => $user->created_at,
                'highest_role' => $user->getHighestRole(),
                'permission_level' => $user->getPermissionLevel(),
            ],
        ]);
    }

    /**
     * Update a user's roles.
     */
    public function updateRoles(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'string|in:' . implode(',', User::getValidRoles()),
        ]);

        $actor = $request->user();
        $newRoles = $request->roles;

        // Ensure 'user' is always included
        if (!in_array('user', $newRoles)) {
            $newRoles[] = 'user';
        }

        // Security checks
        // 1. Cannot modify owner roles unless you are owner
        if ($user->isOwner() && !$actor->isOwner()) {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Cannot modify owner roles.',
                ],
            ], 403);
        }

        // 2. Cannot give owner role unless you are owner
        if (in_array('owner', $newRoles) && !$actor->isOwner()) {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Only the owner can grant owner role.',
                ],
            ], 403);
        }

        // 3. Cannot give manager role unless you are owner
        if (in_array('manager', $newRoles) && !$actor->isOwner()) {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Only the owner can grant manager role.',
                ],
            ], 403);
        }

        // 4. Cannot modify your own roles (safety)
        if ($user->id === $actor->id) {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Cannot modify your own roles.',
                ],
            ], 403);
        }

        $oldRoles = $user->roles;
        $user->roles = $newRoles;
        $user->save();

        // Log the change with IP and user agent
        AuditLog::log(
            $actor->steam_id,
            'user.roles.update',
            'user',
            $user->id,
            [
                'target_steam_id' => $user->steam_id,
                'target_username' => $user->username,
                'old_roles' => $oldRoles,
                'new_roles' => $newRoles,
            ]
        );

        return response()->json([
            'message' => 'Roles updated successfully',
            'data' => [
                'id' => $user->id,
                'steam_id' => $user->steam_id,
                'username' => $user->username,
                'roles' => $user->roles,
                'highest_role' => $user->getHighestRole(),
            ],
        ]);
    }

    /**
     * Get available roles and their hierarchy.
     */
    public function getRoles(): JsonResponse
    {
        return response()->json([
            'data' => [
                'roles' => User::getValidRoles(),
                'hierarchy' => User::ROLE_HIERARCHY,
            ],
        ]);
    }
}
