<?php

namespace App\Services\Connect;

use App\Models\Appointment;
use App\Models\ConnectAppointmentLink;
use App\Models\ConnectBookingIntent;
use App\Models\ConnectCredential;
use App\Models\DoctorFacility;
use App\Models\DoctorProfile;
use App\Models\DoctorSchedule;
use App\Models\DoctorService;
use App\Models\Facility;
use App\Models\QueueTicket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class BookingAdapter
{
    protected AvailabilityEngine $availabilityEngine;

    public function __construct(AvailabilityEngine $availabilityEngine)
    {
        $this->availabilityEngine = $availabilityEngine;
    }

    private function timeToMinutes(string $time24): int
    {
        $parts = explode(':', $time24);
        $hours = (int) ($parts[0] ?? 0);
        $minutes = (int) ($parts[1] ?? 0);
        return ($hours * 60) + $minutes;
    }

    /**
     * Normalize phone to international format without spaces.
     */
    public function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/[^\d+]/', '', $phone);
        if (str_starts_with($phone, '05')) {
            $phone = '+966' . substr($phone, 1);
        } elseif (str_starts_with($phone, '5') && strlen($phone) === 9) {
            $phone = '+966' . $phone;
        } elseif (! str_starts_with($phone, '+')) {
            $phone = '+' . $phone;
        }
        return $phone;
    }

    /**
     * Execute atomic booking transaction.
     */
    public function book(ConnectCredential $credential, Facility $facility, array $payload): array
    {
        return DB::transaction(function () use ($credential, $facility, $payload) {
            $doctor = DoctorProfile::where('id', $payload['doctor_id'])
                ->where('approval_status', 'approved')
                ->where('is_available_today', true)
                ->whereHas('doctorFacilities', function ($q) use ($facility) {
                    $q->where('facility_id', $facility->id)->where('is_active', true);
                })
                ->first();

            if (! $doctor) {
                abort(response()->json([
                    'type' => 'https://connect.tebiby.com/errors/err-resource-not-found',
                    'title' => 'Resource Not Found',
                    'status' => 404,
                    'detail' => 'Doctor not found or not active at the specified facility.',
                    'code' => 'ERR_RESOURCE_NOT_FOUND',
                ], 404, ['Content-Type' => 'application/problem+json; charset=utf-8']));
            }

            $serviceId = $payload['service_id'] ?? $payload['doctor_service_id'] ?? null;
            if (! $serviceId) {
                $service = DoctorService::where('doctor_profile_id', $doctor->id)
                    ->where('is_active', true)
                    ->first();
            } else {
                $service = DoctorService::where('id', $serviceId)
                    ->where('doctor_profile_id', $doctor->id)
                    ->where('is_active', true)
                    ->first();
            }

            if (! $service) {
                abort(response()->json([
                    'type' => 'https://connect.tebiby.com/errors/err-service-mismatch',
                    'title' => 'Service Mismatch',
                    'status' => 422,
                    'detail' => 'Selected service does not belong to the doctor or is inactive.',
                    'code' => 'ERR_SERVICE_MISMATCH',
                ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']));
            }

            $basePrice = (float) $service->price;
            $vatAmount = round($basePrice * 0.15, 2);
            $totalPrice = round($basePrice + $vatAmount, 2);

            if (isset($payload['expected_fee'])) {
                $expected = (float) $payload['expected_fee'];
                if (abs($expected - $totalPrice) > 0.01) {
                    abort(response()->json([
                        'type' => 'https://connect.tebiby.com/errors/err-price-mismatch',
                        'title' => 'Price Mismatch',
                        'status' => 422,
                        'detail' => "Expected fee [{$expected}] does not match current total fee [{$totalPrice}].",
                        'code' => 'ERR_PRICE_MISMATCH',
                    ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']));
                }
            }

            $date = $payload['appointment_date'];
            $time = substr($payload['appointment_time'], 0, 5);
            $duration = (int) $service->duration_minutes;

            // Strict Riyadh timezone validation
            $nowRiyadh = Carbon::now('Asia/Riyadh');
            $slotDateTime = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$time}", 'Asia/Riyadh');

            if ($slotDateTime->isPast()) {
                abort(response()->json([
                    'type' => 'https://connect.tebiby.com/errors/err-slot-outside-schedule',
                    'title' => 'Slot In Past',
                    'status' => 422,
                    'detail' => 'Cannot book an appointment slot in the past.',
                    'code' => 'ERR_SLOT_OUTSIDE_SCHEDULE',
                ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']));
            }

            // Doctor schedule bounds check
            $dayOfWeek = $slotDateTime->dayOfWeek;
            $schedule = DoctorSchedule::where('doctor_profile_id', $doctor->id)
                ->where('day_of_week', $dayOfWeek)
                ->where('is_active', true)
                ->first();

            if (! $schedule) {
                abort(response()->json([
                    'type' => 'https://connect.tebiby.com/errors/err-slot-outside-schedule',
                    'title' => 'Slot Outside Schedule',
                    'status' => 422,
                    'detail' => 'Doctor has no active schedule on selected day.',
                    'code' => 'ERR_SLOT_OUTSIDE_SCHEDULE',
                ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']));
            }

            $slotStartMin = $this->timeToMinutes($time);
            $schedStartMin = $this->timeToMinutes(substr($schedule->start_time, 0, 5));
            $schedEndMin = $this->timeToMinutes(substr($schedule->end_time, 0, 5));

            if ($slotStartMin < $schedStartMin || ($slotStartMin + $duration) > $schedEndMin) {
                abort(response()->json([
                    'type' => 'https://connect.tebiby.com/errors/err-slot-outside-schedule',
                    'title' => 'Slot Outside Schedule',
                    'status' => 422,
                    'detail' => 'Requested slot falls outside doctor working hours.',
                    'code' => 'ERR_SLOT_OUTSIDE_SCHEDULE',
                ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']));
            }

            // Verify booking intent if token provided
            $intent = null;
            if (! empty($payload['intent_token'])) {
                $intent = ConnectBookingIntent::where('credential_id', $credential->id)
                    ->where('intent_token', $payload['intent_token'])
                    ->first();

                if (! $intent || $intent->isExpired() || $intent->isConsumed()) {
                    abort(response()->json([
                        'type' => 'https://connect.tebiby.com/errors/err-intent-expired-or-used',
                        'title' => 'Booking Intent Expired or Used',
                        'status' => 410,
                        'detail' => 'The provided booking intent token is either expired or already consumed.',
                        'code' => 'ERR_INTENT_EXPIRED_OR_USED',
                    ], 410, ['Content-Type' => 'application/problem+json; charset=utf-8']));
                }
            }

            // Patient details & phone limits
            $patientName = trim($payload['patient_name']);
            $normalizedPhone = $this->normalizePhone($payload['patient_phone']);
            $nationalId = !empty($payload['patient_national_id'])
                ? trim((string) $payload['patient_national_id'])
                : (!empty($payload['national_id']) ? trim((string) $payload['national_id']) : null);
            $patientEmail = !empty($payload['patient_email'])
                ? trim($payload['patient_email'])
                : (!empty($payload['email']) ? trim($payload['email']) : null);
            $externalPatientId = isset($payload['external_patient_id']) && trim((string) $payload['external_patient_id']) !== ''
                ? trim((string) $payload['external_patient_id'])
                : ($nationalId ?: null);
            $externalAppointmentId = isset($payload['external_appointment_id']) ? trim((string) $payload['external_appointment_id']) : null;

            // Short-term burst limiter (3 attempts / minute / phone)
            if (RateLimiter::tooManyAttempts("phone_flood:{$normalizedPhone}", 3)) {
                abort(response()->json([
                    'type' => 'https://connect.tebiby.com/errors/err-rate-limit-exceeded',
                    'title' => 'Rate Limit Exceeded',
                    'status' => 429,
                    'detail' => 'Too many booking attempts for this phone number. Please wait a minute before retrying.',
                    'code' => 'ERR_RATE_LIMIT_EXCEEDED',
                ], 429, ['Content-Type' => 'application/problem+json; charset=utf-8']));
            }
            RateLimiter::hit("phone_flood:{$normalizedPhone}", 60);

            // Daily quota limiter (5 active appointments / day / phone)
            $dailyActiveCount = Appointment::whereDate('appointment_date', $date)
                ->whereNotIn('status', ['cancelled'])
                ->whereHas('patient', function ($q) use ($normalizedPhone) {
                    $q->where('phone', $normalizedPhone);
                })
                ->count();

            if ($dailyActiveCount >= 5) {
                abort(response()->json([
                    'type' => 'https://connect.tebiby.com/errors/err-daily-phone-limit',
                    'title' => 'Daily Booking Limit Exceeded',
                    'status' => 422,
                    'detail' => 'Patient phone number has reached the maximum limit of 5 active bookings for this date.',
                    'code' => 'ERR_DAILY_PHONE_LIMIT',
                ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']));
            }

            // Check patient identity conflict (same external_patient_id with different phone)
            if ($externalPatientId) {
                $existingPatientLink = ConnectAppointmentLink::where('credential_id', $credential->id)
                    ->where('external_patient_id', $externalPatientId)
                    ->first();

                if ($existingPatientLink && $existingPatientLink->patient_phone_snapshot !== $normalizedPhone) {
                    abort(response()->json([
                        'type' => 'https://connect.tebiby.com/errors/err-patient-identity-conflict',
                        'title' => 'Patient Identity Conflict',
                        'status' => 409,
                        'detail' => 'The external_patient_id is already registered with different patient phone details.',
                        'code' => 'ERR_PATIENT_IDENTITY_CONFLICT',
                    ], 409, ['Content-Type' => 'application/problem+json; charset=utf-8']));
                }
            }

            // Check duplicate external_appointment_id
            if ($externalAppointmentId) {
                $dupExtAppt = ConnectAppointmentLink::where('credential_id', $credential->id)
                    ->where('external_appointment_id', $externalAppointmentId)
                    ->exists();

                if ($dupExtAppt) {
                    abort(response()->json([
                        'type' => 'https://connect.tebiby.com/errors/err-invalid-state',
                        'title' => 'Duplicate External Appointment ID',
                        'status' => 409,
                        'detail' => 'An appointment with this external_appointment_id has already been created.',
                        'code' => 'ERR_INVALID_STATE',
                    ], 409, ['Content-Type' => 'application/problem+json; charset=utf-8']));
                }
            }

            // Patient User Resolution:
            // 1. By National ID (if provided)
            // 2. Or by real email if provided
            // 3. Or by normalized phone
            // 4. Fallback: create User with national_id, name, phone, auto-assigned safe email
            $patientUser = null;
            if ($nationalId) {
                $patientUser = User::where('national_id', $nationalId)->where('role', 'patient')->first();
            }
            if (! $patientUser && $patientEmail) {
                $patientUser = User::where('email', $patientEmail)->first();
            }
            if (! $patientUser) {
                $patientUser = User::where('phone', $normalizedPhone)->where('role', 'patient')->first();
            }

            if (! $patientUser) {
                $identityKey = $nationalId ? "nid:{$nationalId}" : ($credential->id . ':' . ($externalPatientId ?? $normalizedPhone));
                $emailHash = substr(hash('sha256', $identityKey), 0, 32);
                $assignedEmail = $patientEmail ?? "connect-patient-{$emailHash}@connect-patient.tebiby.internal";

                $patientUser = User::create([
                    'name' => $patientName,
                    'email' => $assignedEmail,
                    'phone' => $normalizedPhone,
                    'national_id' => $nationalId,
                    'role' => 'patient',
                    'password' => bcrypt(Str::random(32)),
                ]);
            } else {
                $updates = [];
                if ($nationalId && empty($patientUser->national_id)) {
                    $updates['national_id'] = $nationalId;
                }
                if ($patientEmail && empty($patientUser->email)) {
                    $updates['email'] = $patientEmail;
                }
                if ($normalizedPhone && empty($patientUser->phone)) {
                    $updates['phone'] = $normalizedPhone;
                }
                if (! empty($updates)) {
                    $patientUser->update($updates);
                }
            }

            if (empty($externalPatientId)) {
                $externalPatientId = $nationalId ?: ('PAT-' . $patientUser->id);
            }

            // Concurrency capacity check with lockForUpdate
            $autoConfirmLimit = (int) ($doctor->slot_auto_confirm_limit ?? 1);
            $waitlistLimit = (int) ($doctor->slot_waitlist_limit ?? 1);
            $totalCapacity = max(1, $autoConfirmLimit + $waitlistLimit);

            $newStart = $this->timeToMinutes($time);
            $newEnd = $newStart + $duration;

            $existingAppts = Appointment::where('doctor_id', $doctor->id)
                ->where('facility_id', $facility->id)
                ->whereDate('appointment_date', $date)
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->lockForUpdate()
                ->get(['appointment_time', 'duration_minutes']);

            $peakBooked = $this->availabilityEngine->maxConcurrentOverlaps(
                $existingAppts,
                $newStart,
                $newEnd,
                $duration
            );

            if ($peakBooked >= $totalCapacity) {
                abort(response()->json([
                    'type' => 'https://connect.tebiby.com/errors/err-slot-not-available',
                    'title' => 'Slot Full',
                    'status' => 422,
                    'detail' => 'The selected appointment slot has reached maximum capacity and waitlist limits.',
                    'code' => 'ERR_SLOT_NOT_AVAILABLE',
                ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']));
            }

            $isAutoConfirmed = ($peakBooked < $autoConfirmLimit);
            $internalStatus = $isAutoConfirmed ? 'confirmed' : 'booked';
            $publicStatus = $isAutoConfirmed ? 'confirmed' : 'pending_confirmation';

            // Resolve explicit DoctorFacility pivot
            $doctorFacility = DoctorFacility::where('doctor_profile_id', $doctor->id)
                ->where('facility_id', $facility->id)
                ->where('is_active', true)
                ->first();

            // Generate CSPRNG booking reference: TB-XX####
            $bookingRef = 'TB-' . strtoupper(Str::random(2)) . random_int(1000, 9999);

            $paymentMethod = $payload['payment_method'] ?? 'cash';
            $paymentStatus = $paymentMethod === 'online' ? 'paid' : 'pending';

            $appointment = Appointment::create([
                'booking_reference' => $bookingRef,
                'patient_id' => $patientUser->id,
                'doctor_id' => $doctor->id,
                'facility_id' => $facility->id,
                'doctor_facility_id' => $doctorFacility?->id,
                'doctor_service_id' => $service->id,
                'service_name' => $service->name,
                'appointment_date' => $date,
                'appointment_time' => $time . ':00',
                'duration_minutes' => $duration,
                'status' => $internalStatus,
                'booking_confirmed_at' => $isAutoConfirmed ? now() : null,
                'payment_method' => $paymentMethod,
                'payment_status' => $paymentStatus,
                'consultation_fee' => $basePrice,
                'total_amount' => $totalPrice,
                'notify_whatsapp' => isset($payload['notify_whatsapp']) ? (bool) $payload['notify_whatsapp'] : true,
            ]);

            // Queue Ticket generation
            $lastTicket = QueueTicket::where('doctor_facility_id', $doctorFacility?->id)
                ->whereDate('queue_date', $date)
                ->max('ticket_number') ?? 0;
            $ticketNumber = $lastTicket + 1;

            QueueTicket::create([
                'appointment_id' => $appointment->id,
                'doctor_facility_id' => $doctorFacility?->id,
                'queue_date' => $date,
                'ticket_number' => $ticketNumber,
                'current_serving_number' => 1,
                'status' => 'waiting',
                'estimated_wait_minutes' => (int) ($doctor->waiting_time_minutes ?? 15),
            ]);

            // Dispatch WhatsApp notification (Template 2 if auto-confirmed, Template 1 if waitlist)
            if ($appointment->notify_whatsapp) {
                try {
                    $gupshup = app(\App\Services\GupshupWhatsAppService::class);
                    if ($isAutoConfirmed) {
                        $gupshup->notifyBookingConfirmed($appointment);
                    } else {
                        $gupshup->notifyBookingReceived($appointment);
                    }
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Connect WhatsApp notification failed: ' . $e->getMessage());
                }
            }

            // Connect Appointment Link & Public Token
            $publicToken = 'ptk_' . Str::random(40);
            $publicTokenHash = hash('sha256', $publicToken);

            ConnectAppointmentLink::create([
                'credential_id' => $credential->id,
                'appointment_id' => $appointment->id,
                'external_appointment_id' => $externalAppointmentId,
                'external_patient_id' => $externalPatientId,
                'patient_name_snapshot' => $patientName,
                'patient_phone_snapshot' => $normalizedPhone,
                'public_token_hash' => $publicTokenHash,
                'public_token_expires_at' => Carbon::parse($date)->addDay(),
            ]);

            if ($intent) {
                $intent->update([
                    'status' => 'consumed',
                    'consumed_at' => now(),
                ]);
            }

            return [
                'booking_reference' => $bookingRef,
                'external_appointment_id' => $externalAppointmentId,
                'public_token' => $publicToken,
                'status' => $publicStatus,
                'patient' => [
                    'id' => $patientUser->id,
                    'name' => $patientUser->name,
                    'national_id' => $patientUser->national_id,
                    'phone' => $patientUser->phone,
                    'email' => $patientUser->email,
                    'external_id' => $externalPatientId,
                ],
                'ticket' => [
                    'ticket_number' => $ticketNumber,
                    'current_serving' => 1,
                    'patients_ahead' => max(0, $ticketNumber - 1),
                    'estimated_wait_minutes' => (int) ($doctor->waiting_time_minutes ?? 15),
                ],
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $doctor->user?->name ?? 'طبيب معتمد',
                    'title' => $doctor->title_ar ?? 'طبيب عام',
                ],
                'facility' => [
                    'id' => $facility->id,
                    'name' => $facility->name,
                ],
                'schedule' => [
                    'date' => $date,
                    'time' => $time,
                    'formatted_time' => Carbon::createFromFormat('H:i', $time)->format('h:i A'),
                ],
                'payment' => [
                    'method' => $paymentMethod,
                    'status' => $paymentStatus,
                    'currency' => 'SAR',
                    'amount' => $totalPrice,
                ],
            ];
        }, 3);
    }

    /**
     * Cancel an existing appointment with state machine protection.
     */
    public function cancel(ConnectCredential $credential, Facility $facility, string $bookingReference, ?string $reason = null): array
    {
        return DB::transaction(function () use ($credential, $facility, $bookingReference, $reason) {
            $appointment = Appointment::where('booking_reference', $bookingReference)
                ->where('facility_id', $facility->id)
                ->first();

            if (! $appointment) {
                abort(response()->json([
                    'type' => 'https://connect.tebiby.com/errors/err-resource-not-found',
                    'title' => 'Resource Not Found',
                    'status' => 404,
                    'detail' => 'Appointment not found or does not belong to the permitted facility.',
                    'code' => 'ERR_RESOURCE_NOT_FOUND',
                ], 404, ['Content-Type' => 'application/problem+json; charset=utf-8']));
            }

            /** @var ConnectAppointmentLink|null $link */
            $link = ConnectAppointmentLink::where('appointment_id', $appointment->id)
                ->where('credential_id', $credential->id)
                ->first();

            if (! $link) {
                abort(response()->json([
                    'type' => 'https://connect.tebiby.com/errors/err-resource-not-found',
                    'title' => 'Resource Not Found',
                    'status' => 404,
                    'detail' => 'Appointment was not booked through this credential.',
                    'code' => 'ERR_RESOURCE_NOT_FOUND',
                ], 404, ['Content-Type' => 'application/problem+json; charset=utf-8']));
            }

            // Cancellation State Machine
            // 1. If already cancelled, return idempotent 200 OK without re-triggering webhooks
            if ($appointment->status === 'cancelled') {
                return [
                    'booking_reference' => $bookingReference,
                    'external_appointment_id' => $link->external_appointment_id,
                    'status' => 'cancelled',
                    'cancelled_at' => $appointment->updated_at?->toIso8601String() ?? now()->toIso8601String(),
                    'cancellation_reason' => $link->cancellation_reason,
                ];
            }

            // 2. If in consultation or completed, cancellation is strictly forbidden
            if (in_array($appointment->status, ['in_consultation', 'completed'])) {
                abort(response()->json([
                    'type' => 'https://connect.tebiby.com/errors/err-invalid-state',
                    'title' => 'Invalid State',
                    'status' => 409,
                    'detail' => "Cannot cancel appointment in [{$appointment->status}] state.",
                    'code' => 'ERR_INVALID_STATE',
                ], 409, ['Content-Type' => 'application/problem+json; charset=utf-8']));
            }

            // 3. Valid states: booked, confirmed, waiting
            $appointment->update(['status' => 'cancelled']);
            $link->update(['cancellation_reason' => $reason ?: 'Cancelled by partner API']);

            return [
                'booking_reference' => $bookingReference,
                'external_appointment_id' => $link->external_appointment_id,
                'status' => 'cancelled',
                'cancelled_at' => now()->toIso8601String(),
                'cancellation_reason' => $link->cancellation_reason,
            ];
        });
    }
}
