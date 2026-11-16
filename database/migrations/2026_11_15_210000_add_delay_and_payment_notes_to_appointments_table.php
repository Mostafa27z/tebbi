<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->integer('delay_minutes')->default(0)->after('appointment_time');
            $table->string('delay_reason')->nullable()->after('delay_minutes');
            $table->text('payment_notes')->nullable()->after('payment_method');
        });

        Schema::table('queue_tickets', function (Blueprint $table) {
            $table->integer('delay_minutes')->default(0)->after('estimated_wait_minutes');
            $table->integer('call_count')->default(0)->after('status');
            $table->timestamp('last_called_at')->nullable()->after('called_at');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['delay_minutes', 'delay_reason', 'payment_notes']);
        });

        Schema::table('queue_tickets', function (Blueprint $table) {
            $table->dropColumn(['delay_minutes', 'call_count', 'last_called_at']);
        });
    }
};
