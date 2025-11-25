<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminConfig extends Model
{
    use HasFactory;

    protected $table = 'admin_configs';
    protected $guarded = [];
    protected $casts = [
        'extra' => 'array',
    ];

    public static function singleton(): AdminConfig
    {
        return static::first();
    }
}
