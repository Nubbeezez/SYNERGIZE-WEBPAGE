<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ban;
use App\Models\User;
use App\Models\AuditLog;
use App\Services\SteamAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBanController extends Controller
{
    /**
     * List bans for admin (includes more details).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ban::with('server');

        // Filter by Steam ID
        if ($request->has('steam_id')) {
            $query->where('steam_id', $request->input('steam_id'));
        }

        // Filter by actor
        if ($request->has('actor_steam_id')) {
            $query->where('actor_steam_id', $request->input('actor_steam_id'));
        }

        // Filter active/inactive
        if ($request->has('active')) {
            if ($request->boolean('active')) {
                $query->active();
            } else {
                $query->where('is_active', false);
            }
        }

        $query->orderByDesc('created_at');

        $perPage = min((int) $request->input('per_page', 20), 100);
        $bans = $query->paginate($perPage);

        $data = collect($bans->items())->map(function ($ban) {
            $user = User::where('steam_id', $ban->steam_id)->first();
            $actor = User::where('steam_id', $ban->actor_steam_id)->first();
            $removedBy = $ban->removed_by_steam_id
                ? User::where('steam_id', $ban->removed_by_steam_id)->first()
                : null;

            return [
                'id' => $ban->id,
                'steam_id' => $ban->steam_id,
                'username' => $user?->username ?? 'Unknown',
                'avatar_url' => $user?->avatar_url,
                'reason' => $ban->reason,
                'scope' => $ban->scope,
                'server' => $ban->server ? [
                    'id' => $ban->server->id,
                    'name' => $ban->server->name,
                ] : null,
                'expires_at' => $ban->expires_at?->toIso8601String(),
                'is_permanent' => $ban->isPermanent(),
                'is_active' => $ban->is_active,
                'created_at' => $ban->created_at->toIso8601String(),
                'actor' => $actor ? [
                    'steam_id' => $actor->steam_id,
                    'username' => $actor->username,
                ] : null,
                'removed_at' => $ban->removed_at?->toIso8601String(),
                'removed_by' => $removedBy ? [
                    'steam_id' => $removedBy->steam_id,
                    'username' => $removedBy->username,
                ] : null,
                'removal_reason' => $ban->removal_reason,
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $bans->total(),
                'page' => $bans->currentPage(),
                'per_page' => $bans->perPage(),
                'last_page' => $bans->lastPage(),
            ],
        ]);
    }

    /**
     * Create a new ban.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'steam_id' => 'required|string|size:17',
            'reason' => 'required|string|max:500',
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

        // Check if already banned with same scope
        $existingBan = Ban::where('steam_id', $validated['steam_id'])
            ->where('scope', $validated['scope'])
            ->when($validated['scope'] === 'server', function ($q) use ($validated) {
                $q->where('server_id', $validated['server_id']);
            })
            ->active()
            ->first();

        if ($existingBan) {
            return response()->json([
                'error' => [
                    'code' => 'ALREADY_BANNED',
                    'message' => 'This user is already banned with this scope.',
                ],
            ], 400);
        }

        // Create ban
        $ban = Ban::create([
            'steam_id' => $validated['steam_id'],
            'actor_steam_id' => $actor->steam_id,
            'reason' => $validated['reason'],
            'scope' => $validated['scope'],
            'server_id' => $validated['server_id'] ?? null,
            'expires_at' => $validated['expires_at'] ?? null,
            'is_active' => true,
        ]);

        // Update user ban status if global ban
        if ($validated['scope'] === 'global') {
            User::where('steam_id', $validated['steam_id'])->update([
                'is_banned' => true,
                'banned_until' => $validated['expires_at'] ?? null,
            ]);
        }

        // Log the action
        AuditLog::log(
            $actor->steam_id,
            'ban.create',
            'ban',
            $ban->id,
            [
                'target_steam_id' => $validated['steam_id'],
                'reason' => $validated['reason'],
                'scope' => $validated['scope'],
                'expires_at' => $validated['expires_at'] ?? null,
            ]
        );

        return response()->json([
            'data' => [
                'id' => $ban->id,
                'steam_id' => $ban->steam_id,
                'reason' => $ban->reason,
                'scope' => $ban->scope,
                'expires_at' => $ban->expires_at?->toIso8601String(),
                'created_at' => $ban->created_at->toIso8601String(),
                'actor' => [
                    'steam_id' => $actor->steam_id,
                    'username' => $actor->username,
                ],
            ],
        ], 201);
    }

    /**
     * Remove a ban.
     */
    public function destroy(Request $request, Ban $ban): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $actor = $request->user();

        // Update ban record
        $ban->update([
            'is_active' => false,
            'removal_reason' => $validated['reason'] ?? null,
            'removed_by_steam_id' => $actor->steam_id,
            'removed_at' => now(),
        ]);

        // Check if there are any other active global bans
        $hasOtherGlobalBans = Ban::where('steam_id', $ban->steam_id)
            ->where('id', '!=', $ban->id)
            ->where('scope', 'global')
            ->active()
            ->exists();

        // Update user ban status if no other global bans
        if ($ban->scope === 'global' && !$hasOtherGlobalBans) {
            User::where('steam_id', $ban->steam_id)->update([
                'is_banned' => false,
                'banned_until' => null,
            ]);
        }

        // Log the action
        AuditLog::log(
            $actor->steam_id,
            'ban.remove',
            'ban',
            $ban->id,
            [
                'target_steam_id' => $ban->steam_id,
                'removal_reason' => $validated['reason'] ?? null,
            ]
        );

        return response()->json([
            'data' => [
                'message' => 'Ban successfully removed',
                'ban_id' => $ban->id,
            ],
        ]);
    }
}
