<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A doctor can work at several facilities. Each assignment owns its own fee, calendar and queue.
 * doctor_profiles.clinic_id stays for now as the doctor's primary facility (dual-written, see DoctorProfile).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_facility', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('facility_id')->constrained('facilities')->cascadeOnDelete();
            $table->decimal('consultation_fee', 8, 2)->default(200.00);
            $table->unsignedSmallInteger('default_slot_minutes')->default(20);
            $table->boolean('accepts_insurance')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['doctor_profile_id', 'facility_id']);
        });

        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->string('approval_status')->default('pending'); // pending, approved, rejected, suspended
            $table->string('license_no')->nullable();
            $table->date('license_expires_at')->nullable();
        });

        foreach (DB::table('doctor_profiles')->get() as $doctor) {
            DB::table('doctor_facility')->insert([
                'doctor_profile_id' => $doctor->id,
                'facility_id' => $doctor->clinic_id,
                'consultation_fee' => $doctor->consultation_fee,
                'default_slot_minutes' => 20,
                'accepts_insurance' => $doctor->accepts_insurance,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('doctor_profiles')->where('id', $doctor->id)->update([
                'approval_status' => $doctor->is_available_today ? 'approved' : 'pending',
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->dropColumn(['approval_status', 'license_no', 'license_expires_at']);
        });

        Schema::dropIfExists('doctor_facility');
    }
};

