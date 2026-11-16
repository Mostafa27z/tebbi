<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorFacility;
use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\Group;
use App\Models\RoleAssignment;
use App\Models\Specialty;
use App\Models\User;
use App\Services\ScopeResolver;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class GroupDashboardController extends Controller
{
    private function getGroupBaseData(Request $request): array
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->isGroupAdmin()) {
            abort(403, 'غير مصرح لك بالوصول إلى لوحة إدارة المجمع الطبي.');
        }

        $resolver = new ScopeResolver();
        $groupIds = $resolver->accessibleGroupIds($user);
        $groups = Group::whereIn('id', $groupIds)->with(['facilities.admins'])->get();

        $requestedGroupId = $request->input('group_id') ?? $request->query('group_id');
        $primaryGroup = $requestedGroupId
            ? ($groups->firstWhere('id', (int) $requestedGroupId) ?? $groups->first())
            : $groups->first();
        if (!$primaryGroup) {
            abort(404, 'لا يوجد مجمع طبي مرتبط بحسابك.');
        }

        $facilityIds = $primaryGroup->facilities->pluck('id');

        // Dynamic metrics for this group
        $facilitiesCount = $primaryGroup->facilities->count();
        $hospitalsCount = $primaryGroup->facilities->where('type', 'hospital')->count();
        $clinicsCount = $primaryGroup->facilities->where('type', 'clinic')->count();

        $doctorsCount = DoctorProfile::whereIn('clinic_id', $facilityIds)
            ->orWhereHas('doctorFacilities', function ($q) use ($facilityIds) {
                $q->whereIn('facility_id', $facilityIds);
            })->count();

        $today = Carbon::today();
        $todayAppointments = Appointment::whereIn('facility_id', $facilityIds)
            ->whereDate('appointment_date', $today)
            ->count();

        $totalRevenue = (float) Appointment::whereIn('facility_id', $facilityIds)
            ->where('payment_status', 'paid')
            ->sum('total_amount');

        $facilities = Facility::whereIn('id', $facilityIds)
            ->with(['admins', 'receptionists'])
            ->withCount('doctorProfiles')
            ->get();

        $doctors = DoctorProfile::whereIn('clinic_id', $facilityIds)
            ->orWhereHas('doctorFacilities', function ($q) use ($facilityIds) {
                $q->whereIn('facility_id', $facilityIds);
            })
            ->with(['user', 'specialty', 'clinic', 'doctorFacilities.facility'])
            ->get();

        $staffAssignments = RoleAssignment::where(function ($q) use ($primaryGroup, $facilityIds) {
            $q->where(function ($gq) use ($primaryGroup) {
                $gq->where('scope_type', 'group')->where('scope_id', $primaryGroup->id);
            })->orWhere(function ($fq) use ($facilityIds) {
                $fq->where('scope_type', 'facility')->whereIn('scope_id', $facilityIds);
            });
        })->with('user')->get()->map(function ($a) {
            return [
                'id' => $a->id,
                'user_name' => $a->user?->name ?? '',
                'user_email' => $a->user?->email ?? '',
                'user_phone' => $a->user?->phone ?? '',
                'role' => $a->role,
                'scope_type' => $a->scope_type,
                'scope_id' => $a->scope_id,
                'scope_name' => $a->scope_type === 'group'
                    ? Group::find($a->scope_id)?->name_ar
                    : Facility::find($a->scope_id)?->name,
            ];
        });

        $specialties = Specialty::orderBy('id')
            ->get()
            ->unique('name_ar')
            ->values()
            ->map(function ($spec) use ($doctors, $facilities) {
                $groupDocCount = $doctors->filter(function ($d) use ($spec) {
                    return $d->specialty_id === $spec->id
                        || ($d->specialty && $d->specialty->name_ar === $spec->name_ar);
                })->count();

                $matchingFacilityIds = $facilities->filter(function ($f) use ($spec, $doctors) {
                    $settingsIds = is_array($f->settings) ? ($f->settings['specialty_ids'] ?? []) : [];
                    if (in_array($spec->id, $settingsIds)) {
                        return true;
                    }
                    return $doctors->contains(function ($d) use ($f, $spec) {
                        $inFac = (int) $d->clinic_id === (int) $f->id
                            || ($d->doctorFacilities && $d->doctorFacilities->contains('facility_id', $f->id));
                        $inSpec = $d->specialty_id === $spec->id
                            || ($d->specialty && $d->specialty->name_ar === $spec->name_ar);
                        return $inFac && $inSpec;
                    });
                })->pluck('id')->values()->all();

                $spec->group_doctors_count = $groupDocCount;
                $spec->facility_ids = $matchingFacilityIds;
                return $spec;
            });

        return [
            'group' => $primaryGroup,
            'groups' => $groups,
            'metrics' => [
                'facilitiesCount' => $facilitiesCount,
                'hospitalsCount' => $hospitalsCount,
                'clinicsCount' => $clinicsCount,
                'doctorsCount' => $doctorsCount,
                'specialtiesCount' => $specialties->count(),
                'todayAppointments' => $todayAppointments,
                'totalRevenue' => number_format($totalRevenue, 0) . ' ر.س',
            ],
            'facilities' => $facilities,
            'doctors' => $doctors,
            'specialties' => $specialties,
            'staffAssignments' => $staffAssignments,
        ];
    }

    public function index(Request $request): Response
    {
        $data = $this->getGroupBaseData($request);
        return Inertia::render('group/dashboard', $data);
    }

    public function facilities(Request $request): Response
    {
        $data = $this->getGroupBaseData($request);
        return Inertia::render('group/facilities', $data);
    }

    public function doctors(Request $request): Response
    {
        $data = $this->getGroupBaseData($request);
        return Inertia::render('group/doctors', $data);
    }

    public function specialties(Request $request): Response
    {
        $data = $this->getGroupBaseData($request);
        return Inertia::render('group/specialties', $data);
    }

    public function staff(Request $request): Response
    {
        $data = $this->getGroupBaseData($request);
        return Inertia::render('group/staff', $data);
    }

    public function storeDoctor(Request $request, Group $group): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();
        if (!$resolver->canManageGroup($user, $group->id)) {
            abort(403, 'غير مصرح لك بإضافة طبيب لهذا المجمع.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'facility_id' => 'required|exists:facilities,id',
            'specialty_id' => 'required|exists:specialties,id',
            'title_ar' => 'required|string|max:255',
            'subspecialty' => 'nullable|string|max:255',
            'consultation_fee' => 'required|numeric|min:0',
            'waiting_time_minutes' => 'nullable|integer|min:5|max:120',
            'experience_years' => 'nullable|integer|min:0|max:50',
            'accepts_insurance' => 'nullable|boolean',
        ]);

        $facility = Facility::where('id', $validated['facility_id'])->where('group_id', $group->id)->firstOrFail();

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
            'accepts_insurance' => $validated['accepts_insurance'] ?? true,
            'accepted_insurances' => ['بوبا العربية', 'التعاونية', 'ميدغلف', 'تكافل الراجحي'],
            'is_available_today' => true,
        ]);

        DoctorFacility::firstOrCreate([
            'doctor_profile_id' => $doctorProfile->id,
            'facility_id' => $facility->id,
        ], [
            'consultation_fee' => $validated['consultation_fee'],
            'default_slot_minutes' => $validated['waiting_time_minutes'] ?? 15,
            'accepts_insurance' => $validated['accepts_insurance'] ?? true,
            'is_active' => true,
        ]);

        return back()->with('success', "تم تسجيل الطبيب {$validated['name']} واعتماده في {$facility->name} بنجاح.");
    }

    public function storeFacility(Request $request, Group $group): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();
        if (!$resolver->canManageGroup($user, $group->id)) {
            abort(403, 'غير مصرح لك بإضافة منشأة لهذا المجمع.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'branch_name' => 'nullable|string|max:255',
            'type' => 'required|in:hospital,clinic',
            'moh_license_no' => 'nullable|string|max:50',
            'city' => 'required|string|max:100',
            'district' => 'required|string|max:100',
            'address' => 'required|string|max:255',
            'phone' => 'nullable|string|max:30',
            'specialty_ids' => 'nullable|array',
            'sectors' => 'nullable|array',
        ]);

        $settings = [];
        if (!empty($validated['specialty_ids'])) {
            $settings['specialty_ids'] = array_values(array_unique(array_map('intval', $validated['specialty_ids'])));
        }
        if (!empty($validated['sectors'])) {
            $settings['sectors'] = array_values(array_filter(array_map('trim', $validated['sectors'])));
        }

        Facility::create([
            'group_id' => $group->id,
            'name' => $validated['name'],
            'branch_name' => $validated['branch_name'] ?? 'الفرع الرئيسي',
            'type' => $validated['type'],
            'moh_license_no' => $validated['moh_license_no'] ?? null,
            'city' => $validated['city'],
            'district' => $validated['district'],
            'address' => $validated['address'],
            'phone' => $validated['phone'] ?? '+966110000000',
            'is_active' => true,
            'is_verified' => false,
            'settings' => !empty($settings) ? $settings : null,
        ]);

        return back()->with('success', 'تم إضافة المنشأة الطبية الجديدة التابعة للمجمع بنجاح.');
    }

    public function storeSpecialty(Request $request, Group $group): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();
        if (!$resolver->canManageGroup($user, $group->id)) {
            abort(403, 'غير مصرح لك بإضافة تخصصات لهذا المجمع.');
        }

        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'badge_text' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:500',
            'facility_ids' => 'nullable|array',
        ]);

        $specialty = Specialty::create([
            'name_ar' => $validated['name_ar'],
            'name_en' => $validated['name_en'] ?? '',
            'icon_slug' => 'stethoscope',
            'badge_text' => $validated['badge_text'] ?? 'قسم معتمد',
            'description' => $validated['description'] ?? 'قسم طبي تخصصي معتمد بالمجمع الطبي.',
        ]);

        $targetFacilityIds = !empty($validated['facility_ids'])
            ? array_map('intval', $validated['facility_ids'])
            : Facility::where('group_id', $group->id)->pluck('id')->all();

        $facilities = Facility::where('group_id', $group->id)
            ->whereIn('id', $targetFacilityIds)
            ->get();

        foreach ($facilities as $fac) {
            $settings = is_array($fac->settings) ? $fac->settings : [];
            $ids = $settings['specialty_ids'] ?? [];
            $ids[] = $specialty->id;
            $settings['specialty_ids'] = array_values(array_unique(array_map('intval', $ids)));
            $fac->update(['settings' => $settings]);
        }

        return back()->with('success', "تم إضافة القسم/التخصص الطبي ({$specialty->name_ar}) وربطه بمنشآت المجمع بنجاح.");
    }

    public function updateSpecialty(Request $request, Group $group, Specialty $specialty): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();
        if (!$resolver->canManageGroup($user, $group->id)) {
            abort(403, 'غير مصرح لك بتعديل التخصصات.');
        }

        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'badge_text' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:500',
            'facility_ids' => 'nullable|array',
        ]);

        $specialty->update([
            'name_ar' => $validated['name_ar'],
            'name_en' => $validated['name_en'] ?? $specialty->name_en,
            'badge_text' => $validated['badge_text'] ?? $specialty->badge_text,
            'description' => $validated['description'] ?? $specialty->description,
        ]);

        if ($request->has('facility_ids') && is_array($validated['facility_ids'])) {
            $selectedIds = array_map('intval', $validated['facility_ids']);
            $groupFacilities = Facility::where('group_id', $group->id)->get();

            foreach ($groupFacilities as $fac) {
                $settings = is_array($fac->settings) ? $fac->settings : [];
                $ids = $settings['specialty_ids'] ?? [];
                if (in_array($fac->id, $selectedIds)) {
                    $ids[] = $specialty->id;
                } else {
                    $ids = array_filter($ids, fn ($id) => (int) $id !== (int) $specialty->id);
                }
                $settings['specialty_ids'] = array_values(array_unique(array_map('intval', $ids)));
                $fac->update(['settings' => $settings]);
            }
        }

        return back()->with('success', "تم تحديث بيانات التخصص ({$specialty->name_ar}) بنجاح.");
    }

    public function syncFacilitySpecialties(Request $request, Group $group, Facility $facility): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();
        if (!$resolver->canManageGroup($user, $group->id) || (int) $facility->group_id !== (int) $group->id) {
            abort(403, 'غير مصرح لك بتعديل أقسام هذه المنشأة.');
        }

        $settings = is_array($facility->settings) ? $facility->settings : [];
        if ($request->has('specialty_ids') && is_array($request->input('specialty_ids'))) {
            $settings['specialty_ids'] = array_values(array_unique(array_map('intval', $request->input('specialty_ids'))));
        }
        if ($request->has('sectors') && is_array($request->input('sectors'))) {
            $settings['sectors'] = array_values(array_filter(array_map('trim', $request->input('sectors'))));
        }

        $facility->update(['settings' => $settings]);

        return back()->with('success', "تم تحديث التخصصات والقطاعات الطبية لمنشأة ({$facility->name}) بنجاح.");
    }

    public function storeFacilityStaff(Request $request, Group $group): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();
        if (!$resolver->canManageGroup($user, $group->id)) {
            abort(403, 'غير مصرح لك بتعيين موظفين لهذا المجمع.');
        }

        $validated = $request->validate([
            'facility_id' => 'required|exists:facilities,id',
            'role' => 'required|in:facility_admin,receptionist',
            'user_mode' => 'required|in:existing,new',
            'user_id' => 'nullable|required_if:user_mode,existing|exists:users,id',
            'new_name' => 'nullable|required_if:user_mode,new|string|max:255',
            'new_email' => 'nullable|required_if:user_mode,new|email|max:255|unique:users,email',
            'new_password' => 'nullable|required_if:user_mode,new|string|min:6',
            'new_phone' => 'nullable|string|max:30',
        ]);

        // Ensure facility belongs to this group
        $facility = Facility::where('id', $validated['facility_id'])->where('group_id', $group->id)->firstOrFail();

        $userId = $validated['user_id'];
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
            'scope_type' => 'facility',
            'scope_id' => $facility->id,
        ]);

        return back()->with('success', 'تم تعيين المشرف/موظف الاستقبال في المنشأة بنجاح.');
    }
}

