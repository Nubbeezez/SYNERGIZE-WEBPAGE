<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Server;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ServerController extends Controller
{
    /**
     * List all servers with filtering and pagination.
     * Results are cached for 30 seconds since server status changes frequently.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search' => 'nullable|string|max:100',
            'status' => 'nullable|string|in:online,offline',
            'region' => 'nullable|string|max:10',
            'game_mode' => 'nullable|string|in:' . implode(',', Server::GAME_MODES),
            'sort' => 'nullable|string|in:name,players,created_at,region',
            'order' => 'nullable|string|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        // Generate cache key based on request parameters
        $cacheKey = 'servers:list:' . md5(json_encode($request->only([
            'search', 'status', 'region', 'game_mode', 'sort', 'order', 'per_page', 'page'
        ])));

        // Cache for 30 seconds (server status changes frequently)
        $result = Cache::remember($cacheKey, 30, function () use ($request) {
            return $this->fetchServersData($request);
        });

        return response()->json($result);
    }

    /**
     * Fetch servers data from database.
     */
    private function fetchServersData(Request $request): array
    {
        $query = Server::query();

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by region
        if ($request->filled('region')) {
            $query->where('region', $request->input('region'));
        }

        // Filter by game mode
        if ($request->filled('game_mode')) {
            $query->where('game_mode', $request->input('game_mode'));
        }

        // Search by name (escape LIKE wildcards to prevent pattern injection)
        if ($request->filled('search')) {
            $search = str_replace(['%', '_'], ['\%', '\_'], $request->input('search'));
            $query->where('name', 'like', "%{$search}%");
        }

        // Sorting
        $sortField = $request->input('sort', 'name');
        $sortOrder = $request->input('order', 'asc');
        $allowedSorts = ['name', 'players', 'created_at', 'region'];

        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder === 'desc' ? 'desc' : 'asc');
        }

        // Pagination
        $perPage = min((int) $request->input('per_page', 20), 100);
        $servers = $query->paginate($perPage);

        return [
            'data' => $servers->items(),
            'meta' => [
                'total' => $servers->total(),
                'page' => $servers->currentPage(),
                'per_page' => $servers->perPage(),
                'last_page' => $servers->lastPage(),
            ],
        ];
    }

    /**
     * Get single server details.
     */
    public function show(Server $server): JsonResponse
    {
        return response()->json([
            'data' => [
                'id' => $server->id,
                'name' => $server->name,
                'ip' => $server->ip,
                'port' => $server->port,
                'region' => $server->region,
                'game_mode' => $server->game_mode,
                'status' => $server->status,
                'map' => $server->map,
                'players' => $server->players,
                'max_players' => $server->max_players,
                'tags' => $server->tags,
                'last_polled_at' => $server->last_polled_at?->toIso8601String(),
                'connect_url' => $server->getConnectUrl(),
                // In a full implementation, you'd fetch current players from cache/query
                'current_players' => [],
            ],
        ]);
    }
}
