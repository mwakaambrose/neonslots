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
        try {
            $response = Http::timeout(10)->withHeaders([
                'apiKey' => $this->apiKey,
                'Accept' => 'application/vnd.eazzyconnect.v1',
                'Content-Type' => 'application/json',
            ])->get("{$this->apiUrl}/wallet/account-balance");

            if (!$response->successful()) {
                \Illuminate\Support\Facades\Log::error('EazzyConnect: Failed to get balance', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return ['error' => 'Failed to fetch balance', 'status' => $response->status()];
            }

            return $response->json();
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            \Illuminate\Support\Facades\Log::error('EazzyConnect: Connection timeout', ['error' => $e->getMessage()]);
            return ['error' => 'Connection timeout', 'message' => $e->getMessage()];
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('EazzyConnect: Error getting balance', ['error' => $e->getMessage()]);
            return ['error' => 'Service error', 'message' => $e->getMessage()];
        }
    }

    public function sendSms(string $phoneNumber, string $message)
    {
        try {
            $response = Http::timeout(10)->withHeaders([
                'apiKey' => $this->apiKey,
                'Accept' => 'application/vnd.eazzyconnect.v1',
            ])->asForm()->post("{$this->apiUrl}/sms/send", [
                'phone_number' => $phoneNumber,
                'message' => $message,
            ]);

            if (!$response->successful()) {
                \Illuminate\Support\Facades\Log::error('EazzyConnect: Failed to send SMS', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return ['error' => 'Failed to send SMS', 'status' => $response->status()];
            }

            return $response->json();
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            \Illuminate\Support\Facades\Log::error('EazzyConnect: SMS connection timeout', ['error' => $e->getMessage()]);
            return ['error' => 'Connection timeout', 'message' => $e->getMessage()];
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('EazzyConnect: Error sending SMS', ['error' => $e->getMessage()]);
            return ['error' => 'Service error', 'message' => $e->getMessage()];
        }
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
