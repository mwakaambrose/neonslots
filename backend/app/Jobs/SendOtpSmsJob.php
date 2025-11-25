<?php

namespace App\Jobs;

use App\Services\EazzyConnectService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

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
        $service = new EazzyConnectService();
        $service->sendOtp($this->phone, $this->code);
    }
}
