<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Updates the type enum to include 'vip' as a valid type.
     */
    public function up(): void
    {
        // For MySQL, we need to modify the enum column
        // Note: This approach works for MySQL. For PostgreSQL, you'd use ALTER TYPE.
        DB::statement("ALTER TABLE shop_items MODIFY COLUMN type ENUM('perk', 'skin', 'role', 'vip', 'other') DEFAULT 'perk'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First, update any 'vip' types to 'role' as fallback
        DB::table('shop_items')
            ->where('type', 'vip')
            ->update(['type' => 'role']);

        // Then revert the enum
        DB::statement("ALTER TABLE shop_items MODIFY COLUMN type ENUM('perk', 'skin', 'role', 'other') DEFAULT 'perk'");
    }
};
