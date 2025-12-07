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
        Schema::create('shop_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->integer('price'); // In credits
            $table->enum('type', ['perk', 'skin', 'role', 'other'])->default('perk');
            $table->boolean('available')->default(true);
            $table->integer('stock')->nullable(); // Null = unlimited
            $table->json('metadata')->nullable(); // Extra data (duration, perks, etc.)
            $table->timestamps();

            $table->index('available');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shop_items');
    }
};
