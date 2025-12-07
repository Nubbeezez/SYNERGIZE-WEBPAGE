<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShopItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'price',
        'type',
        'available',
        'stock',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'available' => 'boolean',
            'metadata' => 'array',
        ];
    }

    /**
     * Get the purchases of this item.
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    /**
     * Check if item is in stock.
     */
    public function isInStock(): bool
    {
        if (!$this->available) {
            return false;
        }

        // Unlimited stock
        if ($this->stock === null) {
            return true;
        }

        return $this->stock > 0;
    }

    /**
     * Decrement stock after purchase.
     */
    public function decrementStock(): void
    {
        if ($this->stock !== null) {
            $this->decrement('stock');
        }
    }

    /**
     * Get the duration in days if this is a time-limited item.
     */
    public function getDurationDays(): ?int
    {
        return $this->metadata['duration_days'] ?? null;
    }

    /**
     * Scope to filter available items.
     */
    public function scopeAvailable($query)
    {
        return $query->where('available', true);
    }

    /**
     * Scope to filter by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
