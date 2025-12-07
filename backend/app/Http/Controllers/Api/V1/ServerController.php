<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Server;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServerController extends Controller
{
    /**
     * List all servers with filtering and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Server::query();

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by region
        if ($request->has('region')) {
            $query->where('region', $request->input('region'));
        }

        // Search by name
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'ilike', "%{$search}%");
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

        return response()->json([
            'data' => $servers->items(),
            'meta' => [
                'total' => $servers->total(),
                'page' => $servers->currentPage(),
                'per_page' => $servers->perPage(),
                'last_page' => $servers->lastPage(),
            ],
        ]);
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
