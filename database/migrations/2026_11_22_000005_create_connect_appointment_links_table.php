<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connect_appointment_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->unique()->constrained('appointments')->cascadeOnDelete();
            $table->foreignId('credential_id')->constrained('connect_credentials')->cascadeOnDelete();
            $table->string('external_appointment_id', 100)->nullable();
            $table->string('external_patient_id', 100)->nullable()->index();
            $table->string('patient_name_snapshot', 255);
            $table->string('patient_phone_snapshot', 30);
            $table->string('public_token_hash', 64)->unique();
            $table->timestamp('public_token_expires_at')->index();
            $table->string('cancellation_reason', 500)->nullable();
            $table->timestamps();

            $table->unique(['credential_id', 'external_appointment_id'], 'uq_cred_ext_appt');
            $table->index(['credential_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connect_appointment_links');
    }
};
