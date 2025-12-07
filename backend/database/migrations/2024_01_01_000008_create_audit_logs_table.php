<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('actor_steam_id', 32);
            $table->string('action'); // e.g., 'ban.create', 'ban.remove', 'role.assign'
            $table->string('target_type')->nullable(); // e.g., 'ban', 'user', 'server'
            $table->unsignedBigInteger('target_id')->nullable();
            $table->json('payload')->nullable(); // Before/after state, extra context
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->index('actor_steam_id');
            $table->index('action');
            $table->index('target_type');
            $table->index('created_at');
            $table->index(['target_type', 'target_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
