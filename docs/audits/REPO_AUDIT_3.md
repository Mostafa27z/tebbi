# Tebiby Repository Audit Report 3 (REPO_AUDIT_3)

**Audit Date:** 2026-11-22  
**Target:** Tebiby Core Application (`app/`, `config/`, `resources/js/`, `.github/workflows/`)  
**Scope:** Investigation of slot generation, queue live status, WhatsApp lifecycle coverage, authorization scopes, CI runner, phone patterns, and past-date timezone comparisons.

---

## 1. Slot Generation & Availability Logic (Backend vs Frontend)

### Code Findings
* **Location of Slot Generation:** Bookable slots are **hardcoded in the React frontend**, defined in:
  `resources/js/components/tebiby/booking/types.ts` (Lines 97–120):
  ```typescript
  export const MORNING_SLOTS: string[] = [
      '09:00 ص', '09:30 ص', '10:00 ص', '10:30 ص',
      '11:00 ص', '11:30 ص', '12:00 م', '12:30 م',
  ];
  export const EVENING_SLOTS: string[] = [
      '04:00 م', '04:30 م', '05:00 م', '05:30 م',
      '06:00 م', '06:30 م', '07:00 م', '07:30 م',
      '08:00 م', '08:30 م', '09:00 م',
  ];
  ```
  Total = 19 static 30-minute candidate slots per day.
* **Backend Endpoint:**
  `app/Http/Controllers/BookingController.php` (Lines 73–109):
  ```php
  public function bookedSlots(Request $request, DoctorProfile $doctor): JsonResponse
  {
      $validated = $request->validate(['date' => 'required|date']);
      $appointments = Appointment::where('doctor_id', $doctor->id)
          ->whereDate('appointment_date', $validated['date'])
          ->whereNotIn('status', ['cancelled', 'no_show'])
          ->orderBy('appointment_time')
          ->get(['id', 'appointment_time', 'duration_minutes']);
      // Returns: date, slot_auto_confirm_limit, slot_waitlist_limit, total_slot_capacity, booked_intervals
  }
  ```
  The backend **does not generate slots**. It only returns existing booked intervals and capacity limits.
* **Slot Evaluation Logic:**
  `resources/js/components/tebiby/booking/types.ts` (Lines 166–205):
  The frontend function `getSlotAvailability(slotStr, durationMinutes, bookedIntervals, autoConfirmLimit, waitlistLimit)` evaluates each of the 19 static slots against `booked_intervals` to classify it as `available`, `waitlist`, or `full`.
* **Is `DoctorSchedule` used anywhere to filter slots?**
  **NOT FOUND / NO.** Neither the backend (`BookingController`) nor the frontend (`booking-modal.tsx`, `types.ts`) queries or references `DoctorSchedule`.

---

## 2. LiveQueueController::status, QueueTicket Model & pushFacilityLiveEvent

### 1. `LiveQueueController::status` in Full
Source: `app/Http/Controllers/LiveQueueController.php` (Lines 179–203):
```php
public function status(Request $request, string $bookingReference): JsonResponse
{
    $appointment = Appointment::with(['queueTicket', 'doctor.user'])->where('booking_reference', $bookingReference)->firstOrFail();

    $this->authorizeQueueAccess($request, $appointment);

    $ticket = $appointment->queueTicket;
    if (! $ticket) {
        return response()->json([
            'ticketNumber' => 1,
            'currentServingNumber' => 1,
            'patientsAhead' => 0,
            'estimatedWaitMinutes' => 0,
            'status' => 'waiting',
            'appointmentStatus' => $appointment->status,
            'isYourTurn' => false,
            'isCalled' => false,
            'delayMinutes' => (int) ($appointment->delay_minutes ?? 0),
            'delayReason' => $appointment->delay_reason,
            'minutesRemaining' => 0,
        ]);
    }

    return response()->json($this->buildQueuePayload($appointment, $ticket));
}
```

### 2. `QueueTicket` Model in Full
Source: `app/Models/QueueTicket.php` (Lines 1–69):
```php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QueueTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'doctor_facility_id',
        'queue_date',
        'ticket_number',
        'current_serving_number',
        'estimated_wait_minutes',
        'delay_minutes',
        'call_count',
        'last_called_at',
        'status',
        'called_at',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'queue_date' => 'date',
            'estimated_wait_minutes' => 'integer',
            'delay_minutes' => 'integer',
            'call_count' => 'integer',
            'last_called_at' => 'datetime',
            'called_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (QueueTicket $ticket) {
            if ($ticket->appointment_id) {
                $appointment = Appointment::find($ticket->appointment_id);
                if ($appointment) {
                    if (empty($ticket->doctor_facility_id)) {
                        $ticket->doctor_facility_id = $appointment->doctor_facility_id;
                    }
                    if (empty($ticket->queue_date)) {
                        $ticket->queue_date = $appointment->appointment_date;
                    }
                }
            }
        });
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function doctorFacility(): BelongsTo
    {
        return $this->belongsTo(DoctorFacility::class);
    }
}
```

