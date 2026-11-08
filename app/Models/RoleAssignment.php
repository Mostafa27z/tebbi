<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoleAssignment extends Model
{
    use HasFactory;

    protected $table = 'role_assignments';

    protected $fillable = [
        'user_id',
        'role',
        'scope_type',
        'scope_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'scope_id');
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class, 'scope_id');
    }
}

