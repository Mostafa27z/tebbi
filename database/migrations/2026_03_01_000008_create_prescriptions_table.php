<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('doctor_profiles')->cascadeOnDelete();
            $table->string('prescription_code')->unique(); // e.g. RX-2026-9921
            $table->string('diagnosis');
            $table->json('medications'); // array of [{name, dose, frequency, duration, instructions}]
            $table->text('doctor_notes')->nullable();
            $table->boolean('is_dispensed')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};

