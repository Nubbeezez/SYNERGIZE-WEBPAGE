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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('steam_id', 32)->unique();
            $table->string('username');
            $table->string('avatar_url')->nullable();
            $table->string('email')->nullable();
            $table->json('roles')->default('["user"]');
            $table->integer('credits')->default(0);
            $table->boolean('is_banned')->default(false);
            $table->timestamp('banned_until')->nullable();
            $table->timestamps();

            $table->index('steam_id');
            $table->index('is_banned');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
