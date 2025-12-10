<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBanRequest;
use App\Models\Ban;
use App\Models\User;
use App\Models\AuditLog;
use App\Services\SteamAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        // Batch load users to avoid N+1 queries
        $steamIds = collect($bans->items())
            ->flatMap(fn ($ban) => [$ban->steam_id, $ban->actor_steam_id, $ban->removed_by_steam_id])
            ->filter()
            ->unique()
            ->values();

        $users = User::whereIn('steam_id', $steamIds)
            ->get()
            ->keyBy('steam_id');

        $data = collect($bans->items())->map(function ($ban) use ($users) {
            $user = $users->get($ban->steam_id);
            $actor = $users->get($ban->actor_steam_id);
            $removedBy = $ban->removed_by_steam_id
                ? $users->get($ban->removed_by_steam_id)
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
    public function store(StoreBanRequest $request): JsonResponse
    {
        $validated = $request->validated();
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

        // Create ban atomically with user status update
        try {
            $ban = DB::transaction(function () use ($validated, $actor) {
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

                // Update user ban status if global ban (atomic with ban creation)
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

                return $ban;
            });
        } catch (\Exception $e) {
            return response()->json([
                'error' => [
                    'code' => 'BAN_FAILED',
                    'message' => 'Failed to create ban. Please try again.',
                ],
            ], 500);
        }

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

        // Process ban removal atomically to prevent race conditions
        try {
            DB::transaction(function () use ($ban, $validated, $actor) {
                // Lock the ban record for update
                $lockedBan = Ban::where('id', $ban->id)->lockForUpdate()->first();

                if (!$lockedBan || !$lockedBan->is_active) {
                    throw new \Exception('BAN_ALREADY_REMOVED');
                }

                // Update ban record
                $lockedBan->update([
                    'is_active' => false,
                    'removal_reason' => $validated['reason'] ?? null,
                    'removed_by_steam_id' => $actor->steam_id,
                    'removed_at' => now(),
                ]);

                // Check if there are any other active global bans (within transaction)
                $hasOtherGlobalBans = Ban::where('steam_id', $lockedBan->steam_id)
                    ->where('id', '!=', $lockedBan->id)
                    ->where('scope', 'global')
                    ->active()
                    ->lockForUpdate()
                    ->exists();

                // Update user ban status if no other global bans
                if ($lockedBan->scope === 'global' && !$hasOtherGlobalBans) {
                    User::where('steam_id', $lockedBan->steam_id)->update([
                        'is_banned' => false,
                        'banned_until' => null,
                    ]);
                }

                // Log the action
                AuditLog::log(
                    $actor->steam_id,
                    'ban.remove',
                    'ban',
                    $lockedBan->id,
                    [
                        'target_steam_id' => $lockedBan->steam_id,
                        'removal_reason' => $validated['reason'] ?? null,
                    ]
                );
            });
        } catch (\Exception $e) {
            if ($e->getMessage() === 'BAN_ALREADY_REMOVED') {
                return response()->json([
                    'error' => [
                        'code' => 'BAN_ALREADY_REMOVED',
                        'message' => 'This ban has already been removed.',
                    ],
                ], 400);
            }

            return response()->json([
                'error' => [
                    'code' => 'REMOVAL_FAILED',
                    'message' => 'Failed to remove ban. Please try again.',
                ],
            ], 500);
        }

        return response()->json([
            'data' => [
                'message' => 'Ban successfully removed',
                'ban_id' => $ban->id,
            ],
        ]);
    }
}
