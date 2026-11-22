<?php

use App\Http\Controllers\Connect\CatalogController;
use App\Http\Controllers\Connect\QueueController;
use App\Http\Controllers\Connect\SandboxController;
use App\Http\Middleware\Connect\CheckConnectScope;
use App\Http\Middleware\Connect\ConnectAuthenticate;
use App\Http\Middleware\Connect\ConnectBootGuard;
use App\Http\Middleware\Connect\ConnectCors;
use App\Http\Middleware\Connect\HandleConnectDatabaseExceptions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Gate 1A-3: Public Queue Lookup (Token-authenticated, rate-limited per IP)
Route::middleware([
    HandleConnectDatabaseExceptions::class,
    ConnectCors::class,
    'throttle:60,1',
])->group(function () {
    Route::get('/queue/{public_token}', [QueueController::class, 'show'])->name('queue.show');
});

Route::middleware([
    HandleConnectDatabaseExceptions::class,
    ConnectCors::class,
    ConnectAuthenticate::class,
    ConnectBootGuard::class,
])->group(function () {
    Route::get('/ping', function (Request $request) {
        return response()->json([
            'status' => 'healthy',
            'environment' => $request->attributes->get('connect_credential')?->environment,
            'timestamp' => now()->toIso8601String(),
        ]);
    })->name('ping');

    // Gate 1A-2: Catalog Endpoints
    Route::get('/branches', [CatalogController::class, 'branches'])->name('branches.index');
    Route::get('/facilities', [CatalogController::class, 'branches'])->name('facilities.index');
    Route::get('/specialties', [CatalogController::class, 'specialties'])->name('specialties.index');
    Route::get('/doctors', [CatalogController::class, 'doctors'])->name('doctors.list');
    Route::get('/doctors/{doctor_id}', [CatalogController::class, 'show'])->name('doctors.show');
    Route::get('/doctors/{doctor_id}/services', [CatalogController::class, 'doctorServices'])->name('doctors.services');

    // Gate 1A-3: Sandbox Reset (environment-guarded)
    Route::post('/sandbox/reset', [SandboxController::class, 'reset'])->name('sandbox.reset');

    // Facility-scoped doctors endpoint
    Route::get('/facilities/{facility_id}/doctors', function (Request $request, $facilityId) {
        return response()->json([
            'facility_id' => (int) $facilityId,
            'message' => 'Doctors list retrieved successfully.',
        ]);
    })->middleware(CheckConnectScope::class . ':read')->name('doctors.index');

    Route::post('/facilities/{facility_id}/appointments', function (Request $request, $facilityId) {
        if (app()->isProduction()) {
            abort(501, 'Booking endpoint is pending Gate 1B activation.');
        }

        $validated = $request->validate([
            'patient_name' => 'required|string|max:100',
            'appointment_date' => 'required|date|after_or_equal:today',
        ]);

        return response()->json([
            'message' => 'Appointment test endpoint reached.',
            'facility_id' => (int) $facilityId,
            'data' => $validated,
        ]);
    })->middleware(CheckConnectScope::class . ':book')->name('appointments.create');

    // Test endpoint to trigger DB QueryException
    Route::post('/test/trigger-db-error', function () {
        try {
            DB::select('SELECT * FROM non_existent_table_for_testing_redaction WHERE secret = ?', ['sensitive_binding_123']);
        } catch (\Illuminate\Database\QueryException $e) {
            throw new \App\Exceptions\Connect\ConnectQueryException(
                'A database query error occurred during Connect processing.',
                500,
                $e,
                'req_test_123'
            );
        }
    })->name('test.db-error');

    // Test endpoint for validation with custom rules / withMessages
    Route::post('/test/validation', function (Request $request) {
        $request->validate([
            'code' => 'required|string|max:10',
            'email' => 'required|email',
        ]);

        return response()->json(['success' => true]);
    })->name('test.validation');
});
