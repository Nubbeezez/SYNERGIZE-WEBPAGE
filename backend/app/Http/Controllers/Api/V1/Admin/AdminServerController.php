<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreServerRequest;
use App\Http\Requests\Admin\UpdateServerRequest;
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
     * Create a new server.
     */
    public function store(StoreServerRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $actor = $request->user();

        // Set default values
        $validated['status'] = 'offline';
        $validated['players'] = 0;
        $validated['map'] = 'unknown';
        $validated['tags'] = $validated['tags'] ?? [];

        $server = Server::create($validated);

        // Log the action with IP and user agent
        AuditLog::log(
            $actor->steam_id,
            'server.create',
            'server',
            $server->id,
            [
                'name' => $server->name,
                'ip' => $server->ip,
                'port' => $server->port,
                'region' => $server->region,
            ]
        );

        return response()->json([
            'message' => 'Server created successfully',
            'data' => [
                'id' => $server->id,
                'name' => $server->name,
                'ip' => $server->ip,
                'port' => $server->port,
                'region' => $server->region,
                'status' => $server->status,
                'max_players' => $server->max_players,
            ],
        ], 201);
    }

    /**
     * Update a server.
     */
    public function update(UpdateServerRequest $request, Server $server): JsonResponse
    {
        $validated = $request->validated();
        $actor = $request->user();

        // Store old values for audit log (exclude rcon_password for security)
        $oldValues = $server->only(['name', 'ip', 'port', 'region', 'max_players', 'tags']);

        // Update server
        $server->update($validated);

        // Log the action with IP and user agent (exclude rcon_password from log)
        $loggedChanges = array_diff_key($validated, ['rcon_password' => null]);
        AuditLog::log(
            $actor->steam_id,
            'server.update',
            'server',
            $server->id,
            [
                'old' => $oldValues,
                'new' => $loggedChanges,
            ]
        );

        return response()->json([
            'message' => 'Server updated successfully',
            'data' => [
                'id' => $server->id,
                'name' => $server->name,
                'ip' => $server->ip,
                'port' => $server->port,
            ],
        ]);
    }

    /**
     * Delete a server.
     */
    public function destroy(Request $request, Server $server): JsonResponse
    {
        $actor = $request->user();

        // Log the action before deleting with IP and user agent
        AuditLog::log(
            $actor->steam_id,
            'server.delete',
            'server',
            $server->id,
            [
                'name' => $server->name,
                'ip' => $server->ip,
                'port' => $server->port,
            ]
        );

        $server->delete();

        return response()->json([
            'message' => 'Server deleted successfully',
        ]);
    }
}
