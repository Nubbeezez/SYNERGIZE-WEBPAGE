<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaderboardEntry extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'steam_id',
        'server_id',
        'kills',
        'deaths',
        'assists',
        'wins',
        'losses',
        'hours',
        'points',
        'headshots',
        'mvp_stars',
        'last_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'hours' => 'decimal:2',
            'last_active' => 'datetime',
        ];
    }

    /**
     * Get the server this entry belongs to.
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    /**
     * Get the associated user.
     */
    public function getUser(): ?User
    {
        return User::where('steam_id', $this->steam_id)->first();
    }

    /**
     * Calculate K/D ratio.
     */
    public function getKdRatio(): float
    {
        if ($this->deaths === 0) {
            return (float) $this->kills;
        }

        return round($this->kills / $this->deaths, 2);
    }

    /**
     * Calculate win rate percentage.
     */
    public function getWinRate(): float
    {
        $totalGames = $this->wins + $this->losses;
        if ($totalGames === 0) {
            return 0.0;
        }

        return round(($this->wins / $totalGames) * 100, 1);
    }

    /**
     * Calculate headshot percentage.
     */
    public function getHeadshotPercentage(): float
    {
        if ($this->kills === 0) {
            return 0.0;
        }

        return round(($this->headshots / $this->kills) * 100, 1);
    }

    /**
     * Scope to filter by server.
     */
    public function scopeForServer($query, int $serverId)
    {
        return $query->where('server_id', $serverId);
    }

    /**
     * Scope for global leaderboard (null server_id).
     */
    public function scopeGlobal($query)
    {
        return $query->whereNull('server_id');
    }

    /**
     * Scope to order by points descending.
     */
    public function scopeRanked($query)
    {
        return $query->orderByDesc('points');
    }
}
