<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Scoped roles: a user holds a role AT a group or facility.
 * users.role keeps 'patient', 'doctor' and 'admin' (= platform super admin).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role'); // group_admin, facility_admin, receptionist
            $table->string('scope_type'); // group, facility
            $table->unsignedBigInteger('scope_id');
            $table->timestamps();

            $table->unique(['user_id', 'role', 'scope_type', 'scope_id']);
            $table->index(['scope_type', 'scope_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_assignments');
    }
};

