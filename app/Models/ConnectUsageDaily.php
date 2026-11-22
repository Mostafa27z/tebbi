<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConnectUsageDaily extends Model
{
    use HasFactory;

    protected $table = 'connect_usage_daily';

    protected $fillable = [
        'credential_id',
        'usage_date',
        'request_count',
    ];

    protected function casts(): array
    {
        return [
            'usage_date' => 'date',
            'request_count' => 'integer',
        ];
    }

    public function credential(): BelongsTo
    {
        return $this->belongsTo(ConnectCredential::class, 'credential_id');
    }
}
