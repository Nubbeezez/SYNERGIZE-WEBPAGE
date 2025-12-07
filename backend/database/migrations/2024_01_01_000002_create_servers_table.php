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
        Schema::create('servers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('ip');
            $table->integer('port')->default(27015);
            $table->text('rcon_password')->nullable(); // Encrypted
            $table->string('region', 10)->default('EU');
            $table->json('tags')->default('[]');
            $table->enum('status', ['online', 'offline'])->default('offline');
            $table->string('map')->nullable();
            $table->integer('players')->default(0);
            $table->integer('max_players')->default(24);
            $table->json('metadata')->nullable();
            $table->timestamp('last_polled_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('region');
            $table->index(['ip', 'port']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servers');
    }
};
