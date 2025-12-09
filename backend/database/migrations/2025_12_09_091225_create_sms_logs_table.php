<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sms_logs', function (Blueprint $table) {
            $table->id();
            $table->string('phone_number');
            $table->text('message');
            $table->string('message_id')->nullable();
            $table->string('status');
            $table->integer('status_code')->nullable();
            $table->decimal('cost', 10, 4)->nullable();
            $table->string('currency', 3)->nullable();
            $table->integer('message_parts')->default(1);
            $table->string('type')->default('general'); // e.g., 'otp', 'transaction', 'general'
            $table->json('response_data')->nullable();
            $table->timestamps();
            
            $table->index('phone_number');
            $table->index('type');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_logs');
    }
};
