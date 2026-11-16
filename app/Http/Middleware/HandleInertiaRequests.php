<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $activeTicket = null;

        if ($user) {
            if ($user->role === 'doctor') {
                $user->loadMissing(['doctorProfile.specialty', 'doctorProfile.clinic']);
            } elseif ($user->role === 'patient') {
                $activeAppointment = \App\Models\Appointment::with('queueTicket')
                    ->where('patient_id', $user->id)
                    ->whereIn('status', ['waiting', 'in_consultation'])
                    ->latest('id')
                    ->first();

                if ($activeAppointment) {
                    $activeTicket = [
                        'booking_reference' => $activeAppointment->booking_reference,
                        'ticket_number' => $activeAppointment->queueTicket?->ticket_number ?? 1,
                        'status' => $activeAppointment->status,
                    ];
                }
            }
        }

        $isGroupAdmin = $user ? $user->isGroupAdmin() : false;
        $isFacilityAdmin = $user ? $user->isFacilityAdmin() : false;
        $isReceptionist = $user ? $user->isReceptionist() : false;

        $adminCounts = null;
        if ($user && $user->role === 'admin' && $request->is('admin*')) {
            $adminCounts = [
                'groups' => \App\Models\Group::count(),
                'clinics' => \App\Models\Facility::count(),
                'admins' => \App\Models\RoleAssignment::count(),
                'doctors' => \App\Models\DoctorProfile::count(),
                'specialties' => \App\Models\Specialty::count(),
                'appointments' => \App\Models\Appointment::count(),
            ];
        }

        $facilityCounts = null;
        if ($user && ($isFacilityAdmin || $isReceptionist) && $request->is('facility*')) {
            $facIds = $user->accessibleFacilityIds();
            $primaryFacId = $facIds[0] ?? 1;
            $today = \Carbon\Carbon::today();
            $facilityCounts = [
                'waiting' => \App\Models\Appointment::where('facility_id', $primaryFacId)->whereDate('appointment_date', $today)->where('status', 'waiting')->count(),
                'doctors' => \App\Models\DoctorProfile::where(function ($q) use ($primaryFacId) {
                    $q->where('clinic_id', $primaryFacId)
                      ->orWhereHas('doctorFacilities', fn($df) => $df->where('facility_id', $primaryFacId)->where('is_active', true));
                })->count(),
                'specialties' => \App\Models\Specialty::count(),
                'appointments' => \App\Models\Appointment::where('facility_id', $primaryFacId)->whereDate('appointment_date', $today)->count(),
                'receptionists' => \App\Models\RoleAssignment::where('scope_type', 'facility')->where('scope_id', $primaryFacId)->where('role', 'receptionist')->count(),
            ];
        }

        return array_merge(parent::share($request), [
            'name' => config('app.name', 'طبيبي'),
            'auth' => [
                'user' => $user ? array_merge($user->withoutRelations()->toArray(), [
                    'doctor_profile' => $user->relationLoaded('doctorProfile') ? $user->doctorProfile : null,
                    'is_group_admin' => $isGroupAdmin,
                    'is_facility_admin' => $isFacilityAdmin,
                    'is_receptionist' => $isReceptionist,
                ]) : null,
                'activeTicket' => $activeTicket,
            ],
            'adminCounts' => $adminCounts,
            'facilityCounts' => $facilityCounts,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'info' => $request->session()->get('info'),
                'warning' => $request->session()->get('warning'),
            ],
        ]);
    }
}
