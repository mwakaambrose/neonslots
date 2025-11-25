<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class CreateAdminConfigsTable extends Migration
{
    public function up()
    {
        Schema::create('admin_configs', function (Blueprint $table) {
            $table->id();
            $table->float('target_rtp')->default(0.96);
            $table->integer('max_win_multiplier')->default(50);
            $table->json('extra')->nullable();
            $table->timestamps();
        });

        // Insert default row
        DB::table('admin_configs')->insert([
            'target_rtp' => 0.96,
            'max_win_multiplier' => 50,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('admin_configs');
    }
}
