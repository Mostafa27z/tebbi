<?php

namespace App\Http\Controllers;

use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request): Response
    {
        $specialties = Specialty::withCount('doctorProfiles')->get();

        $clinics = Clinic::where('is_active', true)->get();

        $query = DoctorProfile::with(['user', 'specialty', 'clinic']);

        if ($request->filled('specialty_id')) {
            $query->where('specialty_id', $request->specialty_id);
        }

        if ($request->filled('city')) {
            $query->whereHas('clinic', function ($q) use ($request) {
                $q->where('city', $request->city);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%");
                })->orWhere('title_ar', 'like', "%{$search}%")
                  ->orWhere('subspecialty', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('insurance_only')) {
            $query->where('accepts_insurance', true);
        }

        $doctors = $query->orderByDesc('rating')->get();

        return Inertia::render('home', [
            'specialties' => $specialties,
            'clinics' => $clinics,
            'doctors' => $doctors,
            'filters' => [
                'specialty_id' => $request->specialty_id,
                'city' => $request->city,
                'search' => $request->search,
                'insurance_only' => $request->boolean('insurance_only'),
            ],
            'stats' => [
                'totalDoctors' => DoctorProfile::count(),
                'totalClinics' => Clinic::where('is_active', true)->count(),
                'satisfactionRate' => (DoctorProfile::count() > 0 && DoctorProfile::avg('rating') !== null)
                    ? number_format(DoctorProfile::avg('rating') * 20, 1) . '%'
                    : 'لا توجد تقييمات حتى الآن',
                'avgWaitMinutes' => (DoctorProfile::count() > 0 && DoctorProfile::avg('waiting_time_minutes') !== null)
                    ? (int) round(DoctorProfile::avg('waiting_time_minutes')) . ' دقيقة'
                    : 'لا توجد سجلات حتى الآن',
            ],
        ]);
    }
}

