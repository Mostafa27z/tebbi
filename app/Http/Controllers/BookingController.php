<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\DoctorService;
use App\Models\QueueTicket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    private function timeToMinutes(string $time24): int
    {
        $parts = explode(':', $time24);
        $hours = (int) ($parts[0] ?? 0);
        $minutes = (int) ($parts[1] ?? 0);
        return ($hours * 60) + $minutes;
    }

    /**
     * Compute maximum simultaneous overlapping bookings inside [newStart, newEnd).
     * Half-open intervals [start, end) ensure back-to-back slots do not collide.
     */
    private function maxConcurrentOverlaps(iterable $appointments, int $newStart, int $newEnd, int $fallbackDuration): int
    {
        $events = [];

        foreach ($appointments as $existing) {
            $existingStart = $this->timeToMinutes(Appointment::normalizeTime($existing->appointment_time));
            $existingEnd = $existingStart + max(5, (int) ($existing->duration_minutes ?: $fallbackDuration));

            if ($existingStart < $newEnd && $existingEnd > $newStart) {
                $clippedStart = max($existingStart, $newStart);
                $clippedEnd = min($existingEnd, $newEnd);

                if ($clippedStart < $clippedEnd) {
                    $events[] = [$clippedStart, 1];
                    $events[] = [$clippedEnd, -1];
                }
            }
        }

        if (empty($events)) {
            return 0;
        }

        usort($events, function (array $a, array $b) {
            if ($a[0] === $b[0]) {
                return $a[1] <=> $b[1]; // -1 (end) before +1 (start)
            }
            return $a[0] <=> $b[0];
        });

        $current = 0;
        $peak = 0;
        foreach ($events as [, $delta]) {
            $current += $delta;
            if ($current > $peak) {
                $peak = $current;
            }
        }

        return $peak;
    }

    public function bookedSlots(Request $request, DoctorProfile $doctor): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
        ]);

        $fallbackDuration = (int) ($doctor->waiting_time_minutes ?: 20);
        $autoConfirmLimit = (int) ($doctor->slot_auto_confirm_limit ?? 1);
        $waitlistLimit = (int) ($doctor->slot_waitlist_limit ?? 1);

        $appointments = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $validated['date'])
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->orderBy('appointment_time')
            ->get(['id', 'appointment_time', 'duration_minutes']);

        $bookedIntervals = $appointments->map(function (Appointment $appt) use ($fallbackDuration) {
            $normalized = Appointment::normalizeTime($appt->appointment_time);
            $startMinutes = $this->timeToMinutes($normalized);
            $duration = (int) ($appt->duration_minutes ?: $fallbackDuration);

            return [
                'start_time' => substr($normalized, 0, 5),
                'start_minutes' => $startMinutes,
                'end_minutes' => $startMinutes + $duration,
                'duration_minutes' => $duration,
            ];
        })->values();

        return response()->json([
            'date' => $validated['date'],
            'slot_auto_confirm_limit' => $autoConfirmLimit,
            'slot_waitlist_limit' => $waitlistLimit,
            'total_slot_capacity' => max(1, $autoConfirmLimit + $waitlistLimit),
            'booked_intervals' => $bookedIntervals,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'doctor_id' => 'required|exists:doctor_profiles,id',
            'doctor_service_id' => 'nullable|integer|exists:doctor_services,id',
            'patient_name' => 'required|string|max:255',
            'patient_phone' => 'required|string|max:20',
            'patient_national_id' => 'nullable|string|max:20',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required|string',
            'payment_method' => 'required|in:insurance,at_clinic,online',
            'insurance_provider' => 'nullable|string',
            'insurance_policy_number' => 'nullable|string',
            'patient_notes' => 'nullable|string',
            'notify_whatsapp' => 'boolean',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $doctor = DoctorProfile::findOrFail($validated['doctor_id']);
            $fallbackDuration = (int) ($doctor->waiting_time_minutes ?: 20);

            $serviceId = null;
            $serviceName = 'كشف استشاري';
            $durationMinutes = $fallbackDuration;
            $fee = (float) $doctor->consultation_fee;

            if (! empty($validated['doctor_service_id'])) {
                $service = DoctorService::where('id', $validated['doctor_service_id'])
                    ->where('doctor_profile_id', $doctor->id)
                    ->where('is_active', true)
                    ->first();

                if (! $service) {
                    throw ValidationException::withMessages([
                        'doctor_service_id' => 'نوع الكشف المختار غير متاح لدى هذا الطبيب.',
                    ]);
                }

                $serviceId = $service->id;
                $serviceName = $service->name;
                $durationMinutes = (int) $service->duration_minutes;
                $fee = (float) $service->price;
            }

            $normalizedTime = Appointment::normalizeTime($validated['appointment_time']);
            $newStart = $this->timeToMinutes($normalizedTime);
            $newEnd = $newStart + max(5, $durationMinutes);

            $autoConfirmLimit = (int) ($doctor->slot_auto_confirm_limit ?? 1);
            $waitlistLimit = (int) ($doctor->slot_waitlist_limit ?? 1);
            $totalSlotCapacity = max(1, $autoConfirmLimit + $waitlistLimit);

            $existingAppts = Appointment::where('doctor_id', $doctor->id)
                ->whereDate('appointment_date', $validated['appointment_date'])
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->lockForUpdate()
                ->get(['appointment_time', 'duration_minutes']);

            $peakBooked = $this->maxConcurrentOverlaps($existingAppts, $newStart, $newEnd, $fallbackDuration);

            if ($peakBooked >= $totalSlotCapacity) {
                throw ValidationException::withMessages([
                    'appointment_time' => 'عذراً، اكتمل الحد الأقصى للحجوزات (الفورية والانتظار) في هذا الموعد. يرجى اختيار وقت آخر متاح.',
                ]);
            }

            $isAutoConfirmed = $peakBooked < $autoConfirmLimit;

            // Find or create patient safely without account takeover
            $patient = null;
            $wasNewUser = false;

            if ($request->user()) {
                $patient = $request->user();
            } else {
                $phone = $validated['patient_phone'];
                $patient = User::firstOrCreate(
                    ['phone' => $phone],
                    [
                        'name' => $validated['patient_name'],
                        'email' => 'patient_' . Str::random(6) . '@tebiby.com',
                        'password' => bcrypt(Str::random(16)),
                        'national_id' => $validated['patient_national_id'] ?? null,
                        'role' => 'patient',
                    ]
                );

                if ($patient->wasRecentlyCreated) {
                    $wasNewUser = true;
                }
            }

            $discount = ($validated['payment_method'] === 'insurance') ? $fee : 0.00;
            $tax = ($fee - $discount) * 0.15;
            $total = ($fee - $discount) + $tax;

            $bookingReference = 'TB-' . strtoupper(Str::random(2)) . rand(1000, 9999);

            $appointment = Appointment::create([
                'booking_reference' => $bookingReference,
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'doctor_service_id' => $serviceId,
                'service_name' => $serviceName,
                'appointment_date' => $validated['appointment_date'],
                'appointment_time' => $normalizedTime,
                'duration_minutes' => $durationMinutes,
                'status' => $isAutoConfirmed ? 'confirmed' : 'booked',
                'booking_confirmed_at' => $isAutoConfirmed ? Carbon::now() : null,
                'booking_confirmed_by' => null,
                'payment_method' => $validated['payment_method'],
                'payment_status' => match ($validated['payment_method']) {
                    'online' => 'paid',
                    'insurance' => 'pending_verification',
                    default => 'pending',
                },
                'consultation_fee' => $fee,
                'discount' => $discount,
                'tax' => $tax,
                'total_amount' => $total,
                'insurance_provider' => $validated['insurance_provider'] ?? null,
                'insurance_policy_number' => $validated['insurance_policy_number'] ?? null,
                'patient_notes' => $validated['patient_notes'] ?? null,
                'notify_whatsapp' => $validated['notify_whatsapp'] ?? true,
                'notify_sms' => true,
            ]);

            // Determine ticket number for today
            $todayTicketsCount = QueueTicket::whereHas('appointment', function ($q) use ($doctor, $validated) {
                $q->where('doctor_id', $doctor->id)
                  ->whereDate('appointment_date', $validated['appointment_date']);
            })->count();

            $ticketNumber = $todayTicketsCount + 1;
            
            // Find current serving number
            $currentServingTicket = QueueTicket::whereHas('appointment', function ($q) use ($doctor, $validated) {
                $q->where('doctor_id', $doctor->id)
                  ->whereDate('appointment_date', $validated['appointment_date']);
            })->whereIn('status', ['called', 'examining'])->first();

            $currentServingNumber = $currentServingTicket ? $currentServingTicket->ticket_number : 1;
            $patientsAhead = max(0, $ticketNumber - $currentServingNumber);
            $waitMinutes = $patientsAhead * $doctor->waiting_time_minutes;

            QueueTicket::create([
                'appointment_id' => $appointment->id,
                'ticket_number' => $ticketNumber,
                'current_serving_number' => $currentServingNumber,
                'estimated_wait_minutes' => max(5, $waitMinutes),
                'status' => 'waiting',
            ]);

            // Send WhatsApp notification (Auto-confirmed => Template 2, Waitlist/Pending => Template 1)
            $gupshup = app(\App\Services\GupshupWhatsAppService::class);
            if ($isAutoConfirmed) {
                $gupshup->notifyBookingConfirmed($appointment);
            } else {
                $gupshup->notifyBookingReceived($appointment);
            }

            if ($wasNewUser) {
                \Illuminate\Support\Facades\Auth::login($patient);
            }

            $successMessage = $isAutoConfirmed
                ? 'تم تأكيد حجزك تلقائياً وفورياً! تم إصدار التذكرة وإرسال رابط التتبع إلى هاتفك.'
                : 'تم تسجيل حجزك في قائمة الانتظار لهذا الموعد بنجاح، وسيتم التواصل معك لتأكيد الحضور.';

            if (! $request->user() && ! $wasNewUser) {
                return redirect()->route('login')
                    ->with('success', $successMessage);
            }

            return redirect()->route('queue.show', ['bookingReference' => $bookingReference])
                ->with('success', $successMessage);
        });
    }
}

