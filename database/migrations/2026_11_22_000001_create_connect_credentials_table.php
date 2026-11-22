<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connect_credentials', function (Blueprint $table) {
            $table->id();
            $table->string('owner_type'); // App\Models\Group or App\Models\Facility
            $table->unsignedBigInteger('owner_id');
            $table->string('integration_name', 100);
            $table->string('environment', 20)->default('sandbox'); // sandbox, live
            $table->string('pk_prefix', 32); // e.g. pk_test_, pk_live_
            $table->string('pk_hash', 64)->unique(); // SHA-256
            $table->string('sk_prefix', 32); // e.g. sk_test_, sk_live_
            $table->string('sk_hash', 64)->unique(); // SHA-256
            $table->json('scopes'); // { "10": ["read", "book", "cancel", "facility_wide"] }
            $table->json('allowed_domains')->nullable(); // CORS origins for PK
            $table->string('status', 20)->default('active'); // active, suspended, revoked
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->index(['owner_type', 'owner_id']);
            $table->index('status');
            $table->index('environment');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connect_credentials');
    }
};
