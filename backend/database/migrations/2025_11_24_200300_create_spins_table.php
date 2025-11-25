<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSpinsTable extends Migration
{
    public function up()
    {
        Schema::create('spins', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('player_id')->index();
            $table->uuid('machine_id')->index()->nullable();
            $table->bigInteger('bet_credits');
            $table->json('result_payload');
            $table->bigInteger('payout_credits')->default(0);
            $table->string('server_nonce')->nullable();
            $table->string('server_signature')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('spins');
    }
}
