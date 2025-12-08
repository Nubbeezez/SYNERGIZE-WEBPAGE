<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLogController extends Controller
{
    /**
     * List audit logs with filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query();

        // Filter by actor
        if ($request->has('actor_steam_id')) {
            $query->byActor($request->input('actor_steam_id'));
        }

        // Filter by action
        if ($request->has('action')) {
            $query->byAction($request->input('action'));
        }

        // Filter by target type
        if ($request->has('target_type')) {
            $query->byTargetType($request->input('target_type'));
        }

        // Filter by date range
        $query->between(
            $request->input('from'),
            $request->input('to')
        );

        // Order by most recent
        $query->orderByDesc('created_at');

        // Pagination
        $perPage = min((int) $request->input('per_page', 20), 100);
        $logs = $query->paginate($perPage);

        // Batch load users to avoid N+1 queries
        $steamIds = collect($logs->items())
            ->pluck('actor_steam_id')
            ->unique()
            ->values();

        $users = User::whereIn('steam_id', $steamIds)
            ->get()
            ->keyBy('steam_id');

        // Format response
        $data = collect($logs->items())->map(function ($log) use ($users) {
            $actor = $users->get($log->actor_steam_id);

            return [
                'id' => $log->id,
                'actor' => $actor ? [
                    'steam_id' => $actor->steam_id,
                    'username' => $actor->username,
                ] : [
                    'steam_id' => $log->actor_steam_id,
                    'username' => 'Unknown',
                ],
                'action' => $log->action,
                'target_type' => $log->target_type,
                'target_id' => $log->target_id,
                'payload' => $log->payload,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $logs->total(),
                'page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }
}
