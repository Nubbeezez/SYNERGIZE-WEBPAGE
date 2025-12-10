<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Crypt;

class Server extends Model
{
    use HasFactory;

    /**
     * Valid game modes for servers.
     */
    public const GAME_MODES = [
        'retake',
        'surf',
        'dm',
        'awp',
        'kz',
        'bhop',
        'comp',
        'casual',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'ip',
        'port',
        'rcon_password',
        'region',
        'game_mode',
        'tags',
        'status',
        'map',
        'players',
        'max_players',
        'metadata',
        'last_polled_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'rcon_password',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'metadata' => 'array',
            'last_polled_at' => 'datetime',
        ];
    }

    /**
     * Encrypt the RCON password when setting.
     */
    protected function rconPassword(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? Crypt::decryptString($value) : null,
            set: fn (?string $value) => $value ? Crypt::encryptString($value) : null,
        );
    }

    /**
     * Get the bans scoped to this server.
     */
    public function bans(): HasMany
    {
        return $this->hasMany(Ban::class);
    }

    /**
     * Get the leaderboard entries for this server.
     */
    public function leaderboardEntries(): HasMany
    {
        return $this->hasMany(LeaderboardEntry::class);
    }

    /**
     * Get the admin assignments for this server.
     */
    public function adminAssignments(): HasMany
    {
        return $this->hasMany(AdminAssignment::class);
    }

    /**
     * Check if server is online.
     */
    public function isOnline(): bool
    {
        return $this->status === 'online';
    }

    /**
     * Get the connect URL for the server.
     */
    public function getConnectUrl(): string
    {
        return "steam://connect/{$this->ip}:{$this->port}";
    }

    /**
     * Get player count formatted (e.g., "18/24").
     */
    public function getPlayerCount(): string
    {
        return "{$this->players}/{$this->max_players}";
    }

    /**
     * Scope to filter online servers.
     */
    public function scopeOnline($query)
    {
        return $query->where('status', 'online');
    }

    /**
     * Scope to filter by region.
     */
    public function scopeRegion($query, string $region)
    {
        return $query->where('region', $region);
    }

    /**
     * Scope to filter by game mode.
     */
    public function scopeGameMode($query, string $gameMode)
    {
        return $query->where('game_mode', $gameMode);
    }
}
