<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connect_booking_intents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credential_id')->constrained('connect_credentials')->cascadeOnDelete();
            $table->string('intent_token', 64)->unique();
            $table->foreignId('facility_id')->constrained('facilities')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('doctor_profiles')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained('doctor_services')->cascadeOnDelete();
            $table->date('appointment_date');
            $table->string('appointment_time', 10);
            $table->decimal('expected_fee', 10, 2);
            $table->string('status', 30)->default('pending')->index();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();

            $table->index(['facility_id', 'doctor_id', 'appointment_date'], 'idx_cbi_fac_doc_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connect_booking_intents');
    }
};

