<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specialty_id')->constrained()->cascadeOnDelete();
            $table->foreignId('clinic_id')->constrained()->cascadeOnDelete();
            $table->string('title_ar'); // استشاري, أخصائي أول
            $table->string('subspecialty')->nullable(); // زراعة وتجميل الأسنان
            $table->text('bio')->nullable();
            $table->integer('experience_years')->default(10);
            $table->decimal('consultation_fee', 8, 2)->default(200.00);
            $table->decimal('rating', 2, 1)->default(4.9);
            $table->integer('review_count')->default(150);
            $table->integer('waiting_time_minutes')->default(15);
            $table->boolean('accepts_insurance')->default(true);
            $table->json('accepted_insurances')->nullable(); // ['بوبا', 'التعاونية', 'ميدغلف', 'تكافل الراجحي']
            $table->boolean('is_available_today')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_profiles');
    }
};

