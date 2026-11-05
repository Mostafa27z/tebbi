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
            'called_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}

