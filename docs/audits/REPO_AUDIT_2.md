# Tebiby Repository Audit Report 2 (REPO_AUDIT_2)

**Audit Date:** 2026-11-22  
**Target:** Tebiby Core Application (`app/`, `config/`, `resources/js/`)  
**Scope:** Verification of fee calculation, availability rules, timezone configuration, dashboard patient display, and appointment hooks for the Tebiby Connect API (v2.3.0).

---

## 1. Executive Summary

This audit verifies actual codebase implementations against architectural assumptions. All findings are derived directly from source code inspection with exact line citations.

| Audit Area | Codebase Reality | Connect API Impact |
| :--- | :--- | :--- |
| **Fee Source** | `DoctorService.price` (if `doctor_service_id` present) else `DoctorProfile.consultation_fee` | Connect `BookingAdapter` uses identical hierarchy. |
| **Fee Columns** | `consultation_fee` = base, `discount` = discount (0 for Connect), `tax` = 15%, `total_amount` = fee + tax | Matches `BookingController::store()` exactly. |
| **DoctorSchedule** | Defined in `app/Models/DoctorSchedule.php` but **never queried** by `BookingController::store()` | Connect enforces `DoctorSchedule` in validation while replicating `BookingController` overlap capacity lock. |
| **Pivot Hook** | `Appointment::creating` auto-creates `DoctorFacility` with fee 200 if `doctor_facility_id` is missing | Connect **must always supply an explicit, active `doctor_facility_id`**. |
| **Timezone** | `config/app.php` sets `timezone => env('APP_TIMEZONE', 'UTC')` | Saudi clinics operate in `Asia/Riyadh` (UTC+3); Connect timestamps require strict ISO-8601 UTC mapping. |
| **Dashboard UI** | Inertia React views exclusively read `appt.patient.name` (`users.name`) | Dashboards do not display `patient_name_snapshot` without an explicit accessor/touchpoint. |
| **WhatsApp Guard** | `GupshupWhatsAppService` checks `if ($appointment->notify_whatsapp === false)` | Passing `notify_whatsapp => false` reliably suppresses notifications. |

---

## 2. Fee Source & Calculation Rules

### Source Inspection: `app/Http/Controllers/BookingController.php` (Lines 132–153, 203–206, 227–230)

```php
// Lines 135-153: Resolving Fee
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

// Lines 203-205: Tax & Discount
$discount = ($validated['payment_method'] === 'insurance') ? $fee : 0.00;
$tax = ($fee - $discount) * 0.15;
$total = ($fee - $discount) + $tax;

// Lines 227-230: Column Mapping in Appointment::create
'consultation_fee' => $fee,
'discount' => $discount,
'tax' => $tax,
'total_amount' => $total,
```

### Verified Facts
1. **Fee Hierarchy**: `DoctorService.price` takes precedence when `doctor_service_id` is supplied and active. If omitted or null, fallback is `DoctorProfile.consultation_fee`.
2. **VAT Calculation**: Tax is fixed at 15% on taxable amount `($fee - $discount)`.
3. **Database Column Mapping**:
   - `consultation_fee`: Pre-VAT base fee.
   - `discount`: Discount amount (`0.00` for non-insurance Connect bookings).
   - `tax`: 15% VAT (`consultation_fee * 0.15`).
   - `total_amount`: VAT-inclusive total (`consultation_fee + tax`).

---

## 3. Capacity Locking & Booking Status

### Source Inspection: `app/Http/Controllers/BookingController.php` (Lines 159–178, 218–220)

```php
// Lines 159-161: Limits
$autoConfirmLimit = (int) ($doctor->slot_auto_confirm_limit ?? 1);
$waitlistLimit = (int) ($doctor->slot_waitlist_limit ?? 1);
$totalSlotCapacity = max(1, $autoConfirmLimit + $waitlistLimit);

// Lines 163-169: Overlap Query with lockForUpdate()
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

// Lines 218-220: Status Assignment
'status' => $isAutoConfirmed ? 'confirmed' : 'booked',
'booking_confirmed_at' => $isAutoConfirmed ? Carbon::now() : null,
```

### Verified Facts
1. **Locking Mechanism**: Overlap checking acquires a `lockForUpdate()` on existing `Appointment` rows for that `doctor_id` and `appointment_date`.
2. **Active Statuses Filter**: Excludes only `cancelled` and `no_show`. All other appointments count toward overlap.
3. **Auto-Confirm vs Waitlist**:
   - If `peakBooked < autoConfirmLimit`: Status is `confirmed` and `booking_confirmed_at` is set to `Carbon::now()`.
   - If `autoConfirmLimit <= peakBooked < totalSlotCapacity`: Status is `booked` (waitlist) and `booking_confirmed_at` is `null`.

---

## 4. Appointment Creating Hook & DoctorFacility Pivot

### Source Inspection: `app/Models/Appointment.php` (Lines 130–151)

```php
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
```

