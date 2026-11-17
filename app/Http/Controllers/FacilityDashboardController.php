<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorFacility;
use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\QueueTicket;
use App\Models\RoleAssignment;
use App\Models\Specialty;
use App\Models\User;
use App\Services\ScopeResolver;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FacilityDashboardController extends Controller
{
    private function getFacilityData(Request $request, string $section = 'all'): array
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->isGroupAdmin() && !$user->isFacilityAdmin() && !$user->isReceptionist()) {
            abort(403, 'غير مصرح لك بالوصول إلى لوحة إدارة المنشأة والاستقبال.');
        }

        $resolver = new ScopeResolver();
        $facilityIds = $resolver->accessibleFacilityIds($user);
        $facilities = Facility::whereIn('id', $facilityIds)->with('group')->get();

        $selectedFacilityId = $request->input('facility_id') ?? $request->query('facility_id');
        $primaryFacility = null;
        if ($selectedFacilityId) {
            $primaryFacility = $facilities->firstWhere('id', (int) $selectedFacilityId);
        }
        if (!$primaryFacility) {
            $primaryFacility = $facilities->first();
        }
        if (!$primaryFacility) {
            abort(404, 'لا توجد منشأة طبية مرتبطة بحسابك.');
        }

        $today = Carbon::today();
        $needsDoctors = in_array($section, ['all', 'index', 'doctors', 'specialties', 'appointments'], true);
        $needsTodayAppointments = in_array($section, ['all', 'index', 'appointments'], true);
        $needsAllAppointments = in_array($section, ['all', 'appointments'], true);
        $needsAvailableDoctors = in_array($section, ['all', 'doctors'], true);
        $needsAllSpecialties = in_array($section, ['all', 'doctors', 'specialties'], true);
        $needsReceptionists = in_array($section, ['all', 'receptionists'], true);

        // Doctors practicing at this facility (via primary clinic or multi-facility assignment)
        $doctors = collect();
        if ($needsDoctors) {
            $doctors = DoctorProfile::where(function ($query) use ($primaryFacility) {
                $query->where('clinic_id', $primaryFacility->id)
                    ->orWhereHas('doctorFacilities', function ($q) use ($primaryFacility) {
                        $q->where('facility_id', $primaryFacility->id);
                    });
            })
                ->with(['user', 'specialty', 'doctorFacilities' => function ($q) use ($primaryFacility) {
                    $q->where('facility_id', $primaryFacility->id);
                }])
                ->get()
                ->map(function ($doc) {
                    $pivot = $doc->doctorFacilities->first();
                    $doc->facility_consultation_fee = $pivot ? (float) $pivot->consultation_fee : (float) $doc->consultation_fee;
                    $doc->facility_slot_minutes = $pivot ? (int) $pivot->default_slot_minutes : (int) ($doc->waiting_time_minutes ?: 15);
                    $doc->facility_accepts_insurance = $pivot ? (bool) $pivot->accepts_insurance : (bool) $doc->accepts_insurance;
                    $doc->facility_is_active = $pivot ? (bool) $pivot->is_active : (bool) $doc->is_available_today;
                    return $doc;
                });
        }

        $dateParam = $request->input('date') ?? $request->query('date');
        $isAllDates = $dateParam === 'all';
        $filterDate = null;

        if (!$isAllDates && !empty($dateParam)) {
            try {
                $filterDate = Carbon::parse($dateParam)->toDateString();
            } catch (\Throwable $e) {
                $filterDate = $today->toDateString();
            }
        } elseif (!$isAllDates) {
            $filterDate = $today->toDateString();
        }

        $todayAppointments = collect();
        if ($needsTodayAppointments) {
            $appointmentsQuery = Appointment::where('facility_id', $primaryFacility->id)
                ->with(['patient', 'doctor.user', 'doctor.specialty', 'queueTicket']);

            if (!$isAllDates && $filterDate) {
                $appointmentsQuery->whereDate('appointment_date', $filterDate);
            }

            $todayAppointments = $appointmentsQuery
                ->orderBy('appointment_date')
                ->orderBy('appointment_time')
                ->get();
        }

        $allAppointments = collect();
        if ($needsAllAppointments) {
            $allAppointments = Appointment::where('facility_id', $primaryFacility->id)
                ->with(['patient', 'doctor.user', 'queueTicket'])
                ->orderByDesc('appointment_date')
                ->orderByDesc('appointment_time')
                ->take(100)
                ->get();
        }

        $allSpecialties = $needsAllSpecialties
            ? Specialty::orderBy('id')->get()->unique('name_ar')->values()
            : collect();

        $facilitySettings = is_array($primaryFacility->settings) ? $primaryFacility->settings : [];
        $configuredSpecialtyIds = $facilitySettings['specialty_ids'] ?? [];
        $doctorSpecialtyIds = $doctors->pluck('specialty.id')->filter()->unique()->values()->all();
        $activeSpecialtyIds = array_values(array_unique(array_merge($doctorSpecialtyIds, $configuredSpecialtyIds)));

        $specialties = $needsAllSpecialties
            ? $allSpecialties->filter(fn ($s) => in_array($s->id, $activeSpecialtyIds))->values()
            : $doctors->pluck('specialty')->filter()->unique('id')->values();

        $availableDoctors = collect();
        if ($needsAvailableDoctors) {
            $availableDoctors = DoctorProfile::with(['user', 'specialty', 'clinic'])
                ->where('clinic_id', '!=', $primaryFacility->id)
                ->whereDoesntHave('doctorFacilities', function ($q) use ($primaryFacility) {
                    $q->where('facility_id', $primaryFacility->id);
                })
                ->get();
        }

        // Fast aggregated SQL metrics for today's status
        $todayStatusCounts = Appointment::where('facility_id', $primaryFacility->id)
            ->whereDate('appointment_date', $today)
            ->selectRaw("
                COUNT(*) as total_today,
                SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting_count,
                SUM(CASE WHEN status = 'in_consultation' THEN 1 ELSE 0 END) as in_consultation_count,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN status IN ('confirmed', 'booked') THEN 1 ELSE 0 END) as not_arrived_count,
                SUM(CASE WHEN payment_method = 'insurance' THEN 1 ELSE 0 END) as insurance_count
            ")
            ->first();

        $receptionists = collect();
        $availableUsers = collect();
        if ($needsReceptionists) {
            $receptionists = RoleAssignment::where('scope_type', 'facility')
                ->where('scope_id', $primaryFacility->id)
                ->where('role', 'receptionist')
                ->with('user')
                ->orderByDesc('id')
                ->get()
                ->map(function ($assignment) {
                    return [
                        'id' => $assignment->id,
                        'user_id' => $assignment->user_id,
                        'name' => $assignment->user?->name ?? 'غير محدد',
                        'email' => $assignment->user?->email ?? '',
                        'phone' => $assignment->user?->phone ?? '',
                        'avatar' => $assignment->user?->avatar,
                        'national_id' => $assignment->user?->national_id,
                        'created_at' => $assignment->created_at?->toIso8601String() ?? '',
                        'scope_id' => $assignment->scope_id,
                        'role' => $assignment->role,
                    ];
                });

            $assignedUserIds = $receptionists->pluck('user_id')->filter()->all();
            $availableUsers = User::select('id', 'name', 'email', 'phone')
                ->where('role', '!=', 'admin')
                ->whereNotIn('id', $assignedUserIds)
                ->orderBy('name')
                ->take(100)
                ->get();
        }

        $receptionistsCount = $needsReceptionists
            ? $receptionists->count()
            : RoleAssignment::where('scope_type', 'facility')
                ->where('scope_id', $primaryFacility->id)
                ->where('role', 'receptionist')
                ->count();

        $metrics = [
            'doctorsCount' => $needsDoctors ? $doctors->count() : DoctorProfile::where('clinic_id', $primaryFacility->id)->count(),
            'activeDoctorsCount' => $needsDoctors ? $doctors->where('is_available_today', true)->count() : 0,
            'specialtiesCount' => $specialties->count(),
            'totalToday' => (int) ($todayStatusCounts->total_today ?? 0),
            'waitingCount' => (int) ($todayStatusCounts->waiting_count ?? 0),
            'inConsultationCount' => (int) ($todayStatusCounts->in_consultation_count ?? 0),
            'completedCount' => (int) ($todayStatusCounts->completed_count ?? 0),
            'notArrivedCount' => (int) ($todayStatusCounts->not_arrived_count ?? 0),
            'insuranceCount' => (int) ($todayStatusCounts->insurance_count ?? 0),
            'receptionistsCount' => $receptionistsCount,
        ];

        return [
            'facility' => $primaryFacility,
            'facilities' => $facilities,
            'metrics' => $metrics,
            'doctors' => $doctors,
            'specialties' => $specialties,
            'allSpecialties' => $allSpecialties,
            'availableDoctors' => $availableDoctors,
            'todayAppointments' => $todayAppointments,
            'allAppointments' => $allAppointments,
            'selectedDateFilter' => $isAllDates ? 'all' : ($filterDate ?? $today->toDateString()),
            'todayDate' => $today->toDateString(),
            'receptionists' => $receptionists,
            'availableUsers' => $availableUsers,
            'canManageFacility' => $resolver->canManageFacility($user, $primaryFacility->id),
        ];
    }

    public function index(Request $request): Response
    {
        $data = $this->getFacilityData($request, 'index');
        $facilityId = $data['facility']->id;
        $data['initialLiveEvents'] = \Illuminate\Support\Facades\Cache::get("facility_live_events_{$facilityId}", []);
        return Inertia::render('facility/dashboard', $data);
    }

    public function liveSync(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $this->getFacilityData($request, 'index');
        $facilityId = $data['facility']->id;
        $events = \Illuminate\Support\Facades\Cache::get("facility_live_events_{$facilityId}", []);

        return response()->json([
            'metrics' => $data['metrics'],
            'todayAppointments' => $data['todayAppointments'],
            'events' => is_array($events) ? $events : [],
            'serverTime' => Carbon::now()->format('h:i:s A'),
        ]);
    }

    public function doctors(Request $request): Response
    {
        $data = $this->getFacilityData($request, 'doctors');
        return Inertia::render('facility/doctors', $data);
    }

    public function specialties(Request $request): Response
    {
        $user = $request->user();
        $data = $this->getFacilityData($request, 'specialties');
        $resolver = new ScopeResolver();

        if (!$resolver->canManageFacility($user, $data['facility']->id)) {
            abort(403, 'غير مصرح لموظف الاستقبال بإدارة التخصصات والأقسام الطبية.');
        }

        return Inertia::render('facility/specialties', $data);
    }

    public function appointments(Request $request): Response
    {
        $data = $this->getFacilityData($request, 'appointments');
        return Inertia::render('facility/appointments', $data);
    }

    public function receptionists(Request $request): Response
    {
        $user = $request->user();
        $data = $this->getFacilityData($request, 'receptionists');
        $resolver = new ScopeResolver();

        if (!$resolver->canManageFacility($user, $data['facility']->id)) {
            abort(403, 'غير مصرح لك بإدارة موظفي الاستقبال لهذه المنشأة.');
        }

        return Inertia::render('facility/receptionists', $data);
    }

    public function storeReceptionist(Request $request): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();

        $facilityId = $request->input('facility_id');
        $facility = $facilityId ? Facility::findOrFail($facilityId) : null;
        if (!$facility) {
            $accessibleIds = $resolver->accessibleFacilityIds($user);
            $facility = Facility::whereIn('id', $accessibleIds)->first();
        }

        if (!$facility || !$resolver->canManageFacility($user, $facility->id)) {
            abort(403, 'غير مصرح لك بإضافة موظف استقبال لهذه المنشأة.');
        }

        $mode = $request->input('mode', 'new');

        if ($mode === 'existing') {
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
            ], [
                'user_id.required' => 'يرجى اختيار المستخدم المراد تعيينه.',
                'user_id.exists' => 'المستخدم المحدد غير موجود.',
            ]);

            $targetUser = User::findOrFail($validated['user_id']);

            $existingAssignment = RoleAssignment::where('user_id', $targetUser->id)
                ->where('role', 'receptionist')
                ->where('scope_type', 'facility')
                ->where('scope_id', $facility->id)
                ->first();

            if ($existingAssignment) {
                return back()->with('error', "المستخدم ({$targetUser->name}) معين بالفعل كموظف استقبال في هذه المنشأة.");
            }

            RoleAssignment::create([
                'user_id' => $targetUser->id,
                'role' => 'receptionist',
                'scope_type' => 'facility',
                'scope_id' => $facility->id,
            ]);

            return back()->with('success', "تم تعيين ({$targetUser->name}) كموظف استقبال في {$facility->name} بنجاح.");
        }

        // New user creation
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'national_id' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
        ], [
            'name.required' => 'حقل الاسم بالكامل مطلوب.',
            'email.required' => 'حقل البريد الإلكتروني مطلوب.',
            'email.email' => 'يرجى إدخال بريد إلكتروني صحيح.',
            'email.unique' => 'هذا البريد الإلكتروني مسجل مسبقاً في النظام.',
            'password.required' => 'حقل كلمة المرور مطلوب.',
            'password.min' => 'يجب ألا تقل كلمة المرور عن 6 أحرف/أرقام.',
        ]);

        $newUser = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? '+966500000000',
            'national_id' => $validated['national_id'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'patient', // Base role; scoped role grants receptionist access
        ]);

        RoleAssignment::create([
            'user_id' => $newUser->id,
            'role' => 'receptionist',
            'scope_type' => 'facility',
            'scope_id' => $facility->id,
        ]);

        return back()->with('success', "تم إنشاء حساب موظف الاستقبال ({$newUser->name}) وتعيينه بنجاح.");
    }

    public function updateReceptionist(Request $request, RoleAssignment $roleAssignment): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();

        if ($roleAssignment->scope_type !== 'facility' || $roleAssignment->role !== 'receptionist') {
            abort(404, 'سجل موظف الاستقبال غير صالح.');
        }

        if (!$resolver->canManageFacility($user, $roleAssignment->scope_id)) {
            abort(403, 'غير مصرح لك بتعديل بيانات موظف الاستقبال لهذه المنشأة.');
        }

        $targetUser = $roleAssignment->user;
        if (!$targetUser) {
            abort(404, 'المستخدم غير موجود.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($targetUser->id)],
            'phone' => 'nullable|string|max:30',
            'national_id' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
        ], [
            'name.required' => 'حقل الاسم بالكامل مطلوب.',
            'email.required' => 'حقل البريد الإلكتروني مطلوب.',
            'email.email' => 'يرجى إدخال بريد إلكتروني صحيح.',
            'email.unique' => 'هذا البريد الإلكتروني مسجل مسبقاً لمستخدم آخر.',
            'password.min' => 'يجب ألا تقل كلمة المرور عن 6 أحرف.',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? $targetUser->phone,
            'national_id' => $validated['national_id'] ?? $targetUser->national_id,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $targetUser->update($updateData);

        return back()->with('success', "تم تحديث بيانات موظف الاستقبال ({$targetUser->name}) بنجاح.");
    }

    public function destroyReceptionist(Request $request, RoleAssignment $roleAssignment): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();

        if ($roleAssignment->scope_type !== 'facility' || $roleAssignment->role !== 'receptionist') {
            abort(404, 'سجل موظف الاستقبال غير صالح.');
        }

        if (!$resolver->canManageFacility($user, $roleAssignment->scope_id)) {
            abort(403, 'غير مصرح لك بإلغاء تعيين موظف الاستقبال لهذه المنشأة.');
        }

        $targetUser = $roleAssignment->user;
        $userName = $targetUser?->name ?? 'موظف الاستقبال';

        $roleAssignment->delete();

        return back()->with('success', "تم إلغاء تعيين موظف الاستقبال ({$userName}) من المنشأة بنجاح.");
    }

    public function toggleDoctorPresence(Request $request, DoctorProfile $doctor): RedirectResponse
    {
        $doctor->update([
            'is_available_today' => ! $doctor->is_available_today,
        ]);

        $statusText = $doctor->is_available_today ? 'حاضر ومتاح لاستقبال الحالات' : 'معلّق وغير حاضر اليوم';
        return back()->with('success', "تم تحديث حالة الطبيب ({$doctor->user->name}) إلى: {$statusText}");
    }

    public function storeDoctor(Request $request): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();

        $facilityId = $request->input('facility_id');
        $facility = $facilityId ? Facility::findOrFail($facilityId) : null;

        if (!$facility) {
            $accessibleIds = $resolver->accessibleFacilityIds($user);
            $facility = Facility::whereIn('id', $accessibleIds)->first();
        }

        if (!$facility || !$resolver->canManageFacility($user, $facility->id)) {
            abort(403, 'غير مصرح لك بإضافة أو تعيين الأطباء. يقتصر دور الاستقبال على تنسيق الحضور والمربعات المتاحة.');
        }

        $mode = $request->input('mode', 'new');

        if ($mode === 'existing') {
            $validated = $request->validate([
                'doctor_profile_id' => 'required|exists:doctor_profiles,id',
                'consultation_fee' => 'required|numeric|min:0',
                'waiting_time_minutes' => 'nullable|integer|min:5|max:120',
                'accepts_insurance' => 'nullable|boolean',
            ]);

            DoctorFacility::updateOrCreate(
                [
                    'doctor_profile_id' => $validated['doctor_profile_id'],
                    'facility_id' => $facility->id,
                ],
                [
                    'consultation_fee' => $validated['consultation_fee'],
                    'default_slot_minutes' => $validated['waiting_time_minutes'] ?? 20,
                    'accepts_insurance' => $request->boolean('accepts_insurance', true),
                    'is_active' => true,
                ]
            );

            $doc = DoctorProfile::with('user')->find($validated['doctor_profile_id']);
            return back()->with('success', "تم تعيين الطبيب ({$doc->user->name}) في منشأة {$facility->name} بنجاح.");
        }

        // New doctor creation
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'specialty_id' => 'required|exists:specialties,id',
            'title_ar' => 'required|string|max:255',
            'subspecialty' => 'nullable|string|max:255',
            'consultation_fee' => 'required|numeric|min:0',
            'waiting_time_minutes' => 'nullable|integer|min:5|max:120',
            'experience_years' => 'nullable|integer|min:0|max:50',
            'license_no' => 'nullable|string|max:50',
            'accepts_insurance' => 'nullable|boolean',
        ]);

        $doctorUser = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? '0500000000',
            'role' => 'doctor',
            'password' => Hash::make($validated['password']),
            'avatar' => 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop&crop=faces',
        ]);

        $doctorProfile = DoctorProfile::create([
            'user_id' => $doctorUser->id,
            'clinic_id' => $facility->id,
            'specialty_id' => $validated['specialty_id'],
            'title_ar' => $validated['title_ar'],
            'subspecialty' => $validated['subspecialty'] ?? '',
            'consultation_fee' => $validated['consultation_fee'],
            'waiting_time_minutes' => $validated['waiting_time_minutes'] ?? 15,
            'experience_years' => $validated['experience_years'] ?? 5,
            'license_no' => $validated['license_no'] ?? null,
            'accepts_insurance' => $request->boolean('accepts_insurance', true),
            'accepted_insurances' => ['بوبا العربية', 'التعاونية', 'ميدغلف', 'تكافل الراجحي'],
            'is_available_today' => true,
            'approval_status' => 'approved',
        ]);

        DoctorFacility::updateOrCreate(
            [
                'doctor_profile_id' => $doctorProfile->id,
                'facility_id' => $facility->id,
            ],
            [
                'consultation_fee' => $validated['consultation_fee'],
                'default_slot_minutes' => $validated['waiting_time_minutes'] ?? 15,
                'accepts_insurance' => $request->boolean('accepts_insurance', true),
                'is_active' => true,
            ]
        );

        return back()->with('success', "تم إضافة واعتماد الطبيب ({$doctorUser->name}) في كادر {$facility->name} بنجاح.");
    }

    public function updateDoctor(Request $request, DoctorProfile $doctor): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();

        $facilityId = $request->input('facility_id');
        $facility = $facilityId ? Facility::findOrFail($facilityId) : null;
        if (!$facility) {
            $accessibleIds = $resolver->accessibleFacilityIds($user);
            $facility = Facility::whereIn('id', $accessibleIds)->first();
        }

        if (!$facility || !$resolver->canManageFacility($user, $facility->id)) {
            abort(403, 'غير مصرح لك بتعديل بيانات الطبيب في هذه المنشأة.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $doctor->user_id,
            'phone' => 'nullable|string|max:20',
            'specialty_id' => 'required|exists:specialties,id',
            'title_ar' => 'required|string|max:255',
            'subspecialty' => 'nullable|string|max:255',
            'consultation_fee' => 'required|numeric|min:0',
            'waiting_time_minutes' => 'nullable|integer|min:5|max:120',
            'experience_years' => 'nullable|integer|min:0|max:50',
            'license_no' => 'nullable|string|max:50',
            'accepts_insurance' => 'nullable|boolean',
        ]);

        $doctor->user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? $doctor->user->phone,
        ]);

        $doctor->update([
            'specialty_id' => $validated['specialty_id'],
            'title_ar' => $validated['title_ar'],
            'subspecialty' => $validated['subspecialty'] ?? '',
            'consultation_fee' => $validated['consultation_fee'],
            'waiting_time_minutes' => $validated['waiting_time_minutes'] ?? 15,
            'experience_years' => $validated['experience_years'] ?? $doctor->experience_years,
            'license_no' => $validated['license_no'] ?? $doctor->license_no,
            'accepts_insurance' => $request->boolean('accepts_insurance', true),
        ]);

        DoctorFacility::updateOrCreate(
            [
                'doctor_profile_id' => $doctor->id,
                'facility_id' => $facility->id,
            ],
            [
                'consultation_fee' => $validated['consultation_fee'],
                'default_slot_minutes' => $validated['waiting_time_minutes'] ?? 15,
                'accepts_insurance' => $request->boolean('accepts_insurance', true),
                'is_active' => true,
            ]
        );

        return back()->with('success', "تم تحديث بيانات الطبيب ({$doctor->user->name}) بنجاح.");
    }

    public function destroyDoctor(Request $request, DoctorProfile $doctor): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();

        $facilityId = $request->input('facility_id');
        $facility = $facilityId ? Facility::findOrFail($facilityId) : null;
        if (!$facility) {
            $accessibleIds = $resolver->accessibleFacilityIds($user);
            $facility = Facility::whereIn('id', $accessibleIds)->first();
        }

        if (!$facility || !$resolver->canManageFacility($user, $facility->id)) {
            abort(403, 'غير مصرح لك بإلغاء تعيين أو حذف هذا الطبيب من هذه المنشأة.');
        }

        $hasActiveAppointments = Appointment::where('doctor_id', $doctor->id)
            ->where('facility_id', $facility->id)
            ->whereIn('status', ['confirmed', 'booked', 'waiting', 'in_consultation'])
            ->whereDate('appointment_date', '>=', Carbon::today())
            ->exists();

        if ($hasActiveAppointments) {
            return back()->with('error', 'لا يمكن إزالة الطبيب لوجود مواعيد أو كشوفات جارية/مجدولة له اليوم أو في المستقبل بهذه المنشأة.');
        }

        $doctorName = $doctor->user->name ?? 'الطبيب';

        // Detach from this facility
        DoctorFacility::where('doctor_profile_id', $doctor->id)
            ->where('facility_id', $facility->id)
            ->delete();

        // Check if there are other facility assignments
        $remainingFacility = DoctorFacility::where('doctor_profile_id', $doctor->id)->first();

        if ($doctor->clinic_id == $facility->id) {
            if ($remainingFacility) {
                $doctor->update(['clinic_id' => $remainingFacility->facility_id]);
            } else {
                $hasAnyAppointments = Appointment::where('doctor_id', $doctor->id)->exists();
                if (!$hasAnyAppointments) {
                    $doctorUser = $doctor->user;
                    $doctor->delete();
                    if ($doctorUser) {
                        $doctorUser->delete();
                    }
                    return back()->with('success', "تم حذف الطبيب ({$doctorName}) وجميع بياناته بنجاح لعدم وجود ارتباطات بمنشآت أخرى.");
                }
            }
        }

        return back()->with('success', "تم إلغاء ارتباط الطبيب ({$doctorName}) بمنشأة {$facility->name} بنجاح.");
    }

    public function confirmBooking(Request $request, Appointment $appointment): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();
        $facilityId = $appointment->facility_id ?? 0;

        $canConfirm = $user->role === 'admin'
            || $resolver->canManageFacility($user, $facilityId)
            || $user->isReceptionist($facilityId);

        if (!$canConfirm) {
            abort(403, 'غير مصرح لك بتأكيد الحجز. هذه الصلاحية خاصة بإدارة واستقبال المنشأة.');
        }

        $appointment->confirmBooking($user->id);

        // Send WhatsApp notification (Template 2: Stage 1 Booking Confirmed)
        app(\App\Services\GupshupWhatsAppService::class)->notifyBookingConfirmed($appointment);

        return back()->with('success', "تم تأكيد الحجز للمريض ({$appointment->patient?->name}) بنجاح.");
    }

    public function updateStatus(Request $request, Appointment $appointment): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();
        $facilityId = $appointment->facility_id ?? 0;

        $validated = $request->validate([
            'status' => 'required|in:booked,confirmed,waiting,in_consultation,completed,cancelled',
        ]);

        $status = $validated['status'];
        $gupshup = app(\App\Services\GupshupWhatsAppService::class);

        if ($status === 'confirmed') {
            $canConfirm = $user->role === 'admin'
                || $resolver->canManageFacility($user, $facilityId)
                || $user->isReceptionist($facilityId);

            if (!$canConfirm) {
                abort(403, 'تأكيد الحجز من صلاحيات موظفي الاستقبال وإدارة المنشأة.');
            }
            $appointment->confirmBooking($user->id);
            $gupshup->notifyBookingConfirmed($appointment);
        } elseif ($status === 'waiting') {
            $canCheckIn = $user->role === 'admin'
                || $resolver->canManageFacility($user, $facilityId)
                || $user->isReceptionist($facilityId);
            if (!$canCheckIn) {
                abort(403, 'تأكيد الحضور (المرحلة 2) من صلاحيات موظف الاستقبال أو الإدارة.');
            }
            $appointment->confirmArrival($user->id);
            $gupshup->notifyArrivalConfirmed($appointment);
        } elseif ($status === 'completed') {
            $canComplete = $user->role === 'admin'
                || $resolver->canManageFacility($user, $facilityId)
                || ($user->doctorProfile && $user->doctorProfile->id === $appointment->doctor_id);

            if (!$canComplete) {
                abort(403, 'إنهاء الكشف الطبي (المرحلة 3) خاص بالطبيب المعالج فقط.');
            }
            $appointment->confirmFinishConsultation($user->id);
            $gupshup->notifyConsultationCompleted($appointment);
        } else {
            $appointment->update(['status' => $status]);
            $ticket = $appointment->queueTicket;
            if ($ticket) {
                if ($status === 'in_consultation') {
                    $ticket->update(['status' => 'examining', 'started_at' => Carbon::now()]);
                } elseif ($status === 'cancelled') {
                    $ticket->update(['status' => 'cancelled']);
                }
            }

            if ($status === 'in_consultation') {
                $gupshup->notifyPatientCalled($appointment);
            } elseif ($status === 'cancelled') {
                $gupshup->notifyAppointmentCancelled($appointment);
            }
        }

        $statusLabels = [
            'booked' => 'حجز جديد (بانتظار تأكيد الإدارة)',
            'confirmed' => 'تم تأكيد الحجز (بانتظار وصول المريض)',
            'waiting' => 'حضر بالاستقبال (في الانتظار)',
            'in_consultation' => 'داخل العيادة مع الطبيب',
            'completed' => 'مكتمل (أنهى وغادر)',
            'cancelled' => 'غائب / ملغي',
        ];

        return back()->with('success', "تم تحديث حالة المريض ({$appointment->patient?->name}) إلى: " . ($statusLabels[$status] ?? $status));
    }

    public function updatePayment(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'payment_status' => 'nullable|in:paid,pending,refunded,pending_verification',
            'payment_method' => 'nullable|in:cash,pos,card,insurance',
            'payment_notes' => 'nullable|string|max:500',
            'total_amount' => 'nullable|numeric',
            'amount' => 'nullable|numeric',
        ]);

        $status = $validated['payment_status'] ?? ($request->input('payment_method') === 'insurance' ? 'pending_verification' : 'paid');
        $method = $validated['payment_method'] ?? $appointment->payment_method ?? 'cash';
        $amount = $validated['total_amount'] ?? $validated['amount'] ?? null;

        $updateData = [
            'payment_status' => $status,
            'payment_method' => $method,
        ];

        if ($request->filled('payment_notes')) {
            $updateData['payment_notes'] = $request->input('payment_notes');
        }

        if ($amount !== null) {
            $updateData['total_amount'] = $amount;
        }

        $appointment->update($updateData);

        $methodLabels = [
            'cash' => 'نقداً (كاش)',
            'pos' => 'مدى (Mada / POS)',
            'card' => 'بطاقة ائتمانية',
            'insurance' => 'تأمين طبي معتمد',
        ];

        return back()->with('success', "تم تسجيل تحصيل الرسوم للمريض ({$appointment->patient?->name}) بنجاح عبر: " . ($methodLabels[$method] ?? $method));
    }

    public function markArrived(Request $request, Appointment $appointment): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();
        $facilityId = $appointment->facility_id ?? 0;

        $canCheckIn = $user->role === 'admin'
            || $resolver->canManageFacility($user, $facilityId)
            || $user->isReceptionist($facilityId);

        if (!$canCheckIn) {
            abort(403, 'غير مصرح لك بتأكيد وصول هذا المريض.');
        }

        $appointment->confirmArrival($user->id);

        // Send WhatsApp notification (Template 3: Stage 2 Arrival Confirmed & Ticket)
        app(\App\Services\GupshupWhatsAppService::class)->notifyArrivalConfirmed($appointment);

        return back()->with('success', "تم تأكيد وصول المريض ({$appointment->patient?->name}) بالاستقبال وإدراجه في قائمة الانتظار (المرحلة 2: تأكيد الاستقبال).");
    }

    public function markNoShow(Request $request, Appointment $appointment): RedirectResponse
    {
        $appointment->update(['status' => 'cancelled']);
        if ($appointment->queueTicket) {
            $appointment->queueTicket->update(['status' => 'cancelled']);
        }

        // Send WhatsApp notification (Template 7: Appointment Cancelled / No-show)
        app(\App\Services\GupshupWhatsAppService::class)->notifyAppointmentCancelled($appointment);

        return back()->with('success', "تم تسجيل عدم حضور الحالة ({$appointment->patient->name}).");
    }

    public function issueWalkInTicket(Request $request, Facility $facility): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();
        if (!$resolver->canManageFacility($user, $facility->id) && !$user->isReceptionist($facility->id)) {
            abort(403, 'غير مصرح لك بقطع تذاكر لهذه المنشأة.');
        }

        $validated = $request->validate([
            'doctor_profile_id' => 'required|exists:doctor_profiles,id',
            'patient_name' => 'required|string|max:255',
            'patient_phone' => 'required|string|max:30',
            'patient_national_id' => 'nullable|string|max:20',
        ]);

        $doctor = DoctorProfile::findOrFail($validated['doctor_profile_id']);

        // Find or create patient user
        $patient = User::firstOrCreate(
            ['phone' => $validated['patient_phone']],
            [
                'name' => $validated['patient_name'],
                'email' => 'walkin_' . Str::random(8) . '@tebiby.com',
                'password' => Hash::make(Str::random(12)),
                'role' => 'patient',
                'national_id' => $validated['patient_national_id'] ?? null,
            ]
        );

        $today = Carbon::today();
        $now = Carbon::now();

        // Calculate next ticket number for doctor today
        $nextTicketNumber = QueueTicket::whereDate('queue_date', $today)
            ->whereHas('appointment', fn($q) => $q->where('doctor_id', $doctor->id))
            ->max('ticket_number') ?? 0;

        $newTicketNumber = $nextTicketNumber + 1;

        $bookingRef = 'WLK-' . strtoupper(Str::random(6));

        $doctorFacility = DoctorFacility::where('doctor_profile_id', $doctor->id)
            ->where('facility_id', $facility->id)
            ->first();

        $fee = $doctorFacility ? $doctorFacility->consultation_fee : ($doctor->consultation_fee ?? 200);

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $facility->id,
            'doctor_facility_id' => $doctorFacility?->id,
            'booking_reference' => $bookingRef,
            'appointment_date' => $today->toDateString(),
            'appointment_time' => $now->format('H:i:s'),
            'status' => 'waiting',
            'payment_status' => 'paid',
            'payment_method' => 'cash',
            'consultation_fee' => $fee,
            'total_amount' => $fee,
            'booking_confirmed_at' => Carbon::now(),
            'booking_confirmed_by' => $user->id,
            'arrival_confirmed_at' => Carbon::now(),
            'arrival_confirmed_by' => $user->id,
        ]);

        QueueTicket::create([
            'appointment_id' => $appointment->id,
            'ticket_number' => $newTicketNumber,
            'status' => 'waiting',
            'queue_date' => $today->toDateString(),
            'estimated_wait_minutes' => 15,
        ]);

        // Send WhatsApp notification (Template 3: Arrival Confirmed & Ticket Issued)
        app(\App\Services\GupshupWhatsAppService::class)->notifyArrivalConfirmed($appointment);

        return back()->with('success', "تم قطع التذكرة الفورية بنجاح برقم #{$newTicketNumber} للمريض ({$patient->name}).");
    }

    public function storeSpecialtyAndSectors(Request $request): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();

        $facilityId = $request->input('facility_id');
        $facility = $facilityId ? Facility::findOrFail($facilityId) : null;
        if (!$facility) {
            $accessibleIds = $resolver->accessibleFacilityIds($user);
            $facility = Facility::whereIn('id', $accessibleIds)->first();
        }

        if (!$facility || !$resolver->canManageFacility($user, $facility->id)) {
            abort(403, 'غير مصرح لك بإدارة التخصصات والقطاعات الطبية لهذه المنشأة.');
        }

        $mode = $request->input('mode', 'sync');
        $settings = is_array($facility->settings) ? $facility->settings : [];

        if ($mode === 'create_specialty') {
            $validated = $request->validate([
                'name_ar' => 'required|string|max:255',
                'name_en' => 'nullable|string|max:255',
                'badge_text' => 'nullable|string|max:100',
                'description' => 'nullable|string|max:500',
            ]);

            $specialty = Specialty::create([
                'name_ar' => $validated['name_ar'],
                'name_en' => $validated['name_en'] ?? '',
                'icon_slug' => 'stethoscope',
                'badge_text' => $validated['badge_text'] ?? 'قسم معتمد',
                'description' => $validated['description'] ?? 'قسم طبي تخصصي معتمد داخل المنشأة.',
            ]);

            $currentIds = $settings['specialty_ids'] ?? [];
            $currentIds[] = $specialty->id;
            $settings['specialty_ids'] = array_values(array_unique(array_map('intval', $currentIds)));
            $facility->update(['settings' => $settings]);

            return back()->with('success', "تم إنشاء وإضافة تخصص ({$specialty->name_ar}) للمنشأة بنجاح.");
        }

        if ($request->has('specialty_ids') && is_array($request->input('specialty_ids'))) {
            $settings['specialty_ids'] = array_values(array_unique(array_map('intval', $request->input('specialty_ids'))));
        }

        if ($request->has('sectors') && is_array($request->input('sectors'))) {
            $settings['sectors'] = array_values(array_filter(array_map('trim', $request->input('sectors'))));
        }

        $facility->update(['settings' => $settings]);

        return back()->with('success', "تم تحديث الأقسام التخصصية والقطاعات والمهام الطبية لمنشأة ({$facility->name}) بنجاح.");
    }
}
