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
     * Role hierarchy (higher number = more permissions)
     * user: normal user (no login required for basic site access)
     * vip: bought VIP perks
     * admin: granted through application
     * senior-admin: admin after 1 year (same permissions, honorary title)
     * head-admin: leads a team of ~5 admins
     * manager: almost full access, just under owner
     * owner: full access to everything
     */
    public const ROLE_HIERARCHY = [
        'user' => 0,
        'vip' => 1,
        'admin' => 10,
        'senior-admin' => 10,  // Same permissions as admin
        'head-admin' => 20,
        'manager' => 30,
        'owner' => 100,
    ];

    /**
     * Get all valid roles.
     */
    public static function getValidRoles(): array
    {
        return array_keys(self::ROLE_HIERARCHY);
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string $role): bool
    {
        return in_array($role, $this->roles ?? []);
    }

    /**
     * Get user's highest role.
     */
    public function getHighestRole(): string
    {
        $roles = $this->roles ?? ['user'];
        $highest = 'user';
        $highestLevel = 0;

        foreach ($roles as $role) {
            $level = self::ROLE_HIERARCHY[$role] ?? 0;
            if ($level > $highestLevel) {
                $highestLevel = $level;
                $highest = $role;
            }
        }

        return $highest;
    }

    /**
     * Get user's permission level (highest role level).
     */
    public function getPermissionLevel(): int
    {
        $roles = $this->roles ?? ['user'];
        $highest = 0;

        foreach ($roles as $role) {
            $level = self::ROLE_HIERARCHY[$role] ?? 0;
            if ($level > $highest) {
                $highest = $level;
            }
        }

        return $highest;
    }

    /**
     * Check if user has at least the given permission level.
     */
    public function hasPermissionLevel(int $level): bool
    {
        return $this->getPermissionLevel() >= $level;
    }

    /**
     * Check if user can access admin panel (admin or higher).
     */
    public function isAdmin(): bool
    {
        return $this->getPermissionLevel() >= self::ROLE_HIERARCHY['admin'];
    }

    /**
     * Check if user is head-admin or higher.
     */
    public function isHeadAdmin(): bool
    {
        return $this->getPermissionLevel() >= self::ROLE_HIERARCHY['head-admin'];
    }

    /**
     * Check if user is manager or higher.
     */
    public function isManager(): bool
    {
        return $this->getPermissionLevel() >= self::ROLE_HIERARCHY['manager'];
    }

    /**
     * Check if user is the owner.
     */
    public function isOwner(): bool
    {
        return $this->hasRole('owner');
    }

    /**
     * Check if user can manage roles (owner or manager only).
     */
    public function canManageRoles(): bool
    {
        return $this->isManager();
    }

    /**
     * Check if user can manage servers (owner only).
     */
    public function canManageServers(): bool
    {
        return $this->isOwner();
    }

    /**
     * Check if user can manage settings (owner only).
     */
    public function canManageSettings(): bool
    {
        return $this->isOwner();
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
