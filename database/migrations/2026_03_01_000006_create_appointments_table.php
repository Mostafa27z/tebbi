<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->string('booking_reference')->unique(); // e.g. TB-84920
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('doctor_profiles')->cascadeOnDelete();
            $table->date('appointment_date');
            $table->time('appointment_time');
            $table->string('status')->default('confirmed'); // confirmed, waiting, in_consultation, completed, cancelled
            $table->string('payment_method')->default('at_clinic'); // insurance, at_clinic, online
            $table->string('payment_status')->default('pending'); // pending, paid, refunded
            $table->decimal('consultation_fee', 8, 2);
            $table->decimal('discount', 8, 2)->default(0.00);
            $table->decimal('tax', 8, 2)->default(0.00);
            $table->decimal('total_amount', 8, 2);
            $table->string('insurance_provider')->nullable();
            $table->string('insurance_policy_number')->nullable();
            $table->text('patient_notes')->nullable();
            $table->boolean('notify_whatsapp')->default(true);
            $table->boolean('notify_sms')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};

