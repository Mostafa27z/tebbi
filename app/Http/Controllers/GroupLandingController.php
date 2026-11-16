<?php

namespace App\Http\Controllers;

use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\Group;
use App\Models\Specialty;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GroupLandingController extends Controller
{
    /**
     * Display the public dedicated profile & promotional landing page for a Medical Group.
     * Accessible publicly for patients, visitors, and promotional marketing links.
     */
    public function show(Request $request, string $slug): Response
    {
        $group = Group::where('slug', $slug)
            ->withCount('facilities')
            ->firstOrFail();

        $rawFacilities = Facility::where('group_id', $group->id)
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', '!=', 'suspended');
            })
            ->get();

        $facilityIds = $rawFacilities->pluck('id');

        // Eager load all doctors belonging to this medical group (via primary clinic_id or doctor_facility pivot)
        $doctors = DoctorProfile::where(function ($q) use ($facilityIds) {
            $q->whereIn('clinic_id', $facilityIds)
                ->orWhereHas('doctorFacilities', fn ($df) => $df->whereIn('facility_id', $facilityIds));
        })
            ->whereIn('approval_status', ['approved', 'active', 'pending'])
            ->with([
                'user:id,name,email,phone,avatar',
                'specialty:id,name_ar,name_en,icon_slug,badge_text,description',
                'clinic:id,name,branch_name,type,city,district,address,phone',
                'facilities' => function ($q) use ($facilityIds) {
                    $q->whereIn('facilities.id', $facilityIds);
                },
            ])
            ->orderByDesc('rating')
            ->get();

        // Deduplicated catalog of canonical specialties (first 8 unique by name_ar)
        $allCanonicalSpecialties = Specialty::orderBy('id')
            ->get()
            ->unique('name_ar')
            ->values();

        // Build enriched facilities with their own doctors, specialties, and medical sectors/tasks
        $facilities = $rawFacilities->map(function (Facility $fac) use ($doctors, $allCanonicalSpecialties) {
            $facDoctors = $doctors->filter(function ($doc) use ($fac) {
                if ((int) $doc->clinic_id === (int) $fac->id) {
                    return true;
                }
                return $doc->facilities && $doc->facilities->contains('id', $fac->id);
            })->values();

            $settings = is_array($fac->settings) ? $fac->settings : [];
            $configuredSpecialtyIds = $settings['specialty_ids'] ?? [];

            $docSpecialtyIds = $facDoctors->pluck('specialty_id')->filter()->unique()->values()->all();
            $mergedSpecialtyIds = array_values(array_unique(array_merge($docSpecialtyIds, $configuredSpecialtyIds)));

            $facSpecialties = $allCanonicalSpecialties
                ->filter(fn ($s) => in_array($s->id, $mergedSpecialtyIds))
                ->values();

            if ($facSpecialties->isEmpty()) {
                $facSpecialties = $allCanonicalSpecialties->take(4)->values();
            }

            $defaultSectors = $fac->type === 'hospital'
                ? [
                    'قسم الطوارئ والرعاية الحرجة 24/7',
                    'العيادات الخارجية والاستشارية',
                    'المختبر المركزي والتحاليل الطبية',
                    'قسم الأشعة التشخيصية والرنين',
                    'وحدة جراحة اليوم الواحد والمناظير',
                    'مكتب موافقات التأمين الطبي الفوري',
                ]
                : [
                    'العيادات التخصصية والاستشارية',
                    'مختبر التحاليل والفحوصات الدورية',
                    'وحدة الليزر والإجراءات النهارية',
                    'مكتب التأمين الطبي والاستقبال الذكي',
                ];

            $sectors = !empty($settings['sectors']) && is_array($settings['sectors'])
                ? $settings['sectors']
                : $defaultSectors;

            return [
                'id' => $fac->id,
                'name' => $fac->name,
                'branch_name' => $fac->branch_name,
                'type' => $fac->type,
                'city' => $fac->city,
                'district' => $fac->district,
                'address' => $fac->address,
                'phone' => $fac->phone,
                'map_url' => $fac->map_url,
                'moh_license_no' => $fac->moh_license_no,
                'is_verified' => (bool) $fac->is_verified,
                'doctor_profiles_count' => $facDoctors->count(),
                'specialties' => $facSpecialties->map(fn ($s) => [
                    'id' => $s->id,
                    'name_ar' => $s->name_ar,
                    'icon_slug' => $s->icon_slug,
                    'badge_text' => $s->badge_text,
                ])->values(),
                'sectors' => $sectors,
                'doctors_preview' => $facDoctors->take(4)->map(fn ($d) => [
                    'id' => $d->id,
                    'name' => $d->user?->name ?? 'طبيب',
                    'avatar' => $d->user?->avatar,
                    'specialty' => $d->specialty?->name_ar ?? '',
                ])->values(),
            ];
        })->values();

        // Build group-wide specialties list (combining active doctor specialties + facility specialties)
        $groupSpecialtyIds = $doctors->pluck('specialty_id')
            ->merge($facilities->pluck('specialties')->flatten(1)->pluck('id'))
            ->filter()
            ->unique()
            ->values();

        $groupSpecialties = Specialty::whereIn('id', $groupSpecialtyIds)
            ->get()
            ->unique('name_ar')
            ->map(function ($spec) use ($doctors, $facilities) {
                $count = $doctors->filter(function ($d) use ($spec) {
                    return $d->specialty_id === $spec->id
                        || ($d->specialty && $d->specialty->name_ar === $spec->name_ar);
                })->count();

                $facCount = $facilities->filter(function ($f) use ($spec) {
                    return collect($f['specialties'])->contains('name_ar', $spec->name_ar);
                })->count();

                return [
                    'id' => $spec->id,
                    'name_ar' => $spec->name_ar,
                    'name_en' => $spec->name_en,
                    'icon' => $spec->icon_slug,
                    'icon_slug' => $spec->icon_slug,
                    'badge_text' => $spec->badge_text,
                    'description' => $spec->description,
                    'doctors_count' => $count,
                    'facilities_count' => max(1, $facCount),
                ];
            })
            ->sortByDesc('doctors_count')
            ->values();

        $stats = [
            'totalDoctors' => $doctors->count(),
            'availableTodayDoctors' => $doctors->where('is_available_today', true)->count(),
            'totalFacilities' => $facilities->count(),
            'totalHospitals' => $facilities->where('type', 'hospital')->count(),
            'totalClinics' => $facilities->where('type', 'clinic')->count(),
            'specialtiesCount' => $groupSpecialties->count(),
            'avgRating' => $doctors->count() > 0 ? round($doctors->avg('rating'), 1) : 4.9,
            'cities' => $facilities->pluck('city')->filter()->unique()->values(),
        ];

        return Inertia::render('group/public-landing', [
            'group' => [
                'id' => $group->id,
                'name_ar' => $group->name_ar,
                'name_en' => $group->name_en,
                'slug' => $group->slug,
                'logo_url' => $group->logo_url ?: '/images/clinics/habeeb.png',
                'cr_number' => $group->cr_number,
                'status' => $group->status,
                'public_url' => url("/group/{$group->slug}"),
            ],
            'facilities' => $facilities,
            'doctors' => $doctors,
            'specialties' => $groupSpecialties,
            'stats' => $stats,
        ]);
    }
}
