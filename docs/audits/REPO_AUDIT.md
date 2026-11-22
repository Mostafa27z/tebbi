# REPO_AUDIT.md — Tebiby Codebase Technical Audit

> **Audit Type:** READ-ONLY Technical Audit  
> **Date:** November 2026  
> **Scope:** Full repository inspection covering P0 (Core Architecture Deciders) and P1 (Catalog, Auth, Infrastructure & Baseline Verification).  
> **Rule Adherence:** No secrets copied, no .env values/keys copied, all items verified with exact file paths and line numbers. Missing items explicitly marked **NOT FOUND**.

---

# Table of Contents
1. [P0.1 Stack & Infrastructure](#p01-stack--infrastructure)
2. [P0.2 Appointment Model & Database Migrations](#p02-appointment-model--database-migrations)
3. [P0.3 Appointment Lifecycle (Creation, Rescheduling, Cancellation)](#p03-appointment-lifecycle-creation-rescheduling-cancellation)
4. [P0.4 Sandbox Leakage Surface & Financial Aggregation](#p04-sandbox-leakage-surface--financial-aggregation)
5. [P0.5 Notifications: GupshupWhatsAppService & Outbound Channels](#p05-notifications-gupshupwhatsappservice--outbound-channels)
6. [P0.6 Status Lifecycle & Transitions](#p06-status-lifecycle--transitions)
7. [P1.7 Catalog & Availability Computation](#p17-catalog--availability-computation)
8. [P1.8 Patient Modeling & Matching](#p18-patient-modeling--matching)
9. [P1.9 Payments & Pricing Engine](#p19-payments--pricing-engine)
10. [P1.10 Authentication, Roles & Scoping](#p110-authentication-roles--scoping)
11. [P1.11 Logging, Exception Handling & PII Surface](#p111-logging-exception-handling--pii-surface)
12. [P1.12 Routing & Middleware Infrastructure](#p112-routing--middleware-infrastructure)
13. [P1.13 Tests & Baseline Verification (Gate 0)](#p113-tests--baseline-verification-gate-0)
14. [P1.14 Package Dependencies (composer.json)](#p114-package-dependencies-composerjson)

---

# P0.1 Stack & Infrastructure

### 1. Versions & Drivers
* **PHP Version:** `8.4.22` CLI (`composer.json` specifies `"php": "^8.2"`).
* **Laravel Framework Version:** `12.71.0` (`composer.json` specifies `"laravel/framework": "^12.0"`).
* **Database Engine:** MySQL in local/production (`.env` specifies `DB_CONNECTION=mysql`). SQLite in-memory is used for unit tests (`phpunit.xml` line 25: `<env name="DB_CONNECTION" value="sqlite"/>`).
* **Queue Driver:** `database` (`config/queue.php` line 16, backed by `jobs` table).
* **Cache Driver:** `database` (`config/cache.php` line 18, backed by `cache` table).
* **Session Driver:** `database` (`config/session.php` line 21, backed by `sessions` table).
* **Mail Driver:** `log` (`.env.example` line 53).

### 2. How Queue Workers Run
* **Development:** Defined in `composer.json` lines 58-60:
  ```json
  "dev": [
      "Composer\\Config::disableProcessTimeout",
      "npx concurrently -c \"#93c5fd,#c4b5fd,#fdba74\" \"php artisan serve\" \"php artisan queue:listen --tries=1\" \"npm run dev\" --names='server,queue,vite'"
  ]
  ```
* **Production Supervisor / Systemd / Procfile:** **NOT FOUND** in repository.
* **Cron / Scheduled Workers:** No scheduled tasks registered in `routes/console.php` (only default `inspire` command).

### 3. Hosting & Deployment Process
* **Hosting Type:** VPS / Dedicated server deployment (No Dockerfile, `docker-compose.yml`, or container manifests present in repository).
* **CI/CD Workflow:** GitHub Actions at [.github/workflows/tests.yml](file:///g:/Web/Projects/freelancer/tebbi/.github/workflows/tests.yml#L1-L53) running PHP 8.4, Node 22, `npm ci`, `npm run build`, `composer install`, `touch database/database.sqlite`, `php artisan key:generate`, and `vendor/bin/pest`.
* **Migration Process:** Standard Laravel migration scripts executed via Artisan (`php artisan migrate`).

### 4. Feasibility of Separate Sandbox Instance
* **Verdict: 100% FEASIBLE.**
* **Architectural Justification:** The application utilizes database-backed drivers for queue, cache, and sessions (`database`). There are zero hardcoded server paths or native daemons. Deploying a second instance of the identical codebase (e.g. `sandbox.tebiby.com` on a separate virtual host or folder) pointing to a dedicated isolated database (`tebiby_sandbox`) is completely supported and delivers true, physical infrastructure and data isolation without any risk of production leakage.

---

# P0.2 Appointment Model & Database Migrations

### 1. Appointment Model in Full
File: [app/Models/Appointment.php](file:///g:/Web/Projects/freelancer/tebbi/app/Models/Appointment.php#L1-L332)

```php
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

    public static function normalizeTime(?string $time): string
    {
        if (empty($time)) {
            return Carbon::now()->format('H:i:s');
        }

        $arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        $westernNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $time = str_replace($arabicNumerals, $westernNumerals, trim($time));

        $isPm = (bool) preg_match('/(م|مساءً|مساء|pm)/iu', $time);
        $isAm = (bool) preg_match('/(ص|صباحاً|صباح|am)/iu', $time);

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

    public function confirmBooking(?int $userId = null): void
    {
        $this->update([
            'status' => 'confirmed',
            'booking_confirmed_at' => Carbon::now(),
            'booking_confirmed_by' => $userId ?? auth()->id(),
        ]);
    }

    public function confirmArrival(?int $userId = null): void
    {
        $this->update([
            'status' => 'waiting',
            'arrival_confirmed_at' => Carbon::now(),
            'arrival_confirmed_by' => $userId ?? auth()->id(),
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
```

* **Scopes on Model:** Currently **NOT FOUND** (no custom local or global scopes defined in model yet).
* **Observers registered:** **NOT FOUND** in `app/Providers/AppServiceProvider.php`.

---

### 2. ALL Migrations Touching `appointments`

1. **[database/migrations/2026_03_01_000006_create_appointments_table.php](file:///g:/Web/Projects/freelancer/tebbi/database/migrations/2026_03_01_000006_create_appointments_table.php#L1-L39):**
   * Creates table `appointments`:
     * `id` (bigint unsigned auto-increment primary key)
     * `booking_reference` (string, UNIQUE)
     * `patient_id` (foreignId -> `users`, cascadeOnDelete)
     * `doctor_id` (foreignId -> `doctor_profiles`, cascadeOnDelete)
     * `appointment_date` (date)
     * `appointment_time` (time)
     * `status` (string, default `'confirmed'`)
     * `payment_method` (string, default `'at_clinic'`)
     * `payment_status` (string, default `'pending'`)
     * `consultation_fee` (decimal 8,2)
     * `discount` (decimal 8,2, default 0.00)
     * `tax` (decimal 8,2, default 0.00)
     * `total_amount` (decimal 8,2)
     * `insurance_provider` (string, nullable)
     * `insurance_policy_number` (string, nullable)
     * `patient_notes` (text, nullable)
     * `notify_whatsapp` (boolean, default true)
     * `notify_sms` (boolean, default true)
     * `timestamps` (`created_at`, `updated_at`)

2. **[database/migrations/2026_11_08_000005_link_calendar_and_queue_to_doctor_facility.php](file:///g:/Web/Projects/freelancer/tebbi/database/migrations/2026_11_08_000005_link_calendar_and_queue_to_doctor_facility.php#L22-L28):**
   * Adds `doctor_facility_id` (unsignedBigInteger, nullable, indexed).
   * Adds `facility_id` (unsignedBigInteger, nullable, indexed).

3. **[database/migrations/2026_11_14_200836_add_confirmation_stages_to_appointments_table.php](file:///g:/Web/Projects/freelancer/tebbi/database/migrations/2026_11_14_200836_add_confirmation_stages_to_appointments_table.php#L14-L26):**
   * Adds `booking_confirmed_at` (timestamp, nullable)
   * Adds `booking_confirmed_by` (foreignId -> `users`, nullOnDelete)
   * Adds `arrival_confirmed_at` (timestamp, nullable)
   * Adds `arrival_confirmed_by` (foreignId -> `users`, nullOnDelete)
   * Adds `consultation_finished_at` (timestamp, nullable)
   * Adds `consultation_finished_by` (foreignId -> `users`, nullOnDelete)

4. **[database/migrations/2026_11_15_210000_add_delay_and_payment_notes_to_appointments_table.php](file:///g:/Web/Projects/freelancer/tebbi/database/migrations/2026_11_15_210000_add_delay_and_payment_notes_to_appointments_table.php#L11-L15):**
   * Adds `delay_minutes` (integer, default 0)
   * Adds `delay_reason` (string, nullable)
   * Adds `payment_notes` (text, nullable)

5. **[database/migrations/2026_11_19_000002_add_service_fields_to_appointments_table.php](file:///g:/Web/Projects/freelancer/tebbi/database/migrations/2026_11_19_000002_add_service_fields_to_appointments_table.php#L11-L20):**
   * Adds `doctor_service_id` (foreignId -> `doctor_services`, nullOnDelete)
   * Adds `service_name` (string 160, nullable)
   * Adds `duration_minutes` (unsignedInteger, nullable)

### 3. Current Columns, Indexes, FKs Summary
* **Columns (29):** `id`, `booking_reference`, `patient_id`, `doctor_id`, `doctor_service_id`, `service_name`, `doctor_facility_id`, `facility_id`, `appointment_date`, `appointment_time`, `duration_minutes`, `delay_minutes`, `delay_reason`, `status`, `booking_confirmed_at`, `booking_confirmed_by`, `arrival_confirmed_at`, `arrival_confirmed_by`, `consultation_finished_at`, `consultation_finished_by`, `payment_method`, `payment_notes`, `payment_status`, `consultation_fee`, `discount`, `tax`, `total_amount`, `insurance_provider`, `insurance_policy_number`, `patient_notes`, `notify_whatsapp`, `notify_sms`, `created_at`, `updated_at`.
* **Unique Constraints:** `booking_reference` (UNIQUE).
* **Indexes:** `PRIMARY KEY (id)`, `doctor_facility_id`, `facility_id`.
* **Foreign Keys:**
  * `patient_id` -> `users(id)` ON DELETE CASCADE
  * `doctor_id` -> `doctor_profiles(id)` ON DELETE CASCADE
  * `doctor_service_id` -> `doctor_services(id)` ON DELETE SET NULL
  * `booking_confirmed_by` -> `users(id)` ON DELETE SET NULL
  * `arrival_confirmed_by` -> `users(id)` ON DELETE SET NULL
  * `consultation_finished_by` -> `users(id)` ON DELETE SET NULL
* **Live DB Row Count:** In testing sandbox execution, DB access to production host is blocked; in tests SQLite is seeded per-test.

---

# P0.3 Appointment Lifecycle (Creation, Rescheduling, Cancellation)

### 1. Creation Places (2 Places Found)

#### A. Public Web Booking: [app/Http/Controllers/BookingController.php::store](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/BookingController.php#L111-L288)
* **Inside DB::transaction?** **YES** (`DB::transaction(function () use ($validated, $request) { ... })` at line 128).
* **Uses `lockForUpdate`?** **YES** (line 166):
  ```php
  $existingAppts = Appointment::where('doctor_id', $doctor->id)
      ->whereDate('appointment_date', $validated['appointment_date'])
      ->whereNotIn('status', ['cancelled', 'no_show'])
      ->lockForUpdate()
      ->get(['appointment_time', 'duration_minutes']);
  ```
* **Capacity and Waitlist Computation:**
  * `slot_auto_confirm_limit` (from `doctor_profiles.slot_auto_confirm_limit`, default 1).
  * `slot_waitlist_limit` (from `doctor_profiles.slot_waitlist_limit`, default 1).
  * `$totalSlotCapacity = max(1, $autoConfirmLimit + $waitlistLimit)`.
  * `$peakBooked = $this->maxConcurrentOverlaps($existingAppts, $newStart, $newEnd, $fallbackDuration);`
  * If `$peakBooked >= $totalSlotCapacity` -> throws `ValidationException` (lines 171-175).
  * `$isAutoConfirmed = $peakBooked < $autoConfirmLimit;`
  * Status set to: `$isAutoConfirmed ? 'confirmed' : 'booked'`.
* **Ticket Number Generation:**
  * `$todayTicketsCount = QueueTicket::whereHas('appointment', ...)->count();`
  * `$ticketNumber = $todayTicketsCount + 1;` (lines 239-244).
* **Booking Reference Generation:**
  * `$bookingReference = 'TB-' . strtoupper(Str::random(2)) . rand(1000, 9999);` (line 207).
  * Length: 9 chars (e.g. `TB-AB1234`). Entropy: $26^2 \times 9000 \approx 6.08 \times 10^6$ combinations. Uniqueness checked only by database unique index constraint.

#### B. Reception Walk-In Ticket: [app/Http/Controllers/FacilityDashboardController.php::issueWalkInTicket](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/FacilityDashboardController.php#L834-L912)
* **Inside DB::transaction?** **NO**.
* **Uses `lockForUpdate`?** **NO**.
* **Capacity and Waitlist Computation:** **NOT COMPUTED** (bypasses capacity; walk-in issued directly as `waiting`).
* **Ticket Number Generation:**
  * `$nextTicketNumber = QueueTicket::whereDate('queue_date', $today)->whereHas('appointment', fn($q) => $q->where('doctor_id', $doctor->id))->max('ticket_number') ?? 0;`
  * `$newTicketNumber = $nextTicketNumber + 1;` (lines 867-871).
* **Booking Reference Generation:**
  * `$bookingRef = 'WLK-' . strtoupper(Str::random(6));` (line 873).
  * Length: 10 chars. Entropy: $36^6 \approx 2.17 \times 10^9$.

---

### 2. Rescheduling Places
* **Result: NOT FOUND.**
* No controller, service, or job in the entire codebase implements appointment rescheduling (only Template 8 in `GupshupWhatsAppService` mentions rescheduling in docblock comment).

---

### 3. Cancellation Places (3 Places Found)

#### A. Admin Status Update: [app/Http/Controllers/AdminDashboardController.php::updateAppointmentStatus](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/AdminDashboardController.php#L755-L797)
* Method sets `$appointment->update(['status' => 'cancelled']);` and updates associated `QueueTicket` status to `'cancelled'`.
* Calls `$gupshup->notifyAppointmentCancelled($appointment)`.
* **Inside DB::transaction?** **NO**.
* **Uses `lockForUpdate`?** **NO**.

#### B. Facility Admin / Receptionist Status Update: [app/Http/Controllers/FacilityDashboardController.php::updateStatus](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/FacilityDashboardController.php#L688-L758)
* Method sets `$appointment->update(['status' => 'cancelled']);` and updates `QueueTicket` status to `'cancelled'`.
* Calls `$gupshup->notifyAppointmentCancelled($appointment)`.
* **Inside DB::transaction?** **NO**.
* **Uses `lockForUpdate`?** **NO**.

#### C. Mark No-Show: [app/Http/Controllers/FacilityDashboardController.php::markNoShow](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/FacilityDashboardController.php#L821-L832)
* Sets `status = 'cancelled'`, ticket to `'cancelled'`, calls `$gupshup->notifyAppointmentCancelled($appointment)`.
* **Inside DB::transaction?** **NO**.
* **Uses `lockForUpdate`?** **NO**.

---

# P0.4 Sandbox Leakage Surface & Financial Aggregation

### 1. Grep of `Appointment::` and `appointments` Table Usage by Area

#### A. Platform Admin Dashboard: [app/Http/Controllers/AdminDashboardController.php](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/AdminDashboardController.php)
* Line 35: `$totalBookings = Appointment::count();`
* Line 36: `$completedBookings = Appointment::whereIn('status', ['completed', 'in_consultation', 'confirmed'])->count();`
* Lines 80-83: `$dayBookings = Appointment::whereDate('appointment_date', $date)->count();`
* Lines 528, 548: `$query = Appointment::with(['patient', 'doctor.user', 'facility', 'queueTicket']);`
* Line 740, 755: `confirmBooking`, `updateAppointmentStatus`.

#### B. Facility & Reception Dashboard: [app/Http/Controllers/FacilityDashboardController.php](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/FacilityDashboardController.php)
* Line 95: `$appointmentsQuery = Appointment::where('facility_id', $primaryFacility->id)...`
* Lines 142-152:
  ```php
  $todayStatusCounts = Appointment::where('facility_id', $primaryFacility->id)
      ->whereDate('appointment_date', $today)
      ->selectRaw("
          COUNT(*) as total_today,
          SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting_count,
          SUM(CASE WHEN status = 'in_consultation' THEN 1 ELSE 0 END) as in_consultation_count,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
          SUM(CASE WHEN status IN ('confirmed', 'booked') THEN 1 ELSE 0 END) as not_arrived_count,
          SUM(CASE WHEN payment_method = 'insurance' THEN 1 ELSE 0 END) as insurance_count
      ")->first();
  ```
* Lines 666, 688, 813, 821, 881: Status transitions, walk-in creation.

#### C. Group Dashboard: [app/Http/Controllers/GroupDashboardController.php](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/GroupDashboardController.php)
* Line 55: `$todayAppointments = Appointment::whereIn('facility_id', $facilityIds)->whereDate('appointment_date', $today)->count();`
* Lines 59-61:
  ```php
  $totalRevenue = (float) Appointment::whereIn('facility_id', $facilityIds)
      ->where('payment_status', 'paid')
      ->sum('total_amount');
  ```

#### D. Doctor Dashboard: [app/Http/Controllers/DoctorDashboardController.php](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/DoctorDashboardController.php)
* Lines 59-63: `$todayAppointments = Appointment::where('doctor_id', $doctor->id)->whereDate('appointment_date', $today)...`
* Lines 67-74: History appointments query.
* Lines 257, 277, 406, 457, 512, 571: Consultation starts, completions, delays.

#### E. Queue & Patient Screens: [app/Http/Controllers/LiveQueueController.php](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/LiveQueueController.php)
* Line 57: `$inConsultAppt = Appointment::with('queueTicket')->where('doctor_id', $doctor->id)...`
* Lines 125, 168: `Appointment::where('booking_reference', $bookingReference)->firstOrFail();`

#### F. Exports: **NOT FOUND** (no export jobs, commands, or controllers).
#### G. Jobs reading appointments: **NOT FOUND**.
#### H. Commands reading appointments: [app/Console/Commands/GupshupTestSendCommand.php](file:///g:/Web/Projects/freelancer/tebbi/app/Console/Commands/GupshupTestSendCommand.php#L27).

---

### 2. Tables Holding `appointment_id`
1. `queue_tickets` ([database/migrations/2026_03_01_000007_create_queue_tickets_table.php#L13](file:///g:/Web/Projects/freelancer/tebbi/database/migrations/2026_03_01_000007_create_queue_tickets_table.php#L13)):
   * Column: `foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();`
2. `prescriptions` ([database/migrations/2026_03_01_000008_create_prescriptions_table.php#L13](file:///g:/Web/Projects/freelancer/tebbi/database/migrations/2026_03_01_000008_create_prescriptions_table.php#L13)):
   * Column: `foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();`

### 3. Which Table Financial Reports Sum From
* **Table:** `appointments` directly.
* There is **NO** separate `invoices`, `payments`, `transactions`, or `commissions` table.
* Revenue is calculated directly from `appointments.total_amount` where `payment_status = 'paid'` (e.g. `GroupDashboardController.php` line 61).

---

# P0.5 Notifications: GupshupWhatsAppService & Outbound Channels

### 1. GupshupWhatsAppService in Full
File: [app/Services/GupshupWhatsAppService.php](file:///g:/Web/Projects/freelancer/tebbi/app/Services/GupshupWhatsAppService.php#L1-L633)
* **Core API Endpoint:** `POST https://api.gupshup.io/wa/api/v1/template/msg`
* **Transport:** Synchronous HTTP POST using Laravel `Http::withHeaders(['apikey' => ...])->asForm()`.
* **8 Pre-Approved Templates:**
  1. `booking_received` (Lines 428-448): Template 1, new online booking (status = booked).
  2. `booking_confirmed` (Lines 454-474): Template 2, booking confirmed by admin/auto (status = confirmed).
  3. `arrival_confirmed` (Lines 480-499): Template 3, arrival confirmed at reception & ticket issued (status = waiting).
  4. `turn_approaching` (Lines 505-523): Template 4, 1 patient ahead in queue.
  5. `patient_called` (Lines 529-548): Template 5, patient called into consultation room (status = in_consultation).
  6. `consultation_completed` (Lines 553-573): Template 6, consultation finished & prescription issued (status = completed).
  7. `appointment_cancelled` (Lines 578-597): Template 7, appointment cancelled or marked no-show.
  8. `appointment_delayed` (Lines 603-632): Template 8, doctor delay added.

### 2. All Callers of GupshupWhatsAppService
* [app/Http/Controllers/BookingController.php#L265-L270](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/BookingController.php#L265-L270): `notifyBookingConfirmed` or `notifyBookingReceived`.
* [app/Http/Controllers/AdminDashboardController.php#L750](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/AdminDashboardController.php#L750): `notifyBookingConfirmed`.
* [app/Http/Controllers/AdminDashboardController.php#L772-L794](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/AdminDashboardController.php#L772-L794): `notifyBookingConfirmed`, `notifyArrivalConfirmed`, `notifyConsultationCompleted`, `notifyPatientCalled`, `notifyAppointmentCancelled`.
* [app/Http/Controllers/FacilityDashboardController.php#L683](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/FacilityDashboardController.php#L683): `notifyBookingConfirmed`.
* [app/Http/Controllers/FacilityDashboardController.php#L710-L744](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/FacilityDashboardController.php#L710-L744): Status update notifications.
* [app/Http/Controllers/FacilityDashboardController.php#L816](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/FacilityDashboardController.php#L816): `notifyArrivalConfirmed`.
* [app/Http/Controllers/FacilityDashboardController.php#L829](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/FacilityDashboardController.php#L829): `notifyAppointmentCancelled`.
* [app/Http/Controllers/FacilityDashboardController.php#L909](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/FacilityDashboardController.php#L909): `notifyArrivalConfirmed`.
* [app/Http/Controllers/DoctorDashboardController.php#L265](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/DoctorDashboardController.php#L265): `notifyConsultationCompleted`.
* [app/Http/Controllers/DoctorDashboardController.php#L425](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/DoctorDashboardController.php#L425): `notifyAppointmentDelayed`.
* [app/Http/Controllers/DoctorDashboardController.php#L507](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/DoctorDashboardController.php#L507): `notifyPatientCalled`.
* [app/Http/Controllers/DoctorDashboardController.php#L538](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/DoctorDashboardController.php#L538): `notifyConsultationCompleted`.
* [app/Http/Controllers/DoctorDashboardController.php#L591](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/DoctorDashboardController.php#L591): `notifyArrivalConfirmed`.
* [app/Http/Controllers/PatientPortalController.php#L165](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/PatientPortalController.php#L165): `notifyArrivalConfirmed`.

### 3. Other Outbound Channels
* **SMS:** **NOT FOUND** (Column `notify_sms` exists in `appointments`, but no SMS gateway, driver, or service is implemented).
* **Push Notifications:** **NOT FOUND**.
* **Telegram:** **NOT FOUND**.
* **Mail:** Used only for built-in Laravel Auth email verification; **NOT** used for appointment lifecycle.
* **Scheduled Commands/Jobs Reading Appointments:** **NOT FOUND**.

---

# P0.6 Status Lifecycle & Transitions

### 1. Status Enums & Lifecycle
The `appointments.status` string supports 6 discrete statuses:
1. `booked`: Initial state for manual/waitlist bookings requiring facility confirmation.
2. `confirmed`: Stage 1 confirmed (auto-confirmed or manually confirmed by Admin/Receptionist).
3. `waiting`: Stage 2 confirmed (patient physically arrived at reception or checked in via QR).
4. `in_consultation`: Stage 3 in progress (doctor called patient into consultation room).
5. `completed`: Stage 3 finished (consultation completed, prescription issued).
6. `cancelled`: Cancelled by admin, facility receptionist, or marked as no-show.

### 2. Transition Matrix & Execution Points
| From | To | Trigger / Method | Location | In Transaction? |
| :--- | :--- | :--- | :--- | :---: |
| *(New)* | `confirmed` | Web Booking (auto-confirmed) | `BookingController.php:218` | **YES** |
| *(New)* | `booked` | Web Booking (waitlist) | `BookingController.php:218` | **YES** |
| *(New)* | `waiting` | Walk-in Ticket | `FacilityDashboardController.php:889` | **NO** |
| `booked` | `confirmed` | Admin/Receptionist Confirm Booking | `AdminDashboardController.php:771`<br>`FacilityDashboardController.php:709` | **NO** |
| `confirmed` | `waiting` | Receptionist Check-in / Patient QR Check-in | `FacilityDashboardController.php:718`<br>`PatientPortalController.php:162` | **NO** |
| `waiting` | `in_consultation` | Doctor Call Next / Start Consultation | `DoctorDashboardController.php:467` | **NO** |
| `in_consultation` | `completed` | Doctor Finish Consultation | `DoctorDashboardController.php:264, 532` | **NO** |
| *Any* | `cancelled` | Admin / Receptionist Cancel or No-show | `AdminDashboardController.php:780`<br>`FacilityDashboardController.php:731, 823` | **NO** |

### 3. Registered Observers, Events & Listeners
* **Result: NOT FOUND.**
* `app/Providers/AppServiceProvider.php` lines 20-23: `boot()` is empty.
* No files exist in `app/Observers/`, `app/Events/`, or `app/Listeners/`.
* All notifications, status side-effects, and cache updates are executed imperatively inside controller action bodies.

### 4. Live Queue Flows: Doctor Call Next & Clinic Delay
* **Call Next Flow:** [DoctorDashboardController.php::callNext](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/DoctorDashboardController.php#L241-L300):
  * Closes previous active consultation.
  * Queries next waiting appointment (`status = 'waiting'`).
  * Updates status to `'in_consultation'`, updates ticket status to `'examining'`.
  * Pushes live event to Cache via `self::pushFacilityLiveEvent($facilityId, ...)`.
  * Calls `GupshupWhatsAppService::notifyPatientCalled`.
  * **Runs in Transaction?** **NO**.
* **Clinic Delay Flow:** [DoctorDashboardController.php::addDelay](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/DoctorDashboardController.php#L394-L455):
  * Updates `delay_minutes` and `delay_reason` on target appointment.
  * Increments `delay_minutes` on all subsequent waiting/confirmed/booked appointments for that doctor today.
  * Increments `estimated_wait_minutes` on all subsequent tickets.
  * Iterates and sends WhatsApp template 8 to each delayed patient.
  * Pushes `delay_added` event to facility Cache.
  * **Runs in Transaction?** **NO**.

---

# P1.7 Catalog & Availability Computation

### 1. Catalog Models & Migrations
* **`Group`:** Model [app/Models/Group.php](file:///g:/Web/Projects/freelancer/tebbi/app/Models/Group.php). Migration [2026_11_08_000001_create_groups_table.php](file:///g:/Web/Projects/freelancer/tebbi/database/migrations/2026_11_08_000001_create_groups_table.php) (`id`, `name_ar`, `slug` (unique), `cr_number`, `status`, `settings`).
* **`Facility`:** Model [app/Models/Facility.php](file:///g:/Web/Projects/freelancer/tebbi/app/Models/Facility.php). Upgraded from `clinics` via [2026_11_08_000002_upgrade_clinics_to_facilities.php](file:///g:/Web/Projects/freelancer/tebbi/database/migrations/2026_11_08_000002_upgrade_clinics_to_facilities.php). **Has `facilities.group_id` foreign key referencing `groups.id`**.
* **`DoctorProfile`:** Model [app/Models/DoctorProfile.php](file:///g:/Web/Projects/freelancer/tebbi/app/Models/DoctorProfile.php). Migration [2026_03_01_000004_create_doctor_profiles_table.php](file:///g:/Web/Projects/freelancer/tebbi/database/migrations/2026_03_01_000004_create_doctor_profiles_table.php). Dual-linked to primary facility via `clinic_id`, and multi-facility via `doctor_facility` pivot.
* **`DoctorFacility`:** Model [app/Models/DoctorFacility.php](file:///g:/Web/Projects/freelancer/tebbi/app/Models/DoctorFacility.php). Migration [2026_11_08_000003_create_doctor_facility_table.php](file:///g:/Web/Projects/freelancer/tebbi/database/migrations/2026_11_08_000003_create_doctor_facility_table.php). Fields: `consultation_fee`, `default_slot_minutes`, `accepts_insurance`, `is_active`.
* **`DoctorService`:** Model [app/Models/DoctorService.php](file:///g:/Web/Projects/freelancer/tebbi/app/Models/DoctorService.php). Migration [2026_11_19_000001_create_doctor_services_table.php](file:///g:/Web/Projects/freelancer/tebbi/database/migrations/2026_11_19_000001_create_doctor_services_table.php). Fields: `price`, `duration_minutes`, `is_active`, `sort_order`.
* **`DoctorSchedule`:** Model [app/Models/DoctorSchedule.php](file:///g:/Web/Projects/freelancer/tebbi/app/Models/DoctorSchedule.php). Migration [2026_03_01_000005_create_doctor_schedules_table.php](file:///g:/Web/Projects/freelancer/tebbi/database/migrations/2026_03_01_000005_create_doctor_schedules_table.php). Fields: `day_of_week`, `start_time`, `end_time`, `slot_duration_minutes`, `max_daily_patients`, `is_active`, `doctor_facility_id`.

### 2. Public Catalog Listing
* **Controller:** [app/Http/Controllers/HomeController.php::index](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/HomeController.php#L15-L65):
  * Queries `Specialty::withCount('doctorProfiles')->get()`.
  * Queries `Clinic::where('is_active', true)->get()`.
  * Queries `DoctorProfile::with(['user', 'specialty', 'clinic', 'activeServices'])` filtered by `specialty_id`, `city`, `search` (name, title, subspecialty, service name), and `insurance_only`.

### 3. Availability Computation & Timezone
* **Method:** [app/Http/Controllers/BookingController.php::bookedSlots](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/BookingController.php#L73-L109):
  ```php
  $appointments = Appointment::where('doctor_id', $doctor->id)
      ->whereDate('appointment_date', $validated['date'])
      ->whereNotIn('status', ['cancelled', 'no_show'])
      ->orderBy('appointment_time')
      ->get(['id', 'appointment_time', 'duration_minutes']);
  ```
  Returns `slot_auto_confirm_limit`, `slot_waitlist_limit`, `total_slot_capacity`, and `booked_intervals` mapped with `start_minutes` and `end_minutes`.
* **Timezone Handling:** Uses standard `Carbon::now()` without explicit timezone casting in controller queries. Relies on `config('app.timezone')` (which defaults to `UTC` in `.env.example`).

---

# P1.8 Patient Modeling & Matching

### 1. Patient Creation / Matching at Booking
* In [BookingController.php#L183-L201](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/BookingController.php#L183-L201):
  ```php
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
  }
  ```
* **Matching Criteria:** Matched solely by `phone` via `firstOrCreate`.
* **OTP / Verification:** **NOT FOUND** (No SMS or phone verification gate before booking).
* **Guest Flow:** Creates a full `User` record with random email and random password, auto-logs them in if new (`Auth::login($patient)`).

### 2. Users Table Schema & Unique Keys
* Table: `users`.
* `email`: UNIQUE constraint.
* `phone`: Nullable string, **NO unique constraint in database schema**.

### 3. Appointment Snapshot vs Foreign Key
* `appointments` stores **ONLY foreign key `patient_id`**.
* The `appointments` table does **NOT** store a snapshot of the patient's name, phone, or email. Calling `$appointment->patient->name` references the mutable `users` row.

---

# P1.9 Payments & Pricing Engine

* **`payment_method` Values:** `'at_clinic'`, `'insurance'`, `'online'`, `'cash'` (in walk-in).
* **Payment Gateways (Moyasar, Stripe, Tabby, Tamara):** **NOT FOUND** in `composer.json` or code. When `'online'` is chosen, [BookingController.php#L223](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/BookingController.php#L223) mock-sets `'payment_status' => 'paid'`.
* **Tax Calculation:**
  [BookingController.php#L203-L205](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/BookingController.php#L203-L205):
  ```php
  $discount = ($validated['payment_method'] === 'insurance') ? $fee : 0.00;
  $tax = ($fee - $discount) * 0.15; // 15% VAT
  $total = ($fee - $discount) + $tax;
  ```
* **Cancellation Policy & Automated Refunds:** **NOT FOUND** in codebase.

---

# P1.10 Authentication, Roles & Scoping

### 1. Roles & Permissions Architecture
* Modeled via two complementary mechanisms:
  1. Primary role string on `users.role`: `'admin'`, `'doctor'`, `'receptionist'`, `'patient'`.
  2. Granular Multi-Tenant assignments in `role_assignments` table ([app/Models/RoleAssignment.php](file:///g:/Web/Projects/freelancer/tebbi/app/Models/RoleAssignment.php)).
* **How "Group Admin" is Modeled:**
  A record in `role_assignments` where:
  * `user_id = <id>`
  * `role = 'group_admin'`
  * `scope_type = 'group'`
  * `scope_id = <groups.id>`
  * Evaluated via helper: [app/Models/User.php#L78-L89](file:///g:/Web/Projects/freelancer/tebbi/app/Models/User.php#L78-L89):
    ```php
    public function isGroupAdmin(?int $groupId = null): bool
    ```
* **Scope Resolver:** [app/Services/ScopeResolver.php](file:///g:/Web/Projects/freelancer/tebbi/app/Services/ScopeResolver.php) resolves `accessibleFacilityIds` and `accessibleGroupIds` hierarchically.

### 2. API Token Systems & CORS
* **Laravel Sanctum:** **NOT FOUND** (`composer.json` does not require `laravel/sanctum`, no `HasApiTokens` trait on `User`).
* **Laravel Passport:** **NOT FOUND**.
* **`config/cors.php`:** **NOT FOUND** (default framework configuration).
* **`RateLimiter::for` Definitions:** **NOT FOUND** in `app/Providers` (only standard `RateLimiter::hit/clear/tooManyAttempts` in `LoginRequest.php`).

---

# P1.11 Logging, Exception Handling & PII Surface

* **Logging Configuration:** [config/logging.php](file:///g:/Web/Projects/freelancer/tebbi/config/logging.php) uses `LOG_CHANNEL=stack` (Monolog stream handlers).
* **Exception Handler:** [bootstrap/app.php#L25-L27](file:///g:/Web/Projects/freelancer/tebbi/bootstrap/app.php#L25-L27) contains an empty `withExceptions` configuration block. No custom sanitizers or exception redaction.
* **Sentry / Bugsnag / Telescope / Horizon / Debugbar:** **NOT FOUND**.
* **Request Logging Middleware:** **NOT FOUND**.
* **`failed_jobs` Table:** Present via migration [0001_01_01_000002_create_jobs_table.php](file:///g:/Web/Projects/freelancer/tebbi/database/migrations/0001_01_01_000002_create_jobs_table.php). Stores unencrypted payloads and stack traces.
* **Audit / Activity Log Tables:** **NOT FOUND** (no `activity_log` or `audit_log` tables exist).

---

# P1.12 Routing & Middleware Infrastructure

### 1. `bootstrap/app.php` Routing Setup
File: [bootstrap/app.php](file:///g:/Web/Projects/freelancer/tebbi/bootstrap/app.php#L9-L27)
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

### 2. Route Files in `routes/`
1. `routes/web.php`
2. `routes/auth.php`
3. `routes/console.php`
4. `routes/settings.php`
* **`routes/api.php`:** **NOT FOUND** (file does not exist in `routes/`).

### 3. Existing `/api` Routes in `routes/web.php`
Two public/ajax endpoints are registered inside `routes/web.php` (under the web session middleware stack):
1. Line 25: `Route::get('/api/doctors/{doctor}/booked-slots', [BookingController::class, 'bookedSlots']);`
2. Line 31: `Route::get('/api/queue/{bookingReference}/status', [LiveQueueController::class, 'status']);`

### 4. Catch-All / Fallback Routes
* **Result: NOT FOUND.**
* No `Route::fallback(...)` registered.
* Regex route constraints exist only for group landing slugs at [routes/web.php#L110-L111](file:///g:/Web/Projects/freelancer/tebbi/routes/web.php#L110-L111):
  ```php
  Route::get('/group/{slug}', [GroupLandingController::class, 'show'])
      ->where('slug', '^(?!dashboard$|facilities$|doctors$|specialties$|staff$).+');
  ```

---

# P1.13 Tests & Baseline Verification (Gate 0)

### 1. PHPUnit Configuration & Database
* File: [phpunit.xml](file:///g:/Web/Projects/freelancer/tebbi/phpunit.xml#L20-L34)
* **Testing DB:** In-memory SQLite:
  ```xml
  <env name="APP_ENV" value="testing"/>
  <env name="DB_CONNECTION" value="sqlite"/>
  <env name="DB_DATABASE" value=":memory:"/>
  <env name="CACHE_STORE" value="array"/>
  <env name="SESSION_DRIVER" value="array"/>
  <env name="QUEUE_CONNECTION" value="sync"/>
  <env name="GUPSHUP_ENABLED" value="false"/>
  ```

### 2. Base TestCase & Traits
* File: [tests/TestCase.php](file:///g:/Web/Projects/freelancer/tebbi/tests/TestCase.php#L1-L10)
  ```php
  abstract class TestCase extends BaseTestCase
  {
      //
  }
  ```
* Individual feature tests apply `RefreshDatabase` trait directly within their respective test classes.

### 3. Model Factories
* Directory: `database/factories/`
* `UserFactory.php`: **EXISTS**.
* `AppointmentFactory.php`: **NOT FOUND**.
* `DoctorProfileFactory.php`: **NOT FOUND**.
* `FacilityFactory.php`: **NOT FOUND**.
* Models in tests are assembled directly via Eloquent `::create(...)`.

### 4. Full Test Suite Execution Results (Gate 0 Baseline)
* **Execution Command:** PHPUnit 11.5.57 via testing environment runner.
* **Total Tests Executed:** **122**
* **Total Assertions:** **634**
* **Passed:** **122 (100%)**
* **Failed:** **0**
* **Skipped / Incomplete:** **0**
* **Execution Duration:** **01:26.056**
* **Memory Peak:** **68.00 MB**
* **Status:** **100% GREEN (Baseline Verified)**

### 5. CI Configuration
* File: [.github/workflows/tests.yml](file:///g:/Web/Projects/freelancer/tebbi/.github/workflows/tests.yml)
* Runs on GitHub Actions `ubuntu-latest` on pushes and PRs to `main` and `develop`.

---

# P1.14 Package Dependencies (composer.json)

Extracted from [composer.json](file:///g:/Web/Projects/freelancer/tebbi/composer.json#L11-L27):

### `require`
```json
{
    "php": "^8.2",
    "inertiajs/inertia-laravel": "^2.0",
    "laravel/framework": "^12.0",
    "laravel/tinker": "^2.10.1",
    "tightenco/ziggy": "^2.4"
}
```

### `require-dev`
```json
{
    "fakerphp/faker": "^1.23",
    "laravel/boost": "^2.2",
    "laravel/pail": "^1.2.2",
    "laravel/pint": "^1.18",
    "laravel/sail": "^1.41",
    "mockery/mockery": "^1.6",
    "nunomaduro/collision": "^8.6",
    "phpunit/phpunit": "^11.5.3"
}
```
*(Notice: No Sanctum, No Passport, No Spatie Permission, No payment SDKs, No Sentry).*
