<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds indexes for frequently queried columns to improve performance.
     */
    public function up(): void
    {
        // Users table indexes
        Schema::table('users', function (Blueprint $table) {
            $table->index('username');
            $table->index('created_at');
            $table->index('is_banned');
        });

        // Bans table indexes
        Schema::table('bans', function (Blueprint $table) {
            $table->index('created_at');
            $table->index('is_active');
            $table->index('actor_steam_id');
            $table->index(['steam_id', 'scope']); // Composite for ban lookups
            $table->index(['scope', 'is_active', 'expires_at']); // Composite for active ban queries
        });

        // Leaderboard entries indexes
        Schema::table('leaderboard_entries', function (Blueprint $table) {
            $table->index('points');
            $table->index('kills');
            $table->index('wins');
            $table->index('hours');
            $table->index('last_active');
            $table->index(['server_id', 'points']); // Composite for server leaderboards
        });

        // Audit logs indexes
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index('actor_steam_id');
            $table->index('action');
            $table->index('target_type');
            $table->index('created_at');
            $table->index(['action', 'created_at']); // Composite for filtered queries
        });

        // Purchases indexes
        Schema::table('purchases', function (Blueprint $table) {
            $table->index('created_at');
            $table->index(['user_id', 'created_at']); // Composite for user purchase history
        });

        // Sessions table index (if not already indexed)
        Schema::table('sessions', function (Blueprint $table) {
            $table->index('last_activity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['username']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['is_banned']);
        });

        Schema::table('bans', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['is_active']);
            $table->dropIndex(['actor_steam_id']);
            $table->dropIndex(['steam_id', 'scope']);
            $table->dropIndex(['scope', 'is_active', 'expires_at']);
        });

        Schema::table('leaderboard_entries', function (Blueprint $table) {
            $table->dropIndex(['points']);
            $table->dropIndex(['kills']);
            $table->dropIndex(['wins']);
            $table->dropIndex(['hours']);
            $table->dropIndex(['last_active']);
            $table->dropIndex(['server_id', 'points']);
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['actor_steam_id']);
            $table->dropIndex(['action']);
            $table->dropIndex(['target_type']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['action', 'created_at']);
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['user_id', 'created_at']);
        });

        Schema::table('sessions', function (Blueprint $table) {
            $table->dropIndex(['last_activity']);
        });
    }
};
