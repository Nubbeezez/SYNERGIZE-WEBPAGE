<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'steam_id',
        'username',
        'avatar_url',
        'email',
        'roles',
        'credits',
        'is_banned',
        'banned_until',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'roles' => 'array',
            'is_banned' => 'boolean',
            'banned_until' => 'datetime',
        ];
    }

    /**
     * Get the bans created by this user (as admin).
     */
    public function createdBans(): HasMany
    {
        return $this->hasMany(Ban::class, 'actor_steam_id', 'steam_id');
    }

    /**
     * Get the bans against this user.
     */
    public function bans(): HasMany
    {
        return $this->hasMany(Ban::class, 'steam_id', 'steam_id');
    }

    /**
     * Get the user's leaderboard entries.
     */
    public function leaderboardEntries(): HasMany
    {
        return $this->hasMany(LeaderboardEntry::class, 'steam_id', 'steam_id');
    }

    /**
     * Get the user's purchases.
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    /**
     * Get the user's admin assignments.
     */
    public function adminAssignments(): HasMany
    {
        return $this->hasMany(AdminAssignment::class, 'steam_id', 'steam_id');
    }

    /**
     * Get the audit logs created by this user.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'actor_steam_id', 'steam_id');
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string $role): bool
    {
        return in_array($role, $this->roles ?? []);
    }

    /**
     * Check if user is an admin (admin or superadmin).
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin') || $this->hasRole('superadmin');
    }

    /**
     * Check if user is a superadmin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('superadmin');
    }

    /**
     * Check if user is currently banned.
     */
    public function isCurrentlyBanned(): bool
    {
        if (!$this->is_banned) {
            return false;
        }

        // If banned_until is null, it's permanent
        if ($this->banned_until === null) {
            return true;
        }

        return $this->banned_until->isFuture();
    }

    /**
     * Add credits to user's balance.
     */
    public function addCredits(int $amount): void
    {
        $this->increment('credits', $amount);
    }

    /**
     * Deduct credits from user's balance.
     */
    public function deductCredits(int $amount): bool
    {
        if ($this->credits < $amount) {
            return false;
        }

        $this->decrement('credits', $amount);
        return true;
    }
}
