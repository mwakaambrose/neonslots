<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

class Player extends Authenticatable
{
    use HasApiTokens, HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'players';
    protected $guarded = [];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    public function wallet()
    {
        return $this->hasOne(Wallet::class, 'player_id');
    }
}
