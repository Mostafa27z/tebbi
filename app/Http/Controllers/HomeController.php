<?php

namespace App\Http\Controllers;

use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\Facility;
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
                    : '98.5%',
                'avgWaitMinutes' => (DoctorProfile::count() > 0 && DoctorProfile::avg('waiting_time_minutes') !== null)
                    ? (int) round(DoctorProfile::avg('waiting_time_minutes')) . ' دقيقة'
                    : '15 دقيقة',
            ],
        ]);
    }

    public function specialties(): Response
    {
        $specialties = Specialty::withCount('doctorProfiles')->get()->map(function ($spec) {
            $facilitiesCount = Facility::whereHas('doctorProfiles', function ($q) use ($spec) {
                $q->where('specialty_id', $spec->id);
            })->count();

            return [
                'id' => $spec->id,
                'name_ar' => $spec->name_ar,
                'name_en' => $spec->name_en,
                'icon_slug' => $spec->icon_slug,
                'badge_text' => $spec->badge_text,
                'description' => $spec->description,
                'doctors_count' => $spec->doctor_profiles_count,
                'facilities_count' => max(1, $facilitiesCount),
            ];
        });

        return Inertia::render('specialties', [
            'specialties' => $specialties,
            'totalDoctors' => DoctorProfile::count(),
            'totalFacilities' => Facility::where('is_active', true)->count(),
        ]);
    }

    public function doctors(Request $request): Response
    {
        $specialties = Specialty::all();
        $cities = Facility::where('is_active', true)->pluck('city')->unique()->values();

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

        return Inertia::render('doctors', [
            'doctors' => $doctors,
            'specialties' => $specialties,
            'cities' => $cities,
            'filters' => [
                'specialty_id' => $request->specialty_id,
                'city' => $request->city,
                'search' => $request->search,
                'insurance_only' => $request->boolean('insurance_only'),
            ],
            'totalDoctors' => DoctorProfile::count(),
        ]);
    }

    public function about(): Response
    {
        return Inertia::render('about', [
            'stats' => [
                'totalDoctors' => DoctorProfile::count(),
                'totalClinics' => Clinic::where('is_active', true)->count(),
                'totalFacilities' => Facility::where('is_active', true)->count(),
                'specialtiesCount' => Specialty::count(),
                'satisfactionRate' => '98.5%',
            ],
        ]);
    }
}
