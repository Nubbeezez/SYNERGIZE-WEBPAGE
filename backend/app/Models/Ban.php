<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ban extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'steam_id',
        'actor_steam_id',
        'reason',
        'expires_at',
        'scope',
        'server_id',
        'is_active',
        'removal_reason',
        'removed_by_steam_id',
        'removed_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'removed_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the server this ban is scoped to.
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    /**
     * Check if this is a permanent ban.
     */
    public function isPermanent(): bool
    {
        return $this->expires_at === null;
    }

    /**
     * Check if the ban is currently active (not expired).
     */
    public function isCurrentlyActive(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->isPermanent()) {
            return true;
        }

        return $this->expires_at->isFuture();
    }

    /**
     * Get the banned user's info from Steam ID.
     */
    public function getBannedUser(): ?User
    {
        return User::where('steam_id', $this->steam_id)->first();
    }

    /**
     * Get the actor (admin) who created this ban.
     */
    public function getActor(): ?User
    {
        return User::where('steam_id', $this->actor_steam_id)->first();
    }

    /**
     * Get the user who removed this ban.
     */
    public function getRemovedBy(): ?User
    {
        if (!$this->removed_by_steam_id) {
            return null;
        }

        return User::where('steam_id', $this->removed_by_steam_id)->first();
    }

    /**
     * Scope to filter active bans.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope to filter global bans.
     */
    public function scopeGlobal($query)
    {
        return $query->where('scope', 'global');
    }

    /**
     * Scope to filter by Steam ID.
     */
    public function scopeForSteamId($query, string $steamId)
    {
        return $query->where('steam_id', $steamId);
    }
}
