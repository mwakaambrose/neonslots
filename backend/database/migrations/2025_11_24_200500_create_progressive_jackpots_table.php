<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProgressiveJackpotsTable extends Migration
{
    public function up()
    {
        Schema::create('progressive_jackpots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->json('machine_ids')->nullable();
            $table->bigInteger('current_value')->default(0);
            $table->float('contribution_rate')->default(0.0);
            $table->timestamp('last_payout_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('progressive_jackpots');
    }
}
