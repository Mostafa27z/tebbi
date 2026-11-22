<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->unsignedSmallInteger('slot_auto_confirm_limit')
                ->default(1)
                ->after('waiting_time_minutes');
            $table->unsignedSmallInteger('slot_waitlist_limit')
                ->default(1)
                ->after('slot_auto_confirm_limit');
        });
    }

    public function down(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->dropColumn(['slot_auto_confirm_limit', 'slot_waitlist_limit']);
        });
    }
};
