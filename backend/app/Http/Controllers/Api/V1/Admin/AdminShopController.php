<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreShopItemRequest;
use App\Http\Requests\Admin\UpdateShopItemRequest;
use App\Models\ShopItem;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminShopController extends Controller
{
    /**
     * List all shop items (admin can view).
     */
    public function index(Request $request): JsonResponse
    {
        $query = ShopItem::query();

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        // Filter by availability
        if ($request->has('available')) {
            $query->where('available', $request->boolean('available'));
        }

        $query->orderBy('created_at', 'desc');

        $perPage = min((int) $request->input('per_page', 20), 100);
        $items = $query->paginate($perPage);

        return response()->json([
            'data' => $items->items(),
            'meta' => [
                'total' => $items->total(),
                'page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    /**
     * Get a single shop item.
     */
    public function show(ShopItem $item): JsonResponse
    {
        return response()->json([
            'data' => $item,
        ]);
    }

    /**
     * Create a new shop item (owner only).
     */
    public function store(StoreShopItemRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $actor = $request->user();

        // Build metadata
        $metadata = [];
        if (isset($validated['duration_days'])) {
            $metadata['duration_days'] = $validated['duration_days'];
            unset($validated['duration_days']);
        }

        $validated['metadata'] = $metadata;
        $validated['available'] = $validated['available'] ?? true;

        $item = ShopItem::create($validated);

        // Log the action with IP and user agent
        AuditLog::log(
            $actor->steam_id,
            'shop.item.create',
            'shop_item',
            $item->id,
            [
                'name' => $item->name,
                'price' => $item->price,
                'type' => $item->type,
            ]
        );

        return response()->json([
            'message' => 'Shop item created successfully',
            'data' => $item,
        ], 201);
    }

    /**
     * Update a shop item (owner only).
     */
    public function update(UpdateShopItemRequest $request, ShopItem $item): JsonResponse
    {
        $validated = $request->validated();

        $actor = $request->user();
        $oldValues = $item->only(array_keys($validated));

        // Handle duration_days in metadata
        if (array_key_exists('duration_days', $validated)) {
            $metadata = $item->metadata ?? [];
            if ($validated['duration_days'] !== null) {
                $metadata['duration_days'] = $validated['duration_days'];
            } else {
                unset($metadata['duration_days']);
            }
            $validated['metadata'] = $metadata;
            unset($validated['duration_days']);
        }

        $item->update($validated);

        // Log the action with IP and user agent
        AuditLog::log(
            $actor->steam_id,
            'shop.item.update',
            'shop_item',
            $item->id,
            [
                'old' => $oldValues,
                'new' => $validated,
            ]
        );

        return response()->json([
            'message' => 'Shop item updated successfully',
            'data' => $item->fresh(),
        ]);
    }

    /**
     * Delete a shop item (owner only).
     */
    public function destroy(Request $request, ShopItem $item): JsonResponse
    {
        $actor = $request->user();

        // Log before deleting with IP and user agent
        AuditLog::log(
            $actor->steam_id,
            'shop.item.delete',
            'shop_item',
            $item->id,
            [
                'name' => $item->name,
                'price' => $item->price,
                'type' => $item->type,
            ]
        );

        $item->delete();

        return response()->json([
            'message' => 'Shop item deleted successfully',
        ]);
    }

    /**
     * Toggle item availability (owner only).
     */
    public function toggleAvailability(Request $request, ShopItem $item): JsonResponse
    {
        $actor = $request->user();
        $oldAvailable = $item->available;

        $item->available = !$item->available;
        $item->save();

        // Log the action with IP and user agent
        AuditLog::log(
            $actor->steam_id,
            'shop.item.toggle',
            'shop_item',
            $item->id,
            [
                'name' => $item->name,
                'old_available' => $oldAvailable,
                'new_available' => $item->available,
            ]
        );

        return response()->json([
            'message' => $item->available ? 'Item is now available' : 'Item is now unavailable',
            'data' => $item,
        ]);
    }
}
