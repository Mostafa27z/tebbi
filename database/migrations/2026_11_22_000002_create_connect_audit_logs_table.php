<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connect_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credential_id')->nullable()->constrained('connect_credentials')->nullOnDelete();
            $table->string('action', 50); // facility_wide.query, catalog.read, appointment.book
            $table->string('scope', 50)->nullable(); // facility_wide, read, book
            $table->unsignedInteger('records_count')->default(1);
            $table->string('ip_hash', 64); // SHA-256(ip + salt) for PDPL
            $table->string('request_id', 64)->index();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['credential_id', 'created_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connect_audit_logs');
    }
};
