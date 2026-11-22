<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    use HasFactory;

    protected $with = [
        'bookingConfirmedBy:id,name',
        'arrivalConfirmedBy:id,name',
        'consultationFinishedBy:id,name',
    ];

    protected $fillable = [
        'booking_reference',
        'patient_id',
        'doctor_id',
        'doctor_service_id',
        'service_name',
        'doctor_facility_id',
        'facility_id',
        'appointment_date',
        'appointment_time',
        'duration_minutes',
        'delay_minutes',
        'delay_reason',
        'status',
        'booking_confirmed_at',
        'booking_confirmed_by',
        'arrival_confirmed_at',
        'arrival_confirmed_by',
        'consultation_finished_at',
        'consultation_finished_by',
        'payment_method',
        'payment_status',
        'payment_notes',
        'consultation_fee',
        'discount',
        'tax',
        'total_amount',
        'insurance_provider',
        'insurance_policy_number',
        'patient_notes',
        'notify_whatsapp',
        'notify_sms',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date',
            'duration_minutes' => 'integer',
            'delay_minutes' => 'integer',
            'consultation_fee' => 'decimal:2',
            'discount' => 'decimal:2',
            'tax' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'notify_whatsapp' => 'boolean',
            'notify_sms' => 'boolean',
            'booking_confirmed_at' => 'datetime',
            'arrival_confirmed_at' => 'datetime',
            'consultation_finished_at' => 'datetime',
        ];
    }

    /**
     * Convert any 12-hour Arabic/English time format (e.g. '05:40 م', '09:30 ص', '05:40 PM')
     * or standard time string into valid MySQL 24-hour time ('H:i:s').
     */
    public static function normalizeTime(?string $time): string
    {
        if (empty($time)) {
            return Carbon::now()->format('H:i:s');
        }

        // Convert Eastern Arabic numerals (٠-٩) to Western (0-9)
        $arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        $westernNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $time = str_replace($arabicNumerals, $westernNumerals, trim($time));

        // Detect AM/PM indicators in Arabic or English
        $isPm = (bool) preg_match('/(م|مساءً|مساء|pm)/iu', $time);
        $isAm = (bool) preg_match('/(ص|صباحاً|صباح|am)/iu', $time);

        // Keep only digits and colons
        $digitsAndColon = trim(preg_replace('/[^\d:]/u', '', $time));
        $parts = explode(':', $digitsAndColon);

        if (count($parts) >= 2) {
            $hours = (int) $parts[0];
            $minutes = (int) $parts[1];
            $seconds = isset($parts[2]) ? (int) $parts[2] : 0;

            if ($isPm && $hours < 12) {
                $hours += 12;
            } elseif ($isAm && $hours === 12) {
                $hours = 0;
            }

            return sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds);
        }

        try {
            return Carbon::parse($time)->format('H:i:s');
        } catch (\Throwable $e) {
            return Carbon::now()->format('H:i:s');
        }
    }

    public function setAppointmentTimeAttribute($value): void
    {
        $this->attributes['appointment_time'] = static::normalizeTime($value);
    }

    protected static function booted(): void
    {
        static::saving(function (Appointment $appointment) {
            if ($appointment->appointment_time) {
                $appointment->attributes['appointment_time'] = static::normalizeTime($appointment->appointment_time);
            }
        });

        static::creating(function (Appointment $appointment) {
            if ($appointment->doctor_id) {
                $doctor = DoctorProfile::find($appointment->doctor_id);
                if ($doctor) {
                    if (empty($appointment->facility_id)) {
                        $appointment->facility_id = $doctor->clinic_id;
                    }
                    if (empty($appointment->doctor_facility_id) && $appointment->facility_id) {
                        $pivot = DoctorFacility::firstOrCreate([
                            'doctor_profile_id' => $doctor->id,
                            'facility_id' => $appointment->facility_id,
                        ], [
                            'consultation_fee' => $doctor->consultation_fee ?? 200,
                            'default_slot_minutes' => 20,
                            'accepts_insurance' => (bool) $doctor->accepts_insurance,
                            'is_active' => true,
                        ]);
                        $appointment->doctor_facility_id = $pivot->id;
                    }
                }
            }
        });
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(DoctorProfile::class, 'doctor_id');
    }

    public function doctorService(): BelongsTo
    {
        return $this->belongsTo(DoctorService::class, 'doctor_service_id');
    }

    public function doctorFacility(): BelongsTo
    {
        return $this->belongsTo(DoctorFacility::class);
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class, 'facility_id');
    }

    public function queueTicket(): HasOne
    {
        return $this->hasOne(QueueTicket::class);
    }

    public function medicalRecord(): HasOne
    {
        return $this->hasOne(MedicalRecord::class);
    }

    public function prescription(): HasOne
    {
        return $this->hasOne(Prescription::class);
    }

    public function bookingConfirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'booking_confirmed_by');
    }

    public function arrivalConfirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'arrival_confirmed_by');
    }

    public function consultationFinishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'consultation_finished_by');
    }

    /**
     * Stage 1: Confirm Booking (Admin / Facility Admin)
     */
    public function confirmBooking(?int $userId = null): void
    {
        $this->update([
            'status' => 'confirmed',
            'booking_confirmed_at' => Carbon::now(),
            'booking_confirmed_by' => $userId ?? auth()->id(),
        ]);
    }

    /**
     * Stage 2: Confirm Arrival (Receptionist)
     */
    public function confirmArrival(?int $userId = null): void
    {
        $this->update([
            'status' => 'waiting',
            'arrival_confirmed_at' => Carbon::now(),
            'arrival_confirmed_by' => $userId ?? auth()->id(),
            // Auto-mark booking as confirmed if it arrived directly
            'booking_confirmed_at' => $this->booking_confirmed_at ?? Carbon::now(),
            'booking_confirmed_by' => $this->booking_confirmed_by ?? ($userId ?? auth()->id()),
        ]);

        $ticket = $this->queueTicket;
        if ($ticket) {
            $ticket->update(['status' => 'waiting']);
        } else {
            $nextNum = QueueTicket::whereDate('queue_date', $this->appointment_date)
                ->whereHas('appointment', fn($q) => $q->where('doctor_id', $this->doctor_id))
                ->max('ticket_number') ?? 0;

            QueueTicket::create([
                'appointment_id' => $this->id,
                'ticket_number' => $nextNum + 1,
                'status' => 'waiting',
                'queue_date' => $this->appointment_date,
                'estimated_wait_minutes' => 15,
            ]);
        }
    }

    /**
     * Stage 3: Confirm Finish Kashf / Consultation (Doctor)
     */
    public function confirmFinishConsultation(?int $userId = null): void
    {
        $this->update([
            'status' => 'completed',
            'booking_confirmed_at' => $this->booking_confirmed_at ?? Carbon::now(),
            'booking_confirmed_by' => $this->booking_confirmed_by ?? ($userId ?? auth()->id()),
            'arrival_confirmed_at' => $this->arrival_confirmed_at ?? Carbon::now(),
            'arrival_confirmed_by' => $this->arrival_confirmed_by ?? ($userId ?? auth()->id()),
            'consultation_finished_at' => Carbon::now(),
            'consultation_finished_by' => $userId ?? auth()->id(),
        ]);

        if ($this->queueTicket) {
            $this->queueTicket->update([
                'status' => 'completed',
                'completed_at' => Carbon::now(),
            ]);
        }
    }

    /**
     * Get structured status of the three confirmation stages.
     */
    public function getConfirmationStagesAttribute(): array
    {
        $isStage3 = !empty($this->consultation_finished_at) || $this->status === 'completed';
        $isStage2 = !empty($this->arrival_confirmed_at) || in_array($this->status, ['waiting', 'in_consultation', 'completed']) || $isStage3;
        $isStage1 = !empty($this->booking_confirmed_at) || in_array($this->status, ['confirmed', 'waiting', 'in_consultation', 'completed']) || $isStage2;

        return [
            'stage1_booking' => [
                'stage' => 1,
                'key' => 'booking_confirmed',
                'title' => 'تأكيد الحجز',
                'actor_role' => 'admin',
                'actor_label' => 'إدارة المنشأة',
                'is_confirmed' => $isStage1,
                'confirmed_at' => $this->booking_confirmed_at?->toIso8601String(),
                'confirmed_by_name' => $this->bookingConfirmedBy?->name
                    ?? ($isStage1 && $this->booking_confirmed_at ? 'تأكيد تلقائي فوري' : null),
                'status_label' => $isStage1 ? 'تم تأكيد الحجز' : 'بانتظار تأكيد الإدارة',
            ],
            'stage2_arrival' => [
                'stage' => 2,
                'key' => 'arrival_confirmed',
                'title' => 'تأكيد الحضور',
                'actor_role' => 'receptionist',
                'actor_label' => 'موظف الاستقبال',
                'is_confirmed' => $isStage2,
                'confirmed_at' => $this->arrival_confirmed_at?->toIso8601String(),
                'confirmed_by_name' => $this->arrivalConfirmedBy?->name,
                'status_label' => $isStage2 ? 'حضر بالاستقبال' : ($isStage1 ? 'بانتظار وصول المريض' : 'معلق'),
            ],
            'stage3_kashf' => [
                'stage' => 3,
                'key' => 'kashf_finished',
                'title' => 'إنهاء الكشف',
                'actor_role' => 'doctor',
                'actor_label' => 'الطبيب المعالج',
                'is_confirmed' => $isStage3,
                'confirmed_at' => $this->consultation_finished_at?->toIso8601String(),
                'confirmed_by_name' => $this->consultationFinishedBy?->name,
                'status_label' => $isStage3 ? 'اكتمل الكشف' : ($this->status === 'in_consultation' ? 'قيد الكشف الآن' : 'بانتظار الكشف'),
            ],
        ];
    }

    public function toArray(): array
    {
        $array = parent::toArray();
        if ($this->relationLoaded('queueTicket')) {
            $array['queueTicket'] = $array['queue_ticket'] ?? null;
        }
        $array['confirmation_stages'] = $this->confirmation_stages;
        return $array;
    }
}