### 3. `DoctorDashboardController::pushFacilityLiveEvent` in Full
Source: `app/Http/Controllers/DoctorDashboardController.php` (Lines 19–44):
```php
public static function pushFacilityLiveEvent(int $facilityId, array $eventData): void
{
    if ($facilityId <= 0) {
        return;
    }

    $cacheKey = "facility_live_events_{$facilityId}";
    $events = Cache::get($cacheKey, []);
    if (! is_array($events)) {
        $events = [];
    }

    // Keep only events from the last 15 minutes
    $cutoff = Carbon::now()->subMinutes(15)->getTimestampMs();
    $events = array_values(array_filter($events, fn ($e) => ($e['timestamp_ms'] ?? 0) >= $cutoff));

    array_unshift($events, array_merge([
        'id' => uniqid('evt_', true),
        'created_at' => Carbon::now()->toIso8601String(),
        'timestamp_ms' => Carbon::now()->getTimestampMs(),
    ], $eventData));

    // Keep max 15 recent events
    $events = array_slice($events, 0, 15);
    Cache::put($cacheKey, $events, now()->addMinutes(30));
}
```

---

## 3. GupshupWhatsAppService Lifecycle Coverage & Log PII

### 1. Verification of all 8 `notify*` Methods
Source: `app/Services/GupshupWhatsAppService.php` (Lines 424–632):
* **Template 1 (`notifyBookingReceived`, Line 430):** Checks `if ($appointment->notify_whatsapp === false) return ['status' => 'skipped', 'reason' => 'patient_opted_out'];`
* **Template 2 (`notifyBookingConfirmed`, Line 456):** Checks `if ($appointment->notify_whatsapp === false) return ['status' => 'skipped', 'reason' => 'patient_opted_out'];`
* **Template 3 (`notifyArrivalConfirmed`, Line 482):** Checks `if ($appointment->notify_whatsapp === false) return ['status' => 'skipped', 'reason' => 'patient_opted_out'];`
* **Template 4 (`notifyTurnApproaching`, Line 507):** Checks `if ($appointment->notify_whatsapp === false) return ['status' => 'skipped', 'reason' => 'patient_opted_out'];`
* **Template 5 (`notifyPatientCalled`, Line 531):** Checks `if ($appointment->notify_whatsapp === false) return ['status' => 'skipped', 'reason' => 'patient_opted_out'];`
* **Template 6 (`notifyConsultationCompleted`, Line 555):** Checks `if ($appointment->notify_whatsapp === false) return ['status' => 'skipped', 'reason' => 'patient_opted_out'];`
* **Template 7 (`notifyAppointmentCancelled`, Line 580):** Checks `if ($appointment->notify_whatsapp === false) return ['status' => 'skipped', 'reason' => 'patient_opted_out'];`
* **Template 8 (`notifyAppointmentDelayed`, Line 605):** Checks `if ($appointment->notify_whatsapp === false) return ['status' => 'skipped', 'reason' => 'patient_opted_out'];`

**Fact:** **All 8 notification methods** rigorously check `$appointment->notify_whatsapp === false` at their very first line. Setting `notify_whatsapp: false` guarantees that 100% of WhatsApp notifications are skipped.

### 2. Where is `GUPSHUP_ENABLED` Checked?
* `sendTemplateMessage` (`GupshupWhatsAppService.php#L166`):
  `if (!config('gupshup.enabled', false)) return ['status' => 'skipped', 'reason' => 'gupshup_disabled'];`
* `sendSessionTextMessage` (`GupshupWhatsAppService.php#L256`):
  `if (!config('gupshup.enabled', false)) return ['status' => 'skipped', 'reason' => 'gupshup_disabled'];`

### 3. Does any `Log::` call write phone/name/params?
* **Phone number logging:** **YES.** Lines 209, 224, and 238 pass `'destination' => $destination` directly into `Log::info`, `Log::warning`, and `Log::error`.
* **Patient Name & Template Params:** **NO.** Neither `$patientName` nor `$params` are logged directly; however, the raw Gupshup HTTP response body (`'response' => $data`) is logged.

---

## 4. ScopeResolver, RoleAssignment & User::isGroupAdmin

### 1. `ScopeResolver` in Full
Source: `app/Services/ScopeResolver.php` (Lines 10–103):
* `accessibleFacilityIds(User $user)`: Resolves facility IDs accessible to the user via SuperAdmin status (`Facility::pluck('id')`), group administrative role (`group_admin`), direct facility roles (`facility_admin`, `receptionist`), or active doctor facility assignments (`doctorProfile->doctorFacilities`).
* `accessibleGroupIds(User $user)`: Resolves group IDs accessible via SuperAdmin or `roleAssignments()->where('role', 'group_admin')->where('scope_type', 'group')`.
* `canManageFacility(User $user, int $facilityId)`: Returns `true` if SuperAdmin, or if `$user->isGroupAdmin($facility->group_id)`, or if direct `facility_admin` exists for `$facilityId`.
* `canManageGroup(User $user, int $groupId)`: Returns `true` if SuperAdmin or `$user->isGroupAdmin($groupId)`.

