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

        return array_merge(parent::share($request), [
            'name' => config('app.name', 'طبيبي'),
            'auth' => [
                'user' => $user,
                'activeTicket' => $activeTicket,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }
}
