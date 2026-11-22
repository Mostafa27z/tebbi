<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connect_usage_daily', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credential_id')->constrained('connect_credentials')->cascadeOnDelete();
            $table->date('usage_date');
            $table->unsignedInteger('request_count')->default(0);
            $table->timestamps();

            $table->unique(['credential_id', 'usage_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connect_usage_daily');
    }
};