### 2. `RoleAssignment` in Full
Source: `app/Models/RoleAssignment.php` (Lines 1–37):
* Columns: `user_id`, `role` (`group_admin`, `facility_admin`, `receptionist`), `scope_type` (`group`, `facility`), `scope_id` (foreign ID to `groups` or `facilities`).

### 3. `User::isGroupAdmin` in Full
Source: `app/Models/User.php` (Lines 78–89):
```php
public function isGroupAdmin(?int $groupId = null): bool
{
    $assignments = $this->getCachedRoleAssignments()
        ->where('role', 'group_admin')
        ->where('scope_type', 'group');

    if ($groupId !== null) {
        $assignments = $assignments->where('scope_id', $groupId);
    }

    return $assignments->isNotEmpty();
}
```

---

## 5. CI Workflow & Pest in composer.lock

### 1. `.github/workflows/tests.yml` in Full
```yaml
name: tests

on:
  push:
    branches:
      - develop
      - main
  pull_request:
    branches:
      - develop
      - main

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: 8.4
          tools: composer:v2
          coverage: xdebug

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install Node Dependencies
        run: npm ci

      - name: Build Assets
        run: npm run build

      - name: Create SQLite Database
        run: touch database/database.sqlite

      - name: Install Dependencies
        run: composer install --no-interaction --prefer-dist --optimize-autoloader

      - name: Copy Environment File
        run: cp .env.example .env

      - name: Generate Application Key
        run: php artisan key:generate

      - name: Tests
        run: ./vendor/bin/phpunit
```

### 2. Is `pestphp/pest` in `composer.lock`?
* `composer.json` declares: `"phpunit/phpunit": "^11.5.3"`.
* `pestphp/pest` is **NOT installed** as a project package or root dependency. References in `composer.lock` are strictly from `suggest` metadata of optional packages (e.g. `laravel/pail`).
* **Verified Test Runner:** PHPUnit 11 (`./vendor/bin/phpunit`).

---

## 6. Patient Phone Validation & Database Patterns

### 1. Web Controller Validation & Normalization
* `BookingController.php#L118`:
  ```php
  'patient_phone' => 'required|string|max:20',
  ```
* No regex rule is applied in `BookingController::store()`.
* No normalization is executed before account lookup: `$phone = $validated['patient_phone']; User::firstOrCreate(['phone' => $phone], ...)`. Raw user input is saved directly.

### 2. Distinct Phone Patterns in Database (`users.phone`)
Queried directly against active database:
1. `+966XXXXXXXXX` (13 characters, e.g. `+9665XXXXXXXX`, 33 records).
2. `+201XXXXXXXXX` (13 characters, e.g. `+2010XXXXXXXX`, 3 records).
3. `+966XXXXXXXXXXXX` (17 characters, 1 record).

---

## 7. `appointments.facility_id` Assumptions & Legacy NULLs

### 1. Database State
* Total appointments: 92.
* Appointments with `facility_id IS NULL`: **0**.
* Appointments with `doctor_facility_id IS NULL`: **0**.
*(All existing appointments have non-null facility references because `Appointment::creating` auto-fills them).*

### 2. Code Handling
Controllers treat `facility_id` defensively and **never assume non-null**:
* `DoctorDashboardController.php#L361`: `$facilityId = (int) ($nextAppt->facility_id ?: $doctor->clinic_id ?: 0);`
* `DoctorDashboardController.php#L435`: `$facilityId = (int) ($appointment->facility_id ?: $docModel?->clinic_id ?: 0);`
* `FacilityDashboardController.php#L670`: `$facilityId = $appointment->facility_id ?? 0;`
* `LiveQueueController.php#L22`: `$facilityId = $appointment->facility_id ?? $appointment->doctor?->clinic_id ?? 0;`

---

## 8. Past-Date Checks & Timezone Comparisons

### Code Findings
* **Web Booking (`BookingController::store`):**
  Only validates `'appointment_date' => 'required|date'`. It does **not** perform any past-date validation against `now()`.
* **Live Queue (`LiveQueueController::buildQueuePayload`):**
  `Carbon::parse($apptDateStr . ' ' . $appointment->appointment_time)` is compared against `Carbon::now()`.
* **Timezone Conflict:**
  `config('app.timezone')` is `'UTC'`. Without specifying `'Asia/Riyadh'`, `Carbon::now()` evaluates in UTC while appointment time strings represent Saudi Arabia local time.
* **Connect Specification Rule:**
  Connect API validation must explicitly parse and compare against `Asia/Riyadh`:
  ```php
  Carbon::parse("{$date} {$time}", 'Asia/Riyadh')->isPast()
  ```
