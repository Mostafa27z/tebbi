<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Point schedules, appointments and queue tickets at the doctor's facility assignment,
 * so every calendar and queue belongs to exactly one (doctor, facility) pair.
 * Columns stay nullable for now; NOT NULL + unique constraints land with the booking/queue services.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctor_schedules', function (Blueprint $table) {
            $table->unsignedBigInteger('doctor_facility_id')->nullable();
            $table->index('doctor_facility_id');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->unsignedBigInteger('doctor_facility_id')->nullable();
            $table->unsignedBigInteger('facility_id')->nullable();
            $table->index('doctor_facility_id');
            $table->index('facility_id');
        });

        Schema::table('queue_tickets', function (Blueprint $table) {
            $table->unsignedBigInteger('doctor_facility_id')->nullable();
            $table->date('queue_date')->nullable();
            $table->index(['doctor_facility_id', 'queue_date']);
        });

        foreach (DB::table('doctor_facility')->get() as $assignment) {
            DB::table('doctor_schedules')
                ->where('doctor_profile_id', $assignment->doctor_profile_id)
                ->update(['doctor_facility_id' => $assignment->id]);

            DB::table('appointments')
                ->where('doctor_id', $assignment->doctor_profile_id)
                ->update([
                    'doctor_facility_id' => $assignment->id,
                    'facility_id' => $assignment->facility_id,
                ]);
        }

        foreach (DB::table('appointments')->whereNotNull('doctor_facility_id')->get() as $appointment) {
            DB::table('queue_tickets')
                ->where('appointment_id', $appointment->id)
                ->update([
                    'doctor_facility_id' => $appointment->doctor_facility_id,
                    'queue_date' => $appointment->appointment_date,
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('queue_tickets', function (Blueprint $table) {
            $table->dropIndex(['doctor_facility_id', 'queue_date']);
            $table->dropColumn(['doctor_facility_id', 'queue_date']);
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex(['doctor_facility_id']);
            $table->dropIndex(['facility_id']);
            $table->dropColumn(['doctor_facility_id', 'facility_id']);
        });

        Schema::table('doctor_schedules', function (Blueprint $table) {
            $table->dropIndex(['doctor_facility_id']);
            $table->dropColumn('doctor_facility_id');
        });
    }
};

