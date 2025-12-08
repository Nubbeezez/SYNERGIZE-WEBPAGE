<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LeaderboardEntry;
use App\Models\User;
use App\Services\SteamAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class LeaderboardController extends Controller
{
    /**
     * Get leaderboard with filtering and pagination.
     * Results are cached for 5 minutes to reduce database load.
     */
    public function index(Request $request): JsonResponse
    {
        // Generate cache key based on request parameters
        $cacheKey = 'leaderboard:' . md5(json_encode([
            'server_id' => $request->input('server_id'),
            'sort' => $request->input('sort', 'points'),
            'per_page' => min((int) $request->input('per_page', 20), 100),
            'page' => $request->input('page', 1),
        ]));

        // Cache for 5 minutes (300 seconds)
        $result = Cache::remember($cacheKey, 300, function () use ($request) {
            return $this->fetchLeaderboardData($request);
        });

        return response()->json($result);
    }

    /**
     * Fetch leaderboard data from database.
     */
    private function fetchLeaderboardData(Request $request): array
    {
        $query = LeaderboardEntry::query();

        // Filter by server
        if ($request->has('server_id')) {
            $query->where('server_id', $request->input('server_id'));
        } else {
            // Default to global leaderboard (null server_id or aggregate)
            $query->whereNull('server_id');
        }

        // Sort by field
        $sortField = $request->input('sort', 'points');
        $allowedSorts = ['points', 'kills', 'wins', 'hours'];

        if (in_array($sortField, $allowedSorts)) {
            $query->orderByDesc($sortField);
        }

        // Pagination
        $perPage = min((int) $request->input('per_page', 20), 100);
        $entries = $query->paginate($perPage);

        // Batch load users to avoid N+1 queries
        $steamIds = collect($entries->items())
            ->pluck('steam_id')
            ->unique()
            ->values();

        $users = User::whereIn('steam_id', $steamIds)
            ->get()
            ->keyBy('steam_id');

        // Add rank and user info
        $data = collect($entries->items())->map(function ($entry, $index) use ($entries, $users) {
            $user = $users->get($entry->steam_id);
            $rank = ($entries->currentPage() - 1) * $entries->perPage() + $index + 1;

            return [
                'rank' => $rank,
                'steam_id' => $entry->steam_id,
                'username' => $user?->username ?? 'Unknown',
                'avatar_url' => $user?->avatar_url,
                'kills' => $entry->kills,
                'deaths' => $entry->deaths,
                'wins' => $entry->wins,
                'hours' => (float) $entry->hours,
                'points' => $entry->points,
                'kd_ratio' => $entry->getKdRatio(),
                'last_active' => $entry->last_active?->toIso8601String(),
            ];
        });

        return [
            'data' => $data,
            'meta' => [
                'total' => $entries->total(),
                'page' => $entries->currentPage(),
                'per_page' => $entries->perPage(),
                'last_page' => $entries->lastPage(),
                'period' => $request->input('period', 'alltime'),
            ],
        ];
    }

    /**
     * Get specific player's stats.
     */
    public function player(string $steamId): JsonResponse
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

        $user = User::where('steam_id', $steamId)->first();
        $entry = LeaderboardEntry::where('steam_id', $steamId)
            ->whereNull('server_id')
            ->first();

        if (!$entry) {
            return response()->json([
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Player not found in leaderboard',
                ],
            ], 404);
        }

        // Calculate global rank
        $globalRank = LeaderboardEntry::whereNull('server_id')
            ->where('points', '>', $entry->points)
            ->count() + 1;

        return response()->json([
            'data' => [
                'steam_id' => $steamId,
                'username' => $user?->username ?? 'Unknown',
                'avatar_url' => $user?->avatar_url,
                'global_rank' => $globalRank,
                'stats' => [
                    'kills' => $entry->kills,
                    'deaths' => $entry->deaths,
                    'assists' => $entry->assists,
                    'wins' => $entry->wins,
                    'losses' => $entry->losses,
                    'hours' => (float) $entry->hours,
                    'points' => $entry->points,
                    'headshots' => $entry->headshots,
                    'mvp_stars' => $entry->mvp_stars,
                    'kd_ratio' => $entry->getKdRatio(),
                    'win_rate' => $entry->getWinRate(),
                    'headshot_percentage' => $entry->getHeadshotPercentage(),
                ],
                'last_active' => $entry->last_active?->toIso8601String(),
            ],
        ]);
    }
}
