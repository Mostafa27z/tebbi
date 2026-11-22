<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connect_idempotency_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credential_id')->constrained('connect_credentials')->cascadeOnDelete();
            $table->string('idempotency_key', 255);
            $table->string('request_path', 255);
            $table->string('request_hash', 64);
            $table->integer('response_status')->nullable();
            $table->json('response_headers')->nullable();
            $table->json('response_body')->nullable();
            $table->string('status', 30)->default('in_progress')->index();
            $table->timestamp('locked_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();

            $table->unique(['credential_id', 'idempotency_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connect_idempotency_keys');
    }
};

