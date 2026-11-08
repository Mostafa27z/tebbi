<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * clinics -> facilities (hospital | clinic), each belonging to exactly one group.
 * Existing clinics each get their own group (a standalone clinic = a group with one facility).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('clinics', 'facilities');

        Schema::table('facilities', function (Blueprint $table) {
            $table->unsignedBigInteger('group_id')->nullable()->after('id');
            $table->string('type')->default('clinic'); // hospital, clinic
            $table->string('status')->default('active'); // pending, active, suspended
            $table->string('moh_license_no')->nullable();
            $table->json('settings')->nullable();
            $table->index('group_id');
        });

        foreach (DB::table('facilities')->get() as $facility) {
            $groupId = DB::table('groups')->insertGetId([
                'name_ar' => $facility->name,
                'slug' => 'g-'.Str::lower(Str::random(10)),
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('facilities')->where('id', $facility->id)->update([
                'group_id' => $groupId,
                'type' => str_contains($facility->name, 'مستشفى') ? 'hospital' : 'clinic',
            ]);
        }

        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('facilities', function (Blueprint $table) {
                $table->foreign('group_id')->references('id')->on('groups')->restrictOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('facilities', function (Blueprint $table) {
                $table->dropForeign(['group_id']);
            });
        }

        Schema::table('facilities', function (Blueprint $table) {
            $table->dropIndex(['group_id']);
            $table->dropColumn(['group_id', 'type', 'status', 'moh_license_no', 'settings']);
        });

        Schema::rename('facilities', 'clinics');
    }
};
