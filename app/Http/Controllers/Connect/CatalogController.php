<?php

namespace App\Http\Controllers\Connect;

use App\Http\Controllers\Controller;
use App\Models\ConnectCredential;
use App\Models\DoctorFacility;
use App\Models\DoctorProfile;
use App\Models\DoctorService;
use App\Models\Facility;
use App\Models\Specialty;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    /**
     * Resolve the target facility and ensure credential is authorized to access it (anti-enumeration).
     */
    protected function resolveAuthorizedFacility(ConnectCredential $credential, int|string $facilityId): Facility
    {
        $facility = Facility::where('id', $facilityId)
            ->where('is_active', true)
            ->first();

        if (! $facility) {
            throw new ModelNotFoundException("Facility [{$facilityId}] not found.");
        }

        // Anti-enumeration: Ensure facility belongs to credential's owner group or facility
        if ($credential->owner_type === 'App\Models\Group' && (int) $facility->group_id !== (int) $credential->owner_id) {
            throw new ModelNotFoundException('Resource not found or outside permitted scope.');
        }

        if ($credential->owner_type === 'App\Models\Facility' && (int) $facility->id !== (int) $credential->owner_id) {
            throw new ModelNotFoundException('Resource not found or outside permitted scope.');
        }

        if (! $credential->canAccessFacility($facility->id)) {
            throw new ModelNotFoundException('Resource not found or outside permitted scope.');
        }

        return $facility;
    }

    /**
     * GET /connect/v1/branches (and alias /connect/v1/facilities)
     */
    public function branches(Request $request): JsonResponse
    {
        /** @var ConnectCredential $credential */
        $credential = $request->attributes->get('connect_credential');

        $query = Facility::where('is_active', true);

        if ($credential->owner_type === 'App\Models\Group') {
            $query->where('group_id', $credential->owner_id);
        } elseif ($credential->owner_type === 'App\Models\Facility') {
            $query->where('id', $credential->owner_id);
        }

        $scopes = $credential->scopes ?? [];
        if (! isset($scopes['*'])) {
            $allowedFacilityIds = array_keys($scopes);
            $query->whereIn('id', $allowedFacilityIds);
        }

        $branches = $query->orderBy('name')->get()->map(function (Facility $facility) {
            return [
                'id' => $facility->id,
                'name_ar' => $facility->name,
                'city' => $facility->city ?? '',
                'district' => $facility->district ?? '',
                'phone' => $facility->phone ?? '',
                'is_active' => (bool) $facility->is_active,
            ];
        });

        return response()->json(['data' => $branches]);
    }

    /**
     * GET /connect/v1/specialties?facility_id=10
     */
    public function specialties(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'facility_id' => 'required|integer',
        ]);

        /** @var ConnectCredential $credential */
        $credential = $request->attributes->get('connect_credential');
        $facility = $this->resolveAuthorizedFacility($credential, $validated['facility_id']);

        $specialties = Specialty::whereHas('doctorProfiles', function ($q) use ($facility) {
                $q->where('approval_status', 'approved')
                    ->where('is_available_today', true)
                    ->whereHas('doctorFacilities', function ($df) use ($facility) {
                        $df->where('facility_id', $facility->id)->where('is_active', true);
                    });
            })
            ->orderBy('name_ar')
            ->get(['id', 'name_ar']);

        return response()->json([
            'data' => $specialties->map(fn($s) => [
                'id' => $s->id,
                'name_ar' => $s->name_ar,
            ]),
        ]);
    }

    /**
     * GET /connect/v1/doctors?facility_id=10&specialty_id=4
     */
    public function doctors(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'facility_id' => 'required|integer',
            'specialty_id' => 'nullable|integer|exists:specialties,id',
        ]);

        /** @var ConnectCredential $credential */
        $credential = $request->attributes->get('connect_credential');
        $facility = $this->resolveAuthorizedFacility($credential, $validated['facility_id']);

        $query = DoctorProfile::with(['user:id,name,avatar', 'specialty:id,name_ar'])
            ->where('approval_status', 'approved')
            ->where('is_available_today', true)
            ->whereHas('doctorFacilities', function ($q) use ($facility) {
                $q->where('facility_id', $facility->id)->where('is_active', true);
            });

        if (! empty($validated['specialty_id'])) {
            $query->where('specialty_id', $validated['specialty_id']);
        }

        $doctors = $query->get()->map(function (DoctorProfile $doc) {
            return [
                'id' => $doc->id,
                'name_ar' => $doc->user?->name ?? 'طبيب معتمد',
                'title' => $doc->title_ar ?? 'طبيب عام',
                'specialty_id' => $doc->specialty_id,
                'specialty_name' => $doc->specialty?->name_ar ?? '',
                'photo_url' => $doc->user?->avatar ? url($doc->user->avatar) : null,
            ];
        });

        return response()->json(['data' => $doctors]);
    }

    /**
     * GET /connect/v1/doctors/{doctor_id}?facility_id=10
     */
    public function show(Request $request, int|string $doctorId): JsonResponse
    {
        $validated = $request->validate([
            'facility_id' => 'required|integer',
        ]);

        /** @var ConnectCredential $credential */
        $credential = $request->attributes->get('connect_credential');
        $facility = $this->resolveAuthorizedFacility($credential, $validated['facility_id']);

        $doctor = DoctorProfile::with(['user:id,name,avatar', 'specialty:id,name_ar'])
            ->where('id', $doctorId)
            ->where('approval_status', 'approved')
            ->where('is_available_today', true)
            ->whereHas('doctorFacilities', function ($q) use ($facility) {
                $q->where('facility_id', $facility->id)->where('is_active', true);
            })
            ->first();

        if (! $doctor) {
            throw new ModelNotFoundException("Doctor [{$doctorId}] is not practicing at facility [{$facility->id}].");
        }

        return response()->json([
            'data' => [
                'id' => $doctor->id,
                'name_ar' => $doctor->user?->name ?? 'طبيب معتمد',
                'title' => $doctor->title_ar ?? 'طبيب عام',
                'subspecialty' => $doctor->subspecialty ?? '',
                'bio' => $doctor->bio ?? '',
                'experience_years' => (int) ($doctor->experience_years ?? 0),
                'specialty_id' => $doctor->specialty_id,
                'specialty_name' => $doctor->specialty?->name_ar ?? '',
                'waiting_time_minutes' => (int) ($doctor->waiting_time_minutes ?? 15),
                'photo_url' => $doctor->user?->avatar ? url($doctor->user->avatar) : null,
            ],
        ]);
    }

    /**
     * GET /connect/v1/doctors/{doctor_id}/services?facility_id=10
     */
    public function doctorServices(Request $request, int|string $doctorId): JsonResponse
    {
        $validated = $request->validate([
            'facility_id' => 'required|integer',
        ]);

        /** @var ConnectCredential $credential */
        $credential = $request->attributes->get('connect_credential');
        $facility = $this->resolveAuthorizedFacility($credential, $validated['facility_id']);

        $doctor = DoctorProfile::where('id', $doctorId)
            ->where('approval_status', 'approved')
            ->where('is_available_today', true)
            ->whereHas('doctorFacilities', function ($q) use ($facility) {
                $q->where('facility_id', $facility->id)->where('is_active', true);
            })
            ->first();

        if (! $doctor) {
            throw new ModelNotFoundException("Doctor [{$doctorId}] is not practicing at facility [{$facility->id}].");
        }

        $services = DoctorService::where('doctor_profile_id', $doctor->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $data = $services->map(function (DoctorService $service) {
            $price = (float) $service->price;
            $vatAmount = round($price * 0.15, 2);
            $totalFee = round($price + $vatAmount, 2);

            return [
                'id' => $service->id,
                'name_ar' => $service->name,
                'base_fee' => round($price, 2),
                'vat_rate' => 0.15,
                'vat_amount' => $vatAmount,
                'total_fee' => $totalFee,
            ];
        });

        return response()->json(['data' => $data]);
    }
}
