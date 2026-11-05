<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('doctor_profiles')->nullOnDelete();
            $table->string('title'); // e.g. تحليل صورة الدم الشاملة CBC
            $table->string('record_type'); // lab, radiology, report
            $table->string('issuer'); // e.g. مختبرات البرج الطبية
            $table->date('record_date');
            $table->string('status')->default('ready'); // ready, processing
            $table->string('file_path')->nullable();
            $table->json('summary_data')->nullable(); // key/value metrics
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_records');
    }
};

