<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('role')->default('patient')->after('phone'); // patient, doctor, admin
            $table->string('national_id')->nullable()->after('role');
            $table->string('avatar')->nullable()->after('national_id');
            $table->string('gender')->nullable()->after('avatar');
            $table->date('dob')->nullable()->after('gender');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'role', 'national_id', 'avatar', 'gender', 'dob']);
        });
    }
};

