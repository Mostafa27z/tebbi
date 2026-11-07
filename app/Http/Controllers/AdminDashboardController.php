<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        // 1. Core Dynamic Metrics from Database
        $totalBookings = Appointment::count();
        $totalRevenue = (float) Appointment::where('payment_status', 'paid')->sum('total_amount');
        $activeHospitalsCount = Clinic::where('is_active', true)->count();
        $activeDoctorsCount = DoctorProfile::where('is_available_today', true)->count();

        $totalHospitals = Clinic::count();
        $complianceRate = $totalHospitals > 0
            ? round((Clinic::where('is_verified', true)->count() / $totalHospitals) * 100, 1)
            : 100.0;

        $avgWaitingMinutes = (int) round(DoctorProfile::avg('waiting_time_minutes') ?: 15);

        // 2. Specialty Distribution (100% Dynamic)
        $totalDoctorsAll = max(1, DoctorProfile::count());
        $specialtyDistribution = Specialty::withCount('doctorProfiles')->get()->map(function ($s) use ($totalDoctorsAll) {
            return [
                'id' => $s->id,
                'name' => $s->name_ar,
                'doctors_count' => $s->doctor_profiles_count,
                'share_percentage' => round(($s->doctor_profiles_count / $totalDoctorsAll) * 100, 1),
            ];
        });

        // 3. Last 7 Days Daily Bookings and Revenue (100% Dynamic)
        $chartData = [];
        $maxDailyVal = 1;
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dayName = match ($date->dayOfWeek) {
                Carbon::SATURDAY => 'السبت',
                Carbon::SUNDAY => 'الأحد',
                Carbon::MONDAY => 'الإثنين',
                Carbon::TUESDAY => 'الثلاثاء',
                Carbon::WEDNESDAY => 'الأربعاء',
                Carbon::THURSDAY => 'الخميس',
                default => 'الجمعة',
            };

            $dayBookings = Appointment::whereDate('appointment_date', $date)->count();
            $dayRevenue = (float) Appointment::whereDate('appointment_date', $date)
                ->where('payment_status', 'paid')
                ->sum('total_amount');

            if ($dayBookings > $maxDailyVal) {
                $maxDailyVal = $dayBookings;
            }

            $chartData[] = [
                'day' => $dayName,
                'date' => $date->format('Y-m-d'),
                'bookings' => $dayBookings,
                'revenue' => $dayRevenue,
            ];
        }

        // Normalize bar heights for chart
        $chartData = array_map(function ($bar) use ($maxDailyVal) {
            $bar['val1'] = $maxDailyVal > 0 ? max(10, round(($bar['bookings'] / $maxDailyVal) * 100)) : 10;
            $bar['val2'] = max(5, round($bar['val1'] * 0.75));
            return $bar;
        }, $chartData);

        // 4. Dynamic Data Collections for Management Tabs
        $clinics = Clinic::withCount('doctorProfiles')->orderByDesc('id')->get();
        $doctors = DoctorProfile::with(['user', 'specialty', 'clinic'])->orderByDesc('id')->get();
        $specialties = Specialty::withCount('doctorProfiles')->get();
        $appointments = Appointment::with([
            'patient',
            'doctor.user',
            'doctor.clinic',
            'doctor.specialty',
            'queueTicket',
        ])->orderByDesc('appointment_date')->orderByDesc('appointment_time')->take(50)->get();

        return Inertia::render('admin/analytics', [
            'metrics' => [
                'totalBookings' => $totalBookings,
                'totalRevenue' => number_format($totalRevenue, 0) . ' ر.س',
                'activeDoctors' => $activeDoctorsCount,
                'activeHospitals' => $activeHospitalsCount,
                'complianceRate' => $complianceRate . '%',
                'avgWaitingTime' => $avgWaitingMinutes . ' دقيقة',
            ],
            'chartData' => $chartData,
            'specialtyDistribution' => $specialtyDistribution,
            'clinics' => $clinics,
            'doctors' => $doctors,
            'specialties' => $specialties,
            'appointments' => $appointments,
        ]);
    }

    // ==========================================
    // CLINIC MANAGEMENT ACTIONS
    // ==========================================

    public function storeClinic(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'branch_name' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'district' => 'required|string|max:100',
            'address' => 'required|string|max:255',
            'phone' => 'nullable|string|max:30',
        ]);

        Clinic::create([
            'name' => $validated['name'],
            'branch_name' => $validated['branch_name'] ?? 'الفرع الرئيسي',
            'city' => $validated['city'],
            'district' => $validated['district'],
            'address' => $validated['address'],
            'phone' => $validated['phone'] ?? '+966110000000',
            'is_active' => true,
            'is_verified' => true,
        ]);

        return back()->with('success', 'تم إضافة المستشفى/المجمع الطبي الجديد بنجاح.');
    }

    public function updateClinic(Request $request, Clinic $clinic): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'branch_name' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'district' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'is_active' => 'boolean',
            'is_verified' => 'boolean',
        ]);

        $clinic->update($validated);

        return back()->with('success', 'تم تحديث بيانات المجمع الطبي بنجاح.');
    }

    public function toggleClinic(Clinic $clinic): RedirectResponse
    {
        $clinic->update([
            'is_active' => ! $clinic->is_active,
        ]);

        $statusText = $clinic->is_active ? 'تفعيل' : 'تعطيل';
        return back()->with('success', "تم {$statusText} اعتماد المجمع الطبي بنجاح.");
    }

    // ==========================================
    // DOCTOR MANAGEMENT ACTIONS
    // ==========================================

    public function toggleDoctorApproval(DoctorProfile $doctor): RedirectResponse
    {
        $doctor->update([
            'is_available_today' => ! $doctor->is_available_today,
        ]);

        $statusText = $doctor->is_available_today ? 'اعتماد وتفعيل كشف' : 'تعليق نشاط';
        return back()->with('success', "تم {$statusText} الطبيب بنجاح.");
    }

    public function updateDoctor(Request $request, DoctorProfile $doctor): RedirectResponse
    {
        $validated = $request->validate([
            'title_ar' => 'required|string|max:255',
            'subspecialty' => 'nullable|string|max:255',
            'consultation_fee' => 'required|numeric|min:0',
            'waiting_time_minutes' => 'required|integer|min:5|max:120',
            'specialty_id' => 'required|exists:specialties,id',
            'clinic_id' => 'required|exists:clinics,id',
            'is_available_today' => 'boolean',
        ]);

        $doctor->update($validated);

        return back()->with('success', 'تم تحديث ملف الطبيب والرسوم بنجاح.');
    }

    // ==========================================
    // SPECIALTY MANAGEMENT ACTIONS
    // ==========================================

    public function storeSpecialty(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255|unique:specialties,name_ar',
            'name_en' => 'nullable|string|max:255',
            'icon_slug' => 'required|string|max:100',
            'badge_text' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        Specialty::create($validated);

        return back()->with('success', 'تم إضافة القسم الطبي الجديد بنجاح.');
    }

    public function updateSpecialty(Request $request, Specialty $specialty): RedirectResponse
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255|unique:specialties,name_ar,' . $specialty->id,
            'name_en' => 'nullable|string|max:255',
            'icon_slug' => 'required|string|max:100',
            'badge_text' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $specialty->update($validated);

        return back()->with('success', 'تم تحديث بيانات التخصص الطبي بنجاح.');
    }

    public function deleteSpecialty(Specialty $specialty): RedirectResponse
    {
        if ($specialty->doctorProfiles()->count() > 0) {
            return back()->with('error', 'لا يمكن حذف هذا التخصص لوجود أطباء مرتبطين به.');
        }

        $specialty->delete();

        return back()->with('success', 'تم حذف القسم الطبي بنجاح.');
    }

    // ==========================================
    // APPOINTMENT STATUS ACTIONS
    // ==========================================

    public function updateAppointmentStatus(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:waiting,in_consultation,completed,cancelled',
            'payment_status' => 'required|in:pending,paid,refunded,pending_verification',
        ]);

        $appointment->update($validated);

        if ($appointment->queueTicket) {
            $appointment->queueTicket->update([
                'status' => match ($validated['status']) {
                    'in_consultation' => 'examining',
                    'completed' => 'completed',
                    'cancelled' => 'cancelled',
                    default => 'waiting',
                },
            ]);
        }

        return back()->with('success', 'تم تحديث حالة الحجز والدفع بنجاح.');
    }
}
