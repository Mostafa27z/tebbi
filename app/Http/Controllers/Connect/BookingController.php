<?php

namespace App\Http\Controllers\Connect;

use App\Http\Controllers\Controller;
use App\Models\ConnectBookingIntent;
use App\Models\ConnectCredential;
use App\Models\DoctorProfile;
use App\Models\DoctorSchedule;
use App\Models\DoctorService;
use App\Models\Facility;
use App\Services\Connect\AvailabilityEngine;
use App\Services\Connect\BookingAdapter;
use App\Services\Connect\IdempotencyService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class BookingController extends Controller
{
    protected AvailabilityEngine $availabilityEngine;
    protected BookingAdapter $bookingAdapter;
    protected IdempotencyService $idempotencyService;

    public function __construct(
        AvailabilityEngine $availabilityEngine,
        BookingAdapter $bookingAdapter,
        IdempotencyService $idempotencyService
    ) {
        $this->availabilityEngine = $availabilityEngine;
        $this->bookingAdapter = $bookingAdapter;
        $this->idempotencyService = $idempotencyService;
    }

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
     * GET /connect/v1/doctors/{doctor_id}/availability?facility_id=10&date=2026-11-25
     */
    public function availability(Request $request, int|string $doctorId): JsonResponse
    {
        /** @var ConnectCredential $credential */
        $credential = $request->attributes->get('connect_credential');

        $validated = $request->validate([
            'facility_id' => 'required|integer',
            'date' => 'required|date_format:Y-m-d',
            'service_id' => 'nullable|integer',
        ]);

        $facility = $this->resolveAuthorizedFacility($credential, $validated['facility_id']);

        $doctor = DoctorProfile::where('id', $doctorId)
            ->where('approval_status', 'approved')
            ->where('is_available_today', true)
            ->whereHas('doctorFacilities', function ($q) use ($facility) {
                $q->where('facility_id', $facility->id)->where('is_active', true);
            })
            ->first();

        if (! $doctor) {
            throw new ModelNotFoundException("Doctor [{$doctorId}] not found or not active at this facility.");
        }

        $service = null;
        if (! empty($validated['service_id'])) {
            $service = DoctorService::where('id', $validated['service_id'])
                ->where('doctor_profile_id', $doctor->id)
                ->where('is_active', true)
                ->first();

            if (! $service) {
                return response()->json([
                    'type' => 'https://connect.tebiby.com/errors/err-service-mismatch',
                    'title' => 'Service Mismatch',
                    'status' => 422,
                    'detail' => 'Selected service does not belong to the doctor or is inactive.',
                    'code' => 'ERR_SERVICE_MISMATCH',
                ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']);
            }
        }

        $date = Carbon::parse($validated['date']);
        $result = $this->availabilityEngine->getAvailableSlots($doctor, $facility, $date, $service);

        return response()->json($result);
    }

    /**
     * POST /connect/v1/booking-intents
     */
    public function createIntent(Request $request): JsonResponse
    {
        /** @var ConnectCredential $credential */
        $credential = $request->attributes->get('connect_credential');

        $validated = $request->validate([
            'facility_id' => 'required|integer',
            'doctor_id' => 'required|integer',
            'doctor_service_id' => 'nullable|integer',
            'service_id' => 'nullable|integer',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|string',
            'expected_fee' => 'required|numeric|min:0',
        ]);

        $facility = $this->resolveAuthorizedFacility($credential, $validated['facility_id']);

        $doctor = DoctorProfile::where('id', $validated['doctor_id'])
            ->where('approval_status', 'approved')
            ->where('is_available_today', true)
            ->whereHas('doctorFacilities', function ($q) use ($facility) {
                $q->where('facility_id', $facility->id)->where('is_active', true);
            })
            ->first();

        if (! $doctor) {
            throw new ModelNotFoundException("Doctor [{$validated['doctor_id']}] not found or not active at this facility.");
        }

        $serviceId = $validated['service_id'] ?? $validated['doctor_service_id'] ?? null;
        if (! $serviceId) {
            return response()->json([
                'type' => 'https://connect.tebiby.com/errors/err-validation-failed',
                'title' => 'Validation Failed',
                'status' => 422,
                'detail' => 'The doctor_service_id or service_id field is required.',
                'code' => 'ERR_VALIDATION_FAILED',
            ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']);
        }

        $service = DoctorService::where('id', $serviceId)
            ->where('doctor_profile_id', $doctor->id)
            ->where('is_active', true)
            ->first();

        if (! $service) {
            return response()->json([
                'type' => 'https://connect.tebiby.com/errors/err-service-mismatch',
                'title' => 'Service Mismatch',
                'status' => 422,
                'detail' => 'Selected service does not belong to the doctor or is inactive.',
                'code' => 'ERR_SERVICE_MISMATCH',
            ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']);
        }

        $basePrice = (float) $service->price;
        $vatAmount = round($basePrice * 0.15, 2);
        $totalPrice = round($basePrice + $vatAmount, 2);

        $expectedFee = (float) $validated['expected_fee'];
        if (abs($expectedFee - $totalPrice) > 0.01) {
            return response()->json([
                'type' => 'https://connect.tebiby.com/errors/err-price-mismatch',
                'title' => 'Price Mismatch',
                'status' => 422,
                'detail' => "Expected fee [{$expectedFee}] does not match current total fee [{$totalPrice}].",
                'code' => 'ERR_PRICE_MISMATCH',
            ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']);
        }

        $date = $validated['appointment_date'];
        $time = substr($validated['appointment_time'], 0, 5);

        // Strict Riyadh timezone & schedule bounds check
        $nowRiyadh = Carbon::now('Asia/Riyadh');
        $slotDateTime = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$time}", 'Asia/Riyadh');

        if ($slotDateTime->isPast()) {
            return response()->json([
                'type' => 'https://connect.tebiby.com/errors/err-slot-outside-schedule',
                'title' => 'Slot In Past',
                'status' => 422,
                'detail' => 'Cannot create a booking intent for a slot in the past.',
                'code' => 'ERR_SLOT_OUTSIDE_SCHEDULE',
            ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']);
        }

        $dayOfWeek = $slotDateTime->dayOfWeek;
        $schedule = DoctorSchedule::where('doctor_profile_id', $doctor->id)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->first();

        if (! $schedule) {
            return response()->json([
                'type' => 'https://connect.tebiby.com/errors/err-slot-outside-schedule',
                'title' => 'Slot Outside Schedule',
                'status' => 422,
                'detail' => 'Doctor has no active schedule on selected day.',
                'code' => 'ERR_SLOT_OUTSIDE_SCHEDULE',
            ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']);
        }

        $intentToken = ConnectBookingIntent::generateToken($credential->environment);

        $intent = ConnectBookingIntent::create([
            'credential_id' => $credential->id,
            'intent_token' => $intentToken,
            'facility_id' => $facility->id,
            'doctor_id' => $doctor->id,
            'service_id' => $service->id,
            'appointment_date' => $date,
            'appointment_time' => $time,
            'base_fee' => $basePrice,
            'vat_amount' => $vatAmount,
            'expected_fee' => $totalPrice,
            'status' => 'pending',
            'expires_at' => now()->addMinutes(15),
        ]);

        return response()->json([
            'intent_token' => $intent->intent_token,
            'expires_at' => $intent->expires_at->toIso8601String(),
            'facility_id' => $facility->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $date,
            'appointment_time' => $time,
            'base_fee' => $basePrice,
            'vat_amount' => $vatAmount,
            'expected_fee' => $totalPrice,
        ], 201);
    }

    /**
     * POST /connect/v1/facilities/{facility_id}/appointments
     * and POST /connect/v1/appointments
     */
    public function createAppointment(Request $request): JsonResponse
    {
        if (app()->isProduction() && ! config('connect.gate_1b_enabled', false)) {
            return response()->json([
                'type' => 'https://connect.tebiby.com/errors/err-not-implemented',
                'title' => 'Not Implemented',
                'status' => 501,
                'detail' => 'Booking endpoint is pending Gate 1B activation in production.',
                'code' => 'ERR_NOT_IMPLEMENTED',
            ], 501, ['Content-Type' => 'application/problem+json; charset=utf-8']);
        }

        /** @var ConnectCredential $credential */
        $credential = $request->attributes->get('connect_credential');

        // Idempotency Check
        [$isReplay, $cachedResponse, $idempotencyRecord] = $this->idempotencyService->check($request, $credential);
        if ($isReplay) {
            return $cachedResponse;
        }

        try {
            $payload = $request->all();

            // Resolve intent if token provided or attached via Bearer bit_
            $intentToken = $payload['intent_token'] ?? null;
            /** @var ConnectBookingIntent|null $intent */
            $intent = $request->attributes->get('connect_booking_intent');

            if (! $intent && ! empty($intentToken)) {
                $intent = ConnectBookingIntent::where('credential_id', $credential->id)
                    ->where('intent_token', $intentToken)
                    ->first();
            }

            if ($intent) {
                if ($intent->isExpired() || $intent->isConsumed()) {
                    return response()->json([
                        'type' => 'https://connect.tebiby.com/errors/err-intent-expired-or-used',
                        'title' => 'Booking Intent Expired or Used',
                        'status' => 410,
                        'detail' => 'The provided booking intent token is either expired or already consumed.',
                        'code' => 'ERR_INTENT_EXPIRED_OR_USED',
                    ], 410, ['Content-Type' => 'application/problem+json; charset=utf-8']);
                }

                $payload['facility_id'] = $payload['facility_id'] ?? $intent->facility_id;
                $payload['doctor_id'] = $payload['doctor_id'] ?? $intent->doctor_id;
                $payload['service_id'] = $payload['service_id'] ?? $intent->service_id;
                $payload['appointment_date'] = $payload['appointment_date'] ?? $intent->appointment_date->toDateString();
                $payload['appointment_time'] = $payload['appointment_time'] ?? $intent->appointment_time;
                $payload['expected_fee'] = $payload['expected_fee'] ?? (float) $intent->expected_fee;
                $payload['intent_token'] = $intent->intent_token;
            }

            // Resolve target facility ID
            $targetFacilityId = $request->route('facility_id') ?? $payload['facility_id'] ?? null;
            if (empty($targetFacilityId)) {
                return response()->json([
                    'type' => 'https://connect.tebiby.com/errors/err-validation-failed',
                    'title' => 'Validation Failed',
                    'status' => 422,
                    'detail' => 'The facility_id is required.',
                    'code' => 'ERR_VALIDATION_FAILED',
                ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']);
            }

            $facility = $this->resolveAuthorizedFacility($credential, $targetFacilityId);

            // Validation rules
            $request->merge($payload);
            $validated = $request->validate([
                'patient_name' => 'required|string|max:100',
                'patient_phone' => 'required|string|max:30',
                'external_patient_id' => 'required|string|max:100',
                'external_appointment_id' => 'nullable|string|max:100',
                'doctor_id' => 'required|integer',
                'service_id' => 'nullable|integer',
                'doctor_service_id' => 'nullable|integer',
                'appointment_date' => 'required|date|after_or_equal:today',
                'appointment_time' => 'required|string',
                'expected_fee' => 'nullable|numeric|min:0',
                'payment_method' => 'nullable|string|in:cash,online,at_clinic',
                'intent_token' => 'nullable|string',
            ]);

            $result = $this->bookingAdapter->book($credential, $facility, $validated);

            $response = response()->json($result, 201);

            if ($idempotencyRecord) {
                $this->idempotencyService->recordCompleted($idempotencyRecord, 201, $result);
            }

            return $response;
        } catch (HttpResponseException $e) {
            throw $e;
        } catch (Throwable $e) {
            // Delete in-flight lock on unexpected crash to permit immediate client retry
            if ($idempotencyRecord) {
                $idempotencyRecord->delete();
            }
            throw $e;
        }
    }

    /**
     * POST /connect/v1/facilities/{facility_id}/appointments/{booking_reference}/cancel
     * and POST /connect/v1/appointments/{booking_reference}/cancel
     */
    public function cancelAppointment(Request $request): JsonResponse
    {
        /** @var ConnectCredential $credential */
        $credential = $request->attributes->get('connect_credential');

        // Idempotency Check
        [$isReplay, $cachedResponse, $idempotencyRecord] = $this->idempotencyService->check($request, $credential);
        if ($isReplay) {
            return $cachedResponse;
        }

        try {
            $bookingReference = $request->route('booking_reference') ?? $request->input('booking_reference');
            if (empty($bookingReference)) {
                return response()->json([
                    'type' => 'https://connect.tebiby.com/errors/err-validation-failed',
                    'title' => 'Validation Failed',
                    'status' => 422,
                    'detail' => 'The booking_reference is required.',
                    'code' => 'ERR_VALIDATION_FAILED',
                ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']);
            }

            // Resolve target facility
            $targetFacilityId = $request->route('facility_id') ?? $request->input('facility_id');
            if (empty($targetFacilityId)) {
                $appt = \App\Models\Appointment::where('booking_reference', $bookingReference)->first();
                if (! $appt) {
                    throw new ModelNotFoundException("Appointment [{$bookingReference}] not found.");
                }
                $targetFacilityId = $appt->facility_id;
            }

            $facility = $this->resolveAuthorizedFacility($credential, $targetFacilityId);

            $reason = $request->input('cancellation_reason');
            $result = $this->bookingAdapter->cancel($credential, $facility, $bookingReference, $reason);

            $response = response()->json($result, 200);

            if ($idempotencyRecord) {
                $this->idempotencyService->recordCompleted($idempotencyRecord, 200, $result);
            }

            return $response;
        } catch (HttpResponseException $e) {
            throw $e;
        } catch (Throwable $e) {
            if ($idempotencyRecord) {
                $idempotencyRecord->delete();
            }
            throw $e;
        }
    }

    /**
     * PATCH /connect/v1/facilities/{facility_id}/appointments/{booking_reference}/reschedule
     * and PATCH /connect/v1/appointments/{booking_reference}/reschedule
     */
    public function rescheduleAppointment(): JsonResponse
    {
        return response()->json([
            'type' => 'https://connect.tebiby.com/errors/err-not-implemented',
            'title' => 'Not Implemented',
            'status' => 501,
            'detail' => 'Appointment rescheduling is reserved for Phase 2.',
            'code' => 'ERR_NOT_IMPLEMENTED',
        ], 501, ['Content-Type' => 'application/problem+json; charset=utf-8']);
    }
}
