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
        Schema::table('appointments', function (Blueprint $table) {
            // Stage 1: Admin Booking Confirmation
            $table->timestamp('booking_confirmed_at')->nullable()->after('status');
            $table->foreignId('booking_confirmed_by')->nullable()->after('booking_confirmed_at')->constrained('users')->nullOnDelete();

            // Stage 2: Receptionist Arrival Confirmation
            $table->timestamp('arrival_confirmed_at')->nullable()->after('booking_confirmed_by');
            $table->foreignId('arrival_confirmed_by')->nullable()->after('arrival_confirmed_at')->constrained('users')->nullOnDelete();

            // Stage 3: Doctor Kashf / Consultation Finish Confirmation
            $table->timestamp('consultation_finished_at')->nullable()->after('arrival_confirmed_by');
            $table->foreignId('consultation_finished_by')->nullable()->after('consultation_finished_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['booking_confirmed_by']);
            $table->dropForeign(['arrival_confirmed_by']);
            $table->dropForeign(['consultation_finished_by']);
            $table->dropColumn([
                'booking_confirmed_at',
                'booking_confirmed_by',
                'arrival_confirmed_at',
                'arrival_confirmed_by',
                'consultation_finished_at',
                'consultation_finished_by',
            ]);
        });
    }
};