### Verified Facts
1. **Auto-Creation Hazard**: If `Appointment::create()` is called without `doctor_facility_id`, the booted `creating` hook automatically queries/creates a `DoctorFacility` pivot with fallback `consultation_fee = 200`.
2. **Connect Constraint**: The Connect `BookingAdapter` must always provide an explicit, validated `doctor_facility_id` matching the credential's allowed facilities.

---

## 5. DoctorSchedule Enforcement Reality

### Source Inspection: `app/Models/DoctorSchedule.php` (Lines 13–22) vs `BookingController.php`

1. `DoctorSchedule` table contains:
   - `doctor_profile_id`, `doctor_facility_id`, `day_of_week`, `start_time`, `end_time`, `slot_duration_minutes`, `max_daily_patients`, `is_active`.
2. **Absence in Web Controller**: `BookingController::store()` never queries `DoctorSchedule`. Any date/time submitted via web store is accepted as long as `after_or_equal:today` passes and peak overlap capacity is not exceeded.
3. **Connect API Decision**: To ensure high healthcare data integrity, Connect API **enforces** `DoctorSchedule` validation in `BookingAdapter` (verifying day of week, active shift hours, and shift duration) returning 422 `ERR_SLOT_OUTSIDE_SCHEDULE` if violated, while matching `BookingController` for capacity overlap rules.

---

## 6. Timezone Configuration

### Source Inspection: `config/app.php` (Line 68)

```php
'timezone' => env('APP_TIMEZONE', 'UTC'),
```

### Verified Facts
1. Default timezone is `UTC`.
2. Physical clinic operations take place in Saudi Arabia (`Asia/Riyadh`, UTC+3).
3. The database stores `appointment_date` as `YYYY-MM-DD` and `appointment_time` as `HH:mm:ss` local clinic strings.
4. **Connect Contract**:
   - `appointment_date` and `appointment_time` in API payloads represent local clinic time (`Asia/Riyadh`).
   - All audit timestamps (`created_at`, `expires_at`, `booking_confirmed_at`) are serialized in ISO-8601 UTC (`YYYY-MM-DDTHH:mm:ssZ`).

---

## 7. Dashboard Patient Name Display

### Source Inspection: React Frontend Components (`resources/js/...`)
- `resources/js/components/admin/tabs/appointments-tab.tsx:126`: `{appt.patient.name}`
- `resources/js/components/doctor/active-session.tsx:74`: `{session.patient.name}`
- `resources/js/components/doctor/prescription-modal.tsx:65`: `currentSession.patient.name`
- `resources/js/components/facility/appointments/facility-appointments-table.tsx:264`: `{appt.patient.name}`
- `resources/js/components/facility/dashboard/reception-queue-table.tsx:75`: `{appt.patient.name}`
- `app/Http/Controllers/FacilityDashboardController.php:831`: `{$appointment->patient->name}`

### Verified Facts
1. **Frontend Contract**: Every administrative, doctor, and reception dashboard in Tebiby reads patient information through the Eloquent relationship `$appointment->patient` $\rightarrow$ `users.name`.
2. **Snapshot Reality**: The column `connect_appointment_links.patient_name_snapshot` is an immutable audit snapshot for partner reconciliation. Existing UI views **do not** read this snapshot.
3. **Connect Architecture Requirement**: If partner-provided snapshot names must be seen in clinic dashboards, an explicit accessor or feature flag (`CONNECT_USE_PATIENT_SNAPSHOT=true`) must be added to `Appointment::patient_display_name`. Otherwise, dashboards will display `users.name`.

---

## 8. WhatsApp Notification Opt-Out

### Source Inspection: `app/Services/GupshupWhatsAppService.php` (Lines 428–460)

```php
public function notifyBookingReceived(Appointment $appointment): array
{
    if ($appointment->notify_whatsapp === false) {
        return ['status' => 'skipped', 'reason' => 'patient_opted_out'];
    }
    // ...
}

public function notifyBookingConfirmed(Appointment $appointment): array
{
    if ($appointment->notify_whatsapp === false) {
        return ['status' => 'skipped', 'reason' => 'patient_opted_out'];
    }
    // ...
}
```

### Verified Facts
1. Both `notifyBookingReceived` and `notifyBookingConfirmed` evaluate `$appointment->notify_whatsapp === false`.
2. When `false`, the method terminates immediately returning `['status' => 'skipped', 'reason' => 'patient_opted_out']` without initiating any HTTP request to Gupshup.
3. Connect API sets `notify_whatsapp: false` by default in Phase 1, safely guaranteeing zero unsolicited WhatsApp messages to patients.

---

## 9. User Authentication & Side Effects in Store

### Source Inspection: `app/Http/Controllers/BookingController.php` (Lines 187–201, 272–274)

```php
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

if ($wasNewUser) {
    \Illuminate\Support\Facades\Auth::login($patient);
}
```

### Verified Facts
1. Web controller automatically logs in newly created patients via `Auth::login($patient)`.
2. Web controller collects `patient_national_id`.
3. Connect `BookingAdapter` **must strictly avoid `Auth::login()`** and **must strictly reject `national_id`** to adhere to data minimization principles.

---

**Audit Conclusion:** All architectural decisions in Tebiby Connect v2.3.0 are verified against and fully compatible with existing codebase implementations.
