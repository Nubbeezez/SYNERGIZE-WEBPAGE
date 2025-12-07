<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Ban;
use App\Models\User;
use App\Services\SteamAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BanController extends Controller
{
    /**
     * List bans with filtering and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ban::with('server');

        // Filter by Steam ID
        if ($request->has('steam_id')) {
            $query->where('steam_id', $request->input('steam_id'));
        }

        // Search by reason or username
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('reason', 'ilike', "%{$search}%")
                    ->orWhere('steam_id', 'like', "%{$search}%");
            });
        }

        // Filter by scope
        if ($request->has('scope')) {
            $query->where('scope', $request->input('scope'));
        }

        // Filter active only
        if ($request->boolean('active', false)) {
            $query->active();
        }

        // Order by most recent
        $query->orderByDesc('created_at');

        // Pagination
        $perPage = min((int) $request->input('per_page', 20), 100);
        $bans = $query->paginate($perPage);

        // Format response
        $data = collect($bans->items())->map(function ($ban) {
            $user = User::where('steam_id', $ban->steam_id)->first();
            $actor = User::where('steam_id', $ban->actor_steam_id)->first();

            return [
                'id' => $ban->id,
                'steam_id' => $ban->steam_id,
                'username' => $user?->username ?? 'Unknown',
                'reason' => $ban->reason,
                'scope' => $ban->scope,
                'server' => $ban->server ? [
                    'id' => $ban->server->id,
                    'name' => $ban->server->name,
                ] : null,
                'expires_at' => $ban->expires_at?->toIso8601String(),
                'is_permanent' => $ban->isPermanent(),
                'is_active' => $ban->isCurrentlyActive(),
                'created_at' => $ban->created_at->toIso8601String(),
                'actor' => $actor ? [
                    'steam_id' => $actor->steam_id,
                    'username' => $actor->username,
                ] : null,
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
     * Check if a Steam ID is banned.
     */
    public function check(string $steamId): JsonResponse
    {
        // Validate Steam ID format
        if (!SteamAuthService::isValidSteamId($steamId)) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STEAM_ID',
                    'message' => 'Invalid Steam ID format',
                ],
            ], 400);
        }

        $activeBans = Ban::where('steam_id', $steamId)
            ->active()
            ->with('server')
            ->get();

        $bans = $activeBans->map(function ($ban) {
            return [
                'id' => $ban->id,
                'reason' => $ban->reason,
                'scope' => $ban->scope,
                'server' => $ban->server ? [
                    'id' => $ban->server->id,
                    'name' => $ban->server->name,
                ] : null,
                'expires_at' => $ban->expires_at?->toIso8601String(),
                'is_permanent' => $ban->isPermanent(),
            ];
        });

        return response()->json([
            'data' => [
                'is_banned' => $bans->isNotEmpty(),
                'bans' => $bans,
            ],
        ]);
    }
}
