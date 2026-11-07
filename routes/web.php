<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DoctorDashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LiveQueueController;
use App\Http\Controllers\PatientPortalController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public Routes (Accessible by all visitors)
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::post('/appointments/book', [BookingController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('appointments.book');

// Authenticated Live Queue Tracker (Strict Auth: Patient owner, Doctor, or Admin)
Route::middleware(['auth'])->group(function () {
    Route::get('/queue/{bookingReference}', [LiveQueueController::class, 'show'])->name('queue.show');
    Route::get('/api/queue/{bookingReference}/status', [LiveQueueController::class, 'status'])
        ->middleware('throttle:60,1')
        ->name('queue.status');
});

// Patient Protected Routes
Route::middleware(['auth', 'role:patient'])->group(function () {
    Route::get('/patient/portal', [PatientPortalController::class, 'index'])->name('patient.portal');
});

// Doctor Protected Routes
Route::middleware(['auth', 'role:doctor'])->group(function () {
    Route::get('/doctor/dashboard', [DoctorDashboardController::class, 'index'])->name('doctor.dashboard');
    Route::post('/doctor/queue/call-next', [DoctorDashboardController::class, 'callNext'])->name('doctor.queue.call-next');
    Route::post('/doctor/appointments/{appointmentId}/consultation', [DoctorDashboardController::class, 'saveConsultation'])->name('doctor.appointments.consultation');
});

// Central Admin Protected Routes (Analytics & Full Dynamic Management)
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/analytics', [AdminDashboardController::class, 'index'])->name('admin.analytics');

    // Hospital / Clinic Management
    Route::post('/admin/clinics', [AdminDashboardController::class, 'storeClinic'])->name('admin.clinics.store');
    Route::put('/admin/clinics/{clinic}', [AdminDashboardController::class, 'updateClinic'])->name('admin.clinics.update');
    Route::post('/admin/clinics/{clinic}/toggle', [AdminDashboardController::class, 'toggleClinic'])->name('admin.clinics.toggle');

    // Doctor Management & Approval
    Route::post('/admin/doctors/{doctor}/toggle-approval', [AdminDashboardController::class, 'toggleDoctorApproval'])->name('admin.doctors.toggle-approval');
    Route::put('/admin/doctors/{doctor}', [AdminDashboardController::class, 'updateDoctor'])->name('admin.doctors.update');

    // Specialty Management
    Route::post('/admin/specialties', [AdminDashboardController::class, 'storeSpecialty'])->name('admin.specialties.store');
    Route::put('/admin/specialties/{specialty}', [AdminDashboardController::class, 'updateSpecialty'])->name('admin.specialties.update');
    Route::delete('/admin/specialties/{specialty}', [AdminDashboardController::class, 'deleteSpecialty'])->name('admin.specialties.delete');

    // Appointment Status & Payment Updates
    Route::put('/admin/appointments/{appointment}/status', [AdminDashboardController::class, 'updateAppointmentStatus'])->name('admin.appointments.update-status');
});

// Dashboard Route
Route::middleware(['auth'])->get('/dashboard', function () {
    return Inertia::render('dashboard');
})->name('dashboard');

// Local Environment Development Demo Login Route (Strictly disabled in production)
if (! app()->isProduction() && config('app.allow_demo_login', false)) {
    Route::post('/login/demo/{role}', function (string $role) {
        $allowedRoles = ['doctor', 'admin', 'patient'];
        if (! in_array($role, $allowedRoles)) {
            abort(404);
        }
        $user = \App\Models\User::where('role', $role)->firstOrFail();
        \Illuminate\Support\Facades\Auth::login($user);
        request()->session()->regenerate();

        return redirect()->intended(match ($role) {
            'doctor' => route('doctor.dashboard', absolute: false),
            'admin' => route('admin.analytics', absolute: false),
            default => route('patient.portal', absolute: false),
        });
    })->middleware('throttle:10,1')->name('login.demo');
}

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
