<?php

namespace App\Jobs;

use App\Services\EazzyConnectService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendOtpSmsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $phone;
    public $code;

    public function __construct($phone, $code)
    {
        $this->phone = $phone;
        $this->code = $code;
    }

    public function handle()
    {
        try {
            $service = new EazzyConnectService();
            $result = $service->sendOtp($this->phone, $this->code);
            
            if (isset($result['error'])) {
                Log::error('SendOtpSmsJob: Failed to send OTP via EazzyConnect', [
                    'phone' => $this->phone,
                    'error' => $result['error'],
                    'message' => $result['message'] ?? null,
                ]);
                // Don't throw exception - allow job to complete to avoid retry loops
                // The OTP is still stored in database, user can use it
            } else {
                Log::info('SendOtpSmsJob: OTP sent successfully via EazzyConnect', [
                    'phone' => $this->phone,
                    'response' => $result,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('SendOtpSmsJob: Exception while sending OTP', [
                'phone' => $this->phone,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Don't throw - allow job to complete
        }
    }
}
