<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Server;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminServerController extends Controller
{
    /**
     * List all servers for admin (includes sensitive info).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Server::query();

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $query->orderBy('name');

        $perPage = min((int) $request->input('per_page', 20), 100);
        $servers = $query->paginate($perPage);

        $data = collect($servers->items())->map(function ($server) {
            return [
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
                'has_rcon' => !empty($server->rcon_password),
                'last_polled_at' => $server->last_polled_at?->toIso8601String(),
                'created_at' => $server->created_at->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $servers->total(),
                'page' => $servers->currentPage(),
                'per_page' => $servers->perPage(),
                'last_page' => $servers->lastPage(),
            ],
        ]);
    }

    /**
     * Update a server.
     */
    public function update(Request $request, Server $server): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'ip' => 'sometimes|ip',
            'port' => 'sometimes|integer|between:1,65535',
            'region' => 'sometimes|string|max:10',
            'tags' => 'sometimes|array',
            'tags.*' => 'string|max:50',
            'rcon_password' => 'sometimes|nullable|string|max:255',
            'max_players' => 'sometimes|integer|between:1,128',
        ]);

        $actor = $request->user();

        // Store old values for audit log
        $oldValues = $server->only(array_keys($validated));

        // Update server
        $server->update($validated);

        // Log the action
        AuditLog::log(
            $actor->steam_id,
            'server.update',
            'server',
            $server->id,
            [
                'old' => $oldValues,
                'new' => $validated,
            ]
        );

        return response()->json([
            'data' => [
                'message' => 'Server updated successfully',
                'server' => [
                    'id' => $server->id,
                    'name' => $server->name,
                ],
            ],
        ]);
    }
}
