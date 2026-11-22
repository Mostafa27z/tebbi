<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignId('doctor_service_id')
                ->nullable()
                ->after('doctor_id')
                ->constrained('doctor_services')
                ->nullOnDelete();
            $table->string('service_name', 160)->nullable()->after('doctor_service_id');
            $table->unsignedInteger('duration_minutes')->nullable()->after('appointment_time');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['doctor_service_id']);
            $table->dropColumn(['doctor_service_id', 'service_name', 'duration_minutes']);
        });
    }
};
