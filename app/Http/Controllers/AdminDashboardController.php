<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\DoctorFacility;
use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\Group;
use App\Models\RoleAssignment;
use App\Models\Specialty;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
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
        $totalDoctors = DoctorProfile::count();
        $verifiedHospitals = Clinic::where('is_verified', true)->count();
        $verifiedDoctors = DoctorProfile::where('is_available_today', true)->count();

        $complianceRate = ($totalHospitals > 0 && $totalDoctors > 0)
            ? round(((($verifiedHospitals / $totalHospitals) * 0.5) + (($verifiedDoctors / $totalDoctors) * 0.5)) * 100, 1) . '%'
            : 'لا توجد سجلات حتى الآن';

        $avgMinutesRaw = DoctorProfile::where('waiting_time_minutes', '>', 0)->avg('waiting_time_minutes');
        $avgWaitingTime = ($totalDoctors > 0 && $avgMinutesRaw !== null)
            ? (int) round($avgMinutesRaw) . ' دقيقة'
            : 'لا توجد سجلات حتى الآن';

        // 2. Specialty Distribution (100% Dynamic)
        $totalDoctorsAll = DoctorProfile::count();
        $specialtyDistribution = Specialty::withCount('doctorProfiles')->get()->map(function ($s) use ($totalDoctorsAll) {
            return [
                'id' => $s->id,
                'name' => $s->name_ar,
                'doctors_count' => $s->doctor_profiles_count,
                'share_percentage' => $totalDoctorsAll > 0 ? round(($s->doctor_profiles_count / $totalDoctorsAll) * 100, 1) : 0,
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
        $groups = Group::withCount('facilities')
            ->with(['admins', 'facilities' => function ($q) {
                $q->withCount('doctorProfiles');
            }])
            ->orderBy('name_ar')
            ->get();

        $clinics = Clinic::with(['group', 'admins'])
            ->withCount('doctorProfiles')
            ->orderByDesc('id')
            ->get();

        $doctors = DoctorProfile::with([
            'user',
            'specialty',
            'clinic',
            'doctorFacilities.facility',
        ])->orderByDesc('id')->get();

        $specialties = Specialty::withCount('doctorProfiles')->get();

        $appointments = Appointment::with([
            'patient',
            'doctor.user',
            'doctor.clinic',
            'doctor.specialty',
            'facility',
            'queueTicket',
        ])->orderByDesc('appointment_date')->orderByDesc('appointment_time')->take(50)->get();

        $roleAssignments = RoleAssignment::with('user')->orderByDesc('id')->get()->map(function ($assignment) {
            $scopeName = 'غير محدد';
            if ($assignment->scope_type === 'group') {
                $scopeName = Group::find($assignment->scope_id)?->name_ar ?? "مجمع #{$assignment->scope_id}";
            } elseif ($assignment->scope_type === 'facility') {
                $facility = Facility::with('group')->find($assignment->scope_id);
                $scopeName = $facility ? "{$facility->name} (" . ($facility->group?->name_ar ?? 'مستقل') . ")" : "منشأة #{$assignment->scope_id}";
            }

            return [
                'id' => $assignment->id,
                'user_id' => $assignment->user_id,
                'user_name' => $assignment->user?->name ?? 'مستخدم غير معروف',
                'user_email' => $assignment->user?->email ?? '',
                'user_phone' => $assignment->user?->phone ?? '',
                'role' => $assignment->role,
                'scope_type' => $assignment->scope_type,
                'scope_id' => $assignment->scope_id,
                'scope_name' => $scopeName,
                'created_at' => $assignment->created_at?->format('Y-m-d'),
            ];
        });

        $allUsers = User::select('id', 'name', 'email', 'phone', 'role')->orderBy('name')->get();

        return Inertia::render('admin/analytics', [
            'metrics' => [
                'totalBookings' => $totalBookings,
                'totalRevenue' => number_format($totalRevenue, 0) . ' ر.س',
                'activeDoctors' => $activeDoctorsCount,
                'activeHospitals' => $activeHospitalsCount,
                'complianceRate' => $complianceRate,
                'avgWaitingTime' => $avgWaitingTime,
            ],
            'chartData' => $chartData,
            'specialtyDistribution' => $specialtyDistribution,
            'groups' => $groups,
            'clinics' => $clinics,
            'doctors' => $doctors,
            'specialties' => $specialties,
            'appointments' => $appointments,
            'roleAssignments' => $roleAssignments,
            'allUsers' => $allUsers,
        ]);
    }

    // ==========================================
    // GROUP & CLINIC MANAGEMENT ACTIONS
    // ==========================================

    public function storeGroup(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'cr_number' => 'nullable|string|max:50',
            'create_admin' => 'nullable|boolean',
            'admin_name' => 'nullable|required_if:create_admin,true|string|max:255',
            'admin_email' => 'nullable|required_if:create_admin,true|email|max:255|unique:users,email',
            'admin_password' => 'nullable|required_if:create_admin,true|string|min:6',
            'admin_phone' => 'nullable|string|max:30',
        ]);

        $group = Group::create([
            'name_ar' => $validated['name_ar'],
            'name_en' => $validated['name_en'] ?? null,
            'slug' => 'grp-' . Str::slug($validated['name_ar']) . '-' . Str::lower(Str::random(6)),
            'cr_number' => $validated['cr_number'] ?? null,
            'status' => 'active',
        ]);

        if ($request->boolean('create_admin') && !empty($validated['admin_email'])) {
            $adminUser = User::create([
                'name' => $validated['admin_name'],
                'email' => $validated['admin_email'],
                'password' => Hash::make($validated['admin_password']),
                'phone' => $validated['admin_phone'] ?? '+966500000000',
                'role' => 'patient',
            ]);

            RoleAssignment::create([
                'user_id' => $adminUser->id,
                'role' => 'group_admin',
                'scope_type' => 'group',
                'scope_id' => $group->id,
            ]);
        }

        return back()->with('success', 'تم إضافة المجمع الطبي الجديد وتعيين المشرف بنجاح.');
    }

    public function updateGroup(Request $request, Group $group): RedirectResponse
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'cr_number' => 'nullable|string|max:50',
            'status' => 'nullable|in:active,suspended',
        ]);

        $group->update($validated);

        return back()->with('success', 'تم تحديث بيانات المجمع الطبي بنجاح.');
    }

    public function deleteGroup(Group $group): RedirectResponse
    {
        if ($group->facilities()->count() > 0) {
            return back()->withErrors(['group' => 'لا يمكن حذف المجمع الطبي لوجود مستشفيات أو عيادات مرتبطة به.']);
        }

        $group->delete();

        return back()->with('success', 'تم حذف المجمع الطبي بنجاح.');
    }

    // ==========================================
    // ROLE ASSIGNMENTS & STAFF MANAGEMENT
    // ==========================================

    public function storeRoleAssignment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'role' => 'required|in:group_admin,facility_admin,receptionist',
            'scope_type' => 'required|in:group,facility',
            'scope_id' => 'required|integer',
            'user_mode' => 'required|in:existing,new',
            'user_id' => 'nullable|required_if:user_mode,existing|exists:users,id',
            'new_name' => 'nullable|required_if:user_mode,new|string|max:255',
            'new_email' => 'nullable|required_if:user_mode,new|email|max:255|unique:users,email',
            'new_password' => 'nullable|required_if:user_mode,new|string|min:6',
            'new_phone' => 'nullable|string|max:30',
        ]);

        if ($validated['scope_type'] === 'group' && !Group::where('id', $validated['scope_id'])->exists()) {
            return back()->withErrors(['scope_id' => 'المجمع الطبي المحدد غير موجود.']);
        }
        if ($validated['scope_type'] === 'facility' && !Facility::where('id', $validated['scope_id'])->exists()) {
            return back()->withErrors(['scope_id' => 'المنشأة الطبية المحددة غير موجودة.']);
        }

        $userId = $validated['user_id'] ?? null;
        if ($validated['user_mode'] === 'new') {
            $newUser = User::create([
                'name' => $validated['new_name'],
                'email' => $validated['new_email'],
                'password' => Hash::make($validated['new_password']),
                'phone' => $validated['new_phone'] ?? '+966500000000',
                'role' => 'patient',
            ]);
            $userId = $newUser->id;
        }

        RoleAssignment::firstOrCreate([
            'user_id' => $userId,
            'role' => $validated['role'],
            'scope_type' => $validated['scope_type'],
            'scope_id' => $validated['scope_id'],
        ]);

        $roleArabic = match ($validated['role']) {
            'group_admin' => 'مدير مجمع طبي',
            'facility_admin' => 'مدير مستشفى / عيادة',
            'receptionist' => 'موظف استقبال',
        };

        return back()->with('success', "تم تعيين الصلاحية ({$roleArabic}) بنجاح.");
    }

    public function deleteRoleAssignment(RoleAssignment $roleAssignment): RedirectResponse
    {
        $roleAssignment->delete();

        return back()->with('success', 'تم سحب الصلاحية من المشرف بنجاح.');
    }

    // ==========================================
    // DOCTOR MULTI-FACILITY ASSIGNMENTS
    // ==========================================

    public function storeDoctorFacility(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'doctor_profile_id' => 'required|exists:doctor_profiles,id',
            'facility_id' => 'required|exists:facilities,id',
            'consultation_fee' => 'required|numeric|min:0',
            'default_slot_minutes' => 'required|integer|min:5|max:120',
            'accepts_insurance' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        DoctorFacility::updateOrCreate(
            [
                'doctor_profile_id' => $validated['doctor_profile_id'],
                'facility_id' => $validated['facility_id'],
            ],
            [
                'consultation_fee' => $validated['consultation_fee'],
                'default_slot_minutes' => $validated['default_slot_minutes'],
                'accepts_insurance' => $request->boolean('accepts_insurance', true),
                'is_active' => $request->boolean('is_active', true),
            ]
        );

        return back()->with('success', 'تم تعيين الطبيب في المنشأة الطبية وتحديث البيانات بنجاح.');
    }

    public function deleteDoctorFacility(DoctorFacility $doctorFacility): RedirectResponse
    {
        $doctorFacility->delete();

        return back()->with('success', 'تم إلغاء تعيين الطبيب من هذه المنشأة بنجاح.');
    }

    public function storeClinic(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'branch_name' => 'nullable|string|max:255',
            'group_id' => 'nullable|exists:groups,id',
            'type' => 'nullable|in:hospital,clinic',
            'city' => 'required|string|max:100',
            'district' => 'required|string|max:100',
            'address' => 'required|string|max:255',
            'phone' => 'nullable|string|max:30',
        ]);

        Clinic::create([
            'name' => $validated['name'],
            'branch_name' => $validated['branch_name'] ?? 'الفرع الرئيسي',
            'group_id' => $validated['group_id'] ?? null,
            'type' => $validated['type'] ?? (str_contains($validated['name'], 'مستشفى') ? 'hospital' : 'clinic'),
            'city' => $validated['city'],
            'district' => $validated['district'],
            'address' => $validated['address'],
            'phone' => $validated['phone'] ?? '+966110000000',
            'is_active' => true,
            'is_verified' => false,
        ]);

        return back()->with('success', 'تم إضافة المنشأة الطبية الجديدة بنجاح (قيد التدقيق).');
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

    public function toggleClinicVerification(Clinic $clinic): RedirectResponse
    {
        $clinic->update([
            'is_verified' => ! $clinic->is_verified,
        ]);

        $statusText = $clinic->is_verified ? 'توثيق واعتماد' : 'إلغاء توثيق';
        return back()->with('success', "تم {$statusText} المنشأة الطبية بنجاح.");
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
            'clinic_id' => 'required|exists:facilities,id',
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
