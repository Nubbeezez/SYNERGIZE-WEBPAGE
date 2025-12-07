<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAssignment;
use App\Models\User;
use App\Models\AuditLog;
use App\Services\SteamAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminRoleController extends Controller
{
    /**
     * Assign a role to a user.
     */
    public function assign(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'steam_id' => 'required|string|size:17',
            'role' => 'required|in:superadmin,admin,moderator',
            'scope' => 'required|in:global,server',
            'server_id' => 'required_if:scope,server|nullable|exists:servers,id',
            'expires_at' => 'nullable|date|after:now',
        ]);

        // Validate Steam ID format
        if (!SteamAuthService::isValidSteamId($validated['steam_id'])) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STEAM_ID',
                    'message' => 'Invalid Steam ID format',
                ],
            ], 400);
        }

        $actor = $request->user();

        // Only superadmins can assign superadmin role
        if ($validated['role'] === 'superadmin' && !$actor->isSuperAdmin()) {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Only superadmins can assign the superadmin role.',
                ],
            ], 403);
        }

        // Check for existing assignment
        $existing = AdminAssignment::where('steam_id', $validated['steam_id'])
            ->where('role', $validated['role'])
            ->where('scope', $validated['scope'])
            ->when($validated['scope'] === 'server', function ($q) use ($validated) {
                $q->where('server_id', $validated['server_id']);
            })
            ->active()
            ->first();

        if ($existing) {
            return response()->json([
                'error' => [
                    'code' => 'ALREADY_ASSIGNED',
                    'message' => 'This role is already assigned to this user.',
                ],
            ], 400);
        }

        // Create assignment
        $assignment = AdminAssignment::create([
            'steam_id' => $validated['steam_id'],
            'assigned_by_steam_id' => $actor->steam_id,
            'role' => $validated['role'],
            'scope' => $validated['scope'],
            'server_id' => $validated['server_id'] ?? null,
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        // Update user's roles array
        $user = User::where('steam_id', $validated['steam_id'])->first();
        if ($user && $validated['scope'] === 'global') {
            $roles = $user->roles ?? [];
            if (!in_array($validated['role'], $roles)) {
                $roles[] = $validated['role'];
                $user->update(['roles' => $roles]);
            }
        }

        // Log the action
        AuditLog::log(
            $actor->steam_id,
            'role.assign',
            'admin_assignment',
            $assignment->id,
            [
                'target_steam_id' => $validated['steam_id'],
                'role' => $validated['role'],
                'scope' => $validated['scope'],
                'server_id' => $validated['server_id'] ?? null,
            ]
        );

        return response()->json([
            'data' => [
                'message' => 'Role assigned successfully',
                'assignment' => [
                    'id' => $assignment->id,
                    'steam_id' => $assignment->steam_id,
                    'role' => $assignment->role,
                    'scope' => $assignment->scope,
                    'expires_at' => $assignment->expires_at?->toIso8601String(),
                ],
            ],
        ], 201);
    }

    /**
     * Revoke a role assignment.
     */
    public function revoke(Request $request, AdminAssignment $assignment): JsonResponse
    {
        $actor = $request->user();

        // Only superadmins can revoke superadmin role
        if ($assignment->role === 'superadmin' && !$actor->isSuperAdmin()) {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Only superadmins can revoke the superadmin role.',
                ],
            ], 403);
        }

        $steamId = $assignment->steam_id;
        $role = $assignment->role;
        $scope = $assignment->scope;

        // Delete the assignment
        $assignment->delete();

        // Update user's roles array if this was a global assignment
        if ($scope === 'global') {
            // Check if there are other active assignments with the same role
            $hasOtherAssignments = AdminAssignment::where('steam_id', $steamId)
                ->where('role', $role)
                ->where('scope', 'global')
                ->active()
                ->exists();

            if (!$hasOtherAssignments) {
                $user = User::where('steam_id', $steamId)->first();
                if ($user) {
                    $roles = $user->roles ?? [];
                    $roles = array_values(array_filter($roles, fn($r) => $r !== $role));
                    $user->update(['roles' => $roles]);
                }
            }
        }

        // Log the action
        AuditLog::log(
            $actor->steam_id,
            'role.revoke',
            'admin_assignment',
            $assignment->id,
            [
                'target_steam_id' => $steamId,
                'role' => $role,
                'scope' => $scope,
            ]
        );

        return response()->json([
            'data' => [
                'message' => 'Role removed successfully',
            ],
        ]);
    }
}
