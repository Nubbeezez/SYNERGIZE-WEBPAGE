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
        Schema::create('admin_assignments', function (Blueprint $table) {
            $table->id();
            $table->string('steam_id', 32);
            $table->string('assigned_by_steam_id', 32);
            $table->enum('role', ['superadmin', 'admin', 'moderator']);
            $table->enum('scope', ['global', 'server'])->default('global');
            $table->foreignId('server_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('expires_at')->nullable(); // Null = permanent
            $table->timestamps();

            $table->index('steam_id');
            $table->index(['steam_id', 'scope']);
            $table->unique(['steam_id', 'server_id', 'role']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_assignments');
    }
};
