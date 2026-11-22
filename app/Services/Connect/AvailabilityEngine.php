<?php

namespace App\Services\Connect;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\DoctorSchedule;
use App\Models\DoctorService;
use App\Models\Facility;
use Carbon\Carbon;

class AvailabilityEngine
{
    private function timeToMinutes(string $time24): int
    {
        $parts = explode(':', $time24);
        $hours = (int) ($parts[0] ?? 0);
        $minutes = (int) ($parts[1] ?? 0);
        return ($hours * 60) + $minutes;
    }

    private function minutesToTime(int $minutes): string
    {
        $hours = intdiv($minutes, 60);
        $mins = $minutes % 60;
        return sprintf('%02d:%02d', $hours, $mins);
    }

    /**
     * Compute maximum simultaneous overlapping bookings inside [newStart, newEnd).
     */
    public function maxConcurrentOverlaps(iterable $appointments, int $newStart, int $newEnd, int $fallbackDuration): int
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
                return $a[1] <=> $b[1];
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

    /**
     * Compute available slots for doctor at facility on target date.
     */
    public function getAvailableSlots(
        DoctorProfile $doctor,
        Facility $facility,
        Carbon $date,
        ?DoctorService $service = null
    ): array {
        $nowRiyadh = Carbon::now('Asia/Riyadh');
        $dateRiyadh = $date->copy()->setTimezone('Asia/Riyadh');

        // Check date is not in the past
        if ($dateRiyadh->toDateString() < $nowRiyadh->toDateString()) {
            return [
                'doctor_id' => $doctor->id,
                'facility_id' => $facility->id,
                'date' => $dateRiyadh->toDateString(),
                'slots' => [],
                'message' => 'Requested date is in the past.',
            ];
        }

        $dayOfWeek = $dateRiyadh->dayOfWeek; // 0 = Sunday, 1 = Monday...

        $schedule = DoctorSchedule::where('doctor_profile_id', $doctor->id)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->first();

        if (! $schedule) {
            return [
                'doctor_id' => $doctor->id,
                'facility_id' => $facility->id,
                'date' => $dateRiyadh->toDateString(),
                'slots' => [],
                'message' => 'No active schedule for doctor on selected day.',
            ];
        }

        $durationMinutes = $service ? (int) $service->duration_minutes : (int) ($schedule->slot_duration_minutes ?: 20);
        $autoConfirmLimit = (int) ($doctor->slot_auto_confirm_limit ?? 1);
        $waitlistLimit = (int) ($doctor->slot_waitlist_limit ?? 1);
        $totalSlotCapacity = max(1, $autoConfirmLimit + $waitlistLimit);

        $startMinutes = $this->timeToMinutes(substr($schedule->start_time, 0, 5));
        $endMinutes = $this->timeToMinutes(substr($schedule->end_time, 0, 5));

        $existingAppts = Appointment::where('doctor_id', $doctor->id)
            ->where('facility_id', $facility->id)
            ->whereDate('appointment_date', $dateRiyadh->toDateString())
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->get(['id', 'appointment_time', 'duration_minutes']);

        $slots = [];
        $currentStart = $startMinutes;

        while ($currentStart + $durationMinutes <= $endMinutes) {
            $currentEnd = $currentStart + $durationMinutes;
            $timeString = $this->minutesToTime($currentStart);

            // If date is today, check if slot start time has already passed in Riyadh time
            $isPastToday = ($dateRiyadh->toDateString() === $nowRiyadh->toDateString())
                && ($currentStart <= ($nowRiyadh->hour * 60 + $nowRiyadh->minute));

            $overlap = $this->maxConcurrentOverlaps($existingAppts, $currentStart, $currentEnd, $durationMinutes);

            if ($isPastToday) {
                $status = 'past_time';
                $available = false;
                $canAutoConfirm = false;
                $remainingCapacity = 0;
            } elseif ($overlap >= $totalSlotCapacity) {
                $status = 'fully_booked';
                $available = false;
                $canAutoConfirm = false;
                $remainingCapacity = 0;
            } elseif ($overlap < $autoConfirmLimit) {
                $status = 'available_instant';
                $available = true;
                $canAutoConfirm = true;
                $remainingCapacity = $totalSlotCapacity - $overlap;
            } else {
                $status = 'available_waitlist';
                $available = true;
                $canAutoConfirm = false;
                $remainingCapacity = $totalSlotCapacity - $overlap;
            }

            $slots[] = [
                'time' => $timeString,
                'formatted_time' => Carbon::createFromFormat('H:i', $timeString)->format('h:i A'),
                'duration_minutes' => $durationMinutes,
                'status' => $status,
                'is_available' => $available,
                'can_auto_confirm' => $canAutoConfirm,
                'remaining_capacity' => $remainingCapacity,
            ];

            $currentStart += $durationMinutes;
        }

        return [
            'doctor_id' => $doctor->id,
            'facility_id' => $facility->id,
            'date' => $dateRiyadh->toDateString(),
            'slot_auto_confirm_limit' => $autoConfirmLimit,
            'slot_waitlist_limit' => $waitlistLimit,
            'slots' => $slots,
        ];
    }
}

