<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\QueueTicket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'doctor_id' => 'required|exists:doctor_profiles,id',
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
                    \Illuminate\Support\Facades\Auth::login($patient);
                }
            }

            $doctor = DoctorProfile::findOrFail($validated['doctor_id']);
            $fee = $doctor->consultation_fee;
            $discount = ($validated['payment_method'] === 'insurance') ? $fee : 0.00;
            $tax = ($fee - $discount) * 0.15;
            $total = ($fee - $discount) + $tax;

            $bookingReference = 'TB-' . strtoupper(Str::random(2)) . rand(1000, 9999);

            $appointment = Appointment::create([
                'booking_reference' => $bookingReference,
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'appointment_date' => $validated['appointment_date'],
                'appointment_time' => $validated['appointment_time'],
                'status' => 'waiting',
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

            if (! $request->user() && ! $wasNewUser) {
                return redirect()->route('login')
                    ->with('success', 'تم تأكيد حجزك بنجاح! رقم الجوال مسجل مسبقاً، يرجى تسجيل الدخول للاطلاع على التذكرة ومتابعة دورك الحي.');
            }

            return redirect()->route('queue.show', ['bookingReference' => $bookingReference])
                ->with('success', 'تم تأكيد حجزك بنجاح! تم إصدار التذكرة وإرسال رابط التتبع إلى هاتفك.');
        });
    }
}

