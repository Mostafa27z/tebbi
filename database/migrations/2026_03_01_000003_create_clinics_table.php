<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinics', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('branch_name')->nullable();
            $table->string('city')->default('الرياض');
            $table->string('district')->nullable();
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('map_url')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('logo_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_verified')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinics');
    }
};

