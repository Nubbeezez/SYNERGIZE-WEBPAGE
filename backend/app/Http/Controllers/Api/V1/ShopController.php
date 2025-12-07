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
     * List all shop items.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ShopItem::query();

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        // Filter available only
        if ($request->boolean('available', true)) {
            $query->where('available', true);
        }

        $items = $query->orderBy('price')->get();

        $data = $items->map(function ($item) {
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

        // Check if user has enough credits
        if ($user->credits < $item->price) {
            return response()->json([
                'error' => [
                    'code' => 'INSUFFICIENT_CREDITS',
                    'message' => 'You do not have enough credits for this purchase.',
                    'details' => [
                        'required' => $item->price,
                        'current' => $user->credits,
                    ],
                ],
            ], 400);
        }

        // Process purchase in transaction
        try {
            DB::transaction(function () use ($user, $item) {
                // Deduct credits
                $user->deductCredits($item->price);

                // Decrement stock if applicable
                $item->decrementStock();

                // Calculate expiration for time-limited items
                $expiresAt = null;
                if ($durationDays = $item->getDurationDays()) {
                    $expiresAt = now()->addDays($durationDays);
                }

                // Create purchase record
                Purchase::create([
                    'user_id' => $user->id,
                    'shop_item_id' => $item->id,
                    'price_paid' => $item->price,
                    'expires_at' => $expiresAt,
                    'status' => 'active',
                ]);

                // Log the purchase
                AuditLog::log(
                    $user->steam_id,
                    'shop.purchase',
                    'shop_item',
                    $item->id,
                    [
                        'item_name' => $item->name,
                        'price' => $item->price,
                        'user_balance_after' => $user->fresh()->credits,
                    ]
                );
            });
        } catch (\Exception $e) {
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
