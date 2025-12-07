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
        Schema::create('bans', function (Blueprint $table) {
            $table->id();
            $table->string('steam_id', 32);
            $table->string('actor_steam_id', 32)->nullable(); // Admin who created the ban
            $table->text('reason');
            $table->timestamp('expires_at')->nullable(); // Null = permanent
            $table->enum('scope', ['global', 'server'])->default('global');
            $table->foreignId('server_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->text('removal_reason')->nullable();
            $table->string('removed_by_steam_id', 32)->nullable();
            $table->timestamp('removed_at')->nullable();
            $table->timestamps();

            $table->index('steam_id');
            $table->index('actor_steam_id');
            $table->index('is_active');
            $table->index(['steam_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bans');
    }
};
