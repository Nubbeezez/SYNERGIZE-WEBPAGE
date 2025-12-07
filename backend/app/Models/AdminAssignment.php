<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminAssignment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'steam_id',
        'assigned_by_steam_id',
        'role',
        'scope',
        'server_id',
        'expires_at',
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
        ];
    }

    /**
     * Get the server this assignment is scoped to.
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    /**
     * Get the user this assignment belongs to.
     */
    public function getUser(): ?User
    {
        return User::where('steam_id', $this->steam_id)->first();
    }

    /**
     * Get the user who made this assignment.
     */
    public function getAssignedBy(): ?User
    {
        return User::where('steam_id', $this->assigned_by_steam_id)->first();
    }

    /**
     * Check if assignment is currently active.
     */
    public function isActive(): bool
    {
        if ($this->expires_at === null) {
            return true;
        }

        return $this->expires_at->isFuture();
    }

    /**
     * Scope to filter active assignments.
     */
    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
                ->orWhere('expires_at', '>', now());
        });
    }

    /**
     * Scope to filter global assignments.
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
