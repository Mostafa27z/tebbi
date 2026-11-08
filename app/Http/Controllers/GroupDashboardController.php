<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\Group;
use App\Models\RoleAssignment;
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
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->isGroupAdmin()) {
            abort(403, 'غير مصرح لك بالوصول إلى لوحة إدارة المجمع الطبي.');
        }

        $resolver = new ScopeResolver();
        $groupIds = $resolver->accessibleGroupIds($user);
        $groups = Group::whereIn('id', $groupIds)->with(['facilities.admins'])->get();

        $primaryGroup = $groups->first();
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

        return Inertia::render('group/dashboard', [
            'group' => $primaryGroup,
            'groups' => $groups,
            'metrics' => [
                'facilitiesCount' => $facilitiesCount,
                'hospitalsCount' => $hospitalsCount,
                'clinicsCount' => $clinicsCount,
                'doctorsCount' => $doctorsCount,
                'todayAppointments' => $todayAppointments,
                'totalRevenue' => number_format($totalRevenue, 0) . ' ر.س',
            ],
            'facilities' => $facilities,
            'doctors' => $doctors,
            'staffAssignments' => $staffAssignments,
        ]);
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
        ]);

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
        ]);

        return back()->with('success', 'تم إضافة المنشأة الطبية الجديدة التابعة للمجمع بنجاح.');
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

