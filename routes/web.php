<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DoctorDashboardController;
use App\Http\Controllers\FacilityDashboardController;
use App\Http\Controllers\GroupDashboardController;
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

    // Medical Group Management (المجمعات الطبية)
    Route::post('/admin/groups', [AdminDashboardController::class, 'storeGroup'])->name('admin.groups.store');
    Route::put('/admin/groups/{group}', [AdminDashboardController::class, 'updateGroup'])->name('admin.groups.update');
    Route::delete('/admin/groups/{group}', [AdminDashboardController::class, 'deleteGroup'])->name('admin.groups.delete');

    // Scoped Roles & Staff Management (إدارة المشرفين والصلاحيات)
    Route::post('/admin/role-assignments', [AdminDashboardController::class, 'storeRoleAssignment'])->name('admin.role-assignments.store');
    Route::delete('/admin/role-assignments/{roleAssignment}', [AdminDashboardController::class, 'deleteRoleAssignment'])->name('admin.role-assignments.delete');

    // Doctor Multi-Facility Assignments (توزيع الأطباء على الفروع)
    Route::post('/admin/doctor-facilities', [AdminDashboardController::class, 'storeDoctorFacility'])->name('admin.doctor-facilities.store');
    Route::delete('/admin/doctor-facilities/{doctorFacility}', [AdminDashboardController::class, 'deleteDoctorFacility'])->name('admin.doctor-facilities.delete');

    // Hospital / Clinic Management
    Route::post('/admin/clinics', [AdminDashboardController::class, 'storeClinic'])->name('admin.clinics.store');
    Route::put('/admin/clinics/{clinic}', [AdminDashboardController::class, 'updateClinic'])->name('admin.clinics.update');
    Route::post('/admin/clinics/{clinic}/toggle', [AdminDashboardController::class, 'toggleClinic'])->name('admin.clinics.toggle');
    Route::post('/admin/clinics/{clinic}/toggle-verify', [AdminDashboardController::class, 'toggleClinicVerification'])->name('admin.clinics.toggle-verify');

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

// Medical Group Admin Routes (مدير المجمع الطبي)
Route::middleware(['auth'])->group(function () {
    Route::get('/group/dashboard', [GroupDashboardController::class, 'index'])->name('group.dashboard');
    Route::post('/group/{group}/facilities', [GroupDashboardController::class, 'storeFacility'])->name('group.facilities.store');
    Route::post('/group/{group}/staff', [GroupDashboardController::class, 'storeFacilityStaff'])->name('group.staff.store');
});

// Facility Admin & Reception Routes (مدير المستشفى/العيادة والاستقبال)
Route::middleware(['auth'])->group(function () {
    Route::get('/facility/dashboard', [FacilityDashboardController::class, 'index'])->name('facility.dashboard');
    Route::post('/facility/{facility}/walkin-ticket', [FacilityDashboardController::class, 'issueWalkInTicket'])->name('facility.walkin');
});

// Dashboard Route
Route::middleware(['auth'])->get('/dashboard', function () {
    return Inertia::render('dashboard');
})->name('dashboard');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
