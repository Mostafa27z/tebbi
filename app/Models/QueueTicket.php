<?php

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
        'status',
        'called_at',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'queue_date' => 'date',
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
