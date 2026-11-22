<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('connect_credentials', function (Blueprint $table) {
            $table->string('pk_display', 100)->nullable()->after('pk_prefix');
            $table->text('sk_encrypted')->nullable()->after('sk_hash');
        });
    }

    public function down(): void
    {
        Schema::table('connect_credentials', function (Blueprint $table) {
            $table->dropColumn(['pk_display', 'sk_encrypted']);
        });
    }
};
