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

        $adminCounts = null;
        if ($user && $user->role === 'admin') {
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
        if ($user && ($user->isFacilityAdmin() || $user->isReceptionist())) {
            $resolver = new \App\Services\ScopeResolver();
            $facIds = $resolver->accessibleFacilityIds($user);
            $primaryFacId = $facIds[0] ?? 1;
            $today = \Carbon\Carbon::today();
            $facilityCounts = [
                'waiting' => \App\Models\Appointment::where('facility_id', $primaryFacId)->whereDate('appointment_date', $today)->where('status', 'waiting')->count(),
                'doctors' => \App\Models\DoctorProfile::where('clinic_id', $primaryFacId)->orWhereHas('doctorFacilities', fn($q) => $q->where('facility_id', $primaryFacId)->where('is_active', true))->count(),
                'specialties' => \App\Models\Specialty::count(),
                'appointments' => \App\Models\Appointment::where('facility_id', $primaryFacId)->whereDate('appointment_date', $today)->count(),
            ];
        }

        return array_merge(parent::share($request), [
            'name' => config('app.name', 'طبيبي'),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'is_group_admin' => $user->isGroupAdmin(),
                    'is_facility_admin' => $user->isFacilityAdmin(),
                    'is_receptionist' => $user->isReceptionist(),
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
