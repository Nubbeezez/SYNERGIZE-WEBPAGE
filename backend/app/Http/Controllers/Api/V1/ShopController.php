<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ShopItem;
use App\Models\Purchase;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShopController extends Controller
{
    /**
     * List all shop items with optional pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'nullable|string|in:perk,skin,role,other',
            'available' => 'nullable|boolean',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = ShopItem::query();

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        // Filter available only
        if ($request->boolean('available', true)) {
            $query->where('available', true);
        }

        $query->orderBy('price');

        // Use pagination if per_page is specified, otherwise return all (limited to 100)
        $perPage = $request->has('per_page')
            ? min((int) $request->input('per_page'), 100)
            : 100;

        $items = $query->paginate($perPage);

        $data = collect($items->items())->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'description' => $item->description,
                'price' => $item->price,
                'type' => $item->type,
                'available' => $item->available,
                'in_stock' => $item->isInStock(),
                'metadata' => $item->metadata,
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $items->total(),
                'page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    /**
     * Purchase an item.
     */
    public function purchase(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_id' => 'required|integer|exists:shop_items,id',
        ]);

        $user = $request->user();
        $item = ShopItem::findOrFail($validated['item_id']);

        // Check if item is available
        if (!$item->isInStock()) {
            return response()->json([
                'error' => [
                    'code' => 'OUT_OF_STOCK',
                    'message' => 'This item is currently out of stock.',
                ],
            ], 400);
        }

        // Process purchase in transaction with pessimistic locking to prevent race conditions
        try {
            $purchase = DB::transaction(function () use ($user, $item) {
                // Lock user row for update to prevent concurrent credit modifications
                $lockedUser = $user->lockForUpdate()->first() ?? $user->fresh();

                // Re-check credits inside transaction with locked row
                if ($lockedUser->credits < $item->price) {
                    throw new \Exception('INSUFFICIENT_CREDITS');
                }

                // Lock and re-check item stock
                $lockedItem = $item->lockForUpdate()->first() ?? $item->fresh();
                if (!$lockedItem->isInStock()) {
                    throw new \Exception('OUT_OF_STOCK');
                }

                // Deduct credits atomically
                $lockedUser->decrement('credits', $item->price);

                // Decrement stock if applicable
                if ($lockedItem->stock !== null) {
                    $lockedItem->decrement('stock');
                }

                // Calculate expiration for time-limited items
                $expiresAt = null;
                if ($durationDays = $lockedItem->getDurationDays()) {
                    $expiresAt = now()->addDays($durationDays);
                }

                // Create purchase record
                $purchase = Purchase::create([
                    'user_id' => $lockedUser->id,
                    'shop_item_id' => $lockedItem->id,
                    'price_paid' => $lockedItem->price,
                    'expires_at' => $expiresAt,
                    'status' => 'active',
                ]);

                // Log the purchase
                AuditLog::log(
                    $lockedUser->steam_id,
                    'shop.purchase',
                    'shop_item',
                    $lockedItem->id,
                    [
                        'item_name' => $lockedItem->name,
                        'price' => $lockedItem->price,
                        'user_balance_after' => $lockedUser->fresh()->credits,
                    ]
                );

                return $purchase;
            });
        } catch (\Exception $e) {
            $errorCode = $e->getMessage();

            if ($errorCode === 'INSUFFICIENT_CREDITS') {
                return response()->json([
                    'error' => [
                        'code' => 'INSUFFICIENT_CREDITS',
                        'message' => 'You do not have enough credits for this purchase.',
                    ],
                ], 400);
            }

            if ($errorCode === 'OUT_OF_STOCK') {
                return response()->json([
                    'error' => [
                        'code' => 'OUT_OF_STOCK',
                        'message' => 'This item is no longer in stock.',
                    ],
                ], 400);
            }

            return response()->json([
                'error' => [
                    'code' => 'PURCHASE_FAILED',
                    'message' => 'Failed to process purchase. Please try again.',
                ],
            ], 500);
        }

        return response()->json([
            'data' => [
                'message' => 'Purchase successful',
                'item' => [
                    'id' => $item->id,
                    'name' => $item->name,
                ],
                'new_balance' => $user->fresh()->credits,
            ],
        ]);
    }
}
