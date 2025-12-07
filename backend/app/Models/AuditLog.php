<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'actor_steam_id',
        'action',
        'target_type',
        'target_id',
        'payload',
        'ip_address',
        'user_agent',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }

    /**
     * Get the actor (admin) who performed this action.
     */
    public function getActor(): ?User
    {
        return User::where('steam_id', $this->actor_steam_id)->first();
    }

    /**
     * Create a new audit log entry.
     */
    public static function log(
        string $actorSteamId,
        string $action,
        ?string $targetType = null,
        ?int $targetId = null,
        ?array $payload = null
    ): self {
        return self::create([
            'actor_steam_id' => $actorSteamId,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'payload' => $payload,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Scope to filter by actor.
     */
    public function scopeByActor($query, string $steamId)
    {
        return $query->where('actor_steam_id', $steamId);
    }

    /**
     * Scope to filter by action.
     */
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope to filter by target type.
     */
    public function scopeByTargetType($query, string $targetType)
    {
        return $query->where('target_type', $targetType);
    }

    /**
     * Scope to filter by date range.
     */
    public function scopeBetween($query, $from, $to)
    {
        if ($from) {
            $query->where('created_at', '>=', $from);
        }
        if ($to) {
            $query->where('created_at', '<=', $to);
        }
        return $query;
    }
}
