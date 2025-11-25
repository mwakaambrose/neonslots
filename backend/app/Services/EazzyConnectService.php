<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class EazzyConnectService
{
    public function sendOtp(string $phone, string $code)
    {
        $message = "Your OTP code is: $code";
        return $this->sendSms($phone, $message);
    }
    protected $apiKey;
    protected $apiUrl;

    public function __construct()
    {
        $this->apiKey = config('services.ezzyconnect.api_key');
        $this->apiUrl = config('services.ezzyconnect.api_url');
    }

    public function getAccountBalance()
    {
        $response = Http::withHeaders([
            'apiKey' => $this->apiKey,
            'Accept' => 'application/vnd.eazzyconnect.v1',
            'Content-Type' => 'application/json',
        ])->get("{$this->apiUrl}/wallet/account-balance");

        return $response->json();
    }

    public function sendSms(string $phoneNumber, string $message)
    {
        $response = Http::withHeaders([
            'apiKey' => $this->apiKey,
            'Accept' => 'application/vnd.eazzyconnect.v1',
        ])->asForm()->post("{$this->apiUrl}/sms/send", [
            'phone_number' => $phoneNumber,
            'message' => $message,
        ]);

        return $response->json();
    }

    public function sendBulkSms(array $phoneNumbers, string $message)
    {
        $response = Http::withHeaders([
            'apiKey' => $this->apiKey,
            'Accept' => 'application/vnd.eazzyconnect.v1',
        ])->asForm()->post("{$this->apiUrl}/sms/bulk-send", [
            'phone_numbers' => implode(',', $phoneNumbers),
            'message' => $message,
        ]);

        return $response->json();
    }
}
