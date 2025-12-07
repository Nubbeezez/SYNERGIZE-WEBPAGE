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
        Schema::create('leaderboard_entries', function (Blueprint $table) {
            $table->id();
            $table->string('steam_id', 32);
            $table->foreignId('server_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('kills')->default(0);
            $table->integer('deaths')->default(0);
            $table->integer('assists')->default(0);
            $table->integer('wins')->default(0);
            $table->integer('losses')->default(0);
            $table->decimal('hours', 10, 2)->default(0);
            $table->integer('points')->default(0);
            $table->integer('headshots')->default(0);
            $table->integer('mvp_stars')->default(0);
            $table->timestamp('last_active')->nullable();
            $table->timestamps();

            $table->index('steam_id');
            $table->index('server_id');
            $table->index('points');
            $table->index(['server_id', 'points']);
            $table->unique(['steam_id', 'server_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaderboard_entries');
    }
};
