<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DusuPayService
{
    const DUSU_PAY_ENDPOINT = "https://api.dusupay.com/v1/collections";
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.dusupay.api_key');
    }

    /**
     * Create a collection request (deposit)
     *
     * @param string $phone Phone number in international format (e.g., +256XXXXXXXXX)
     * @param float $amount Amount in USD
     * @return array API response
     */
    public function createCollection(string $phone, float $amount): array
    {
        try {
            // Determine provider based on phone number
            $provider_id = $this->getProviderFromPhone($phone);

            $request_payload = [
                'api_key' => $this->apiKey,
                'currency' => 'USD',
                'amount' => $amount,
                'method' => 'MOBILE_MONEY',
                'provider_id' => $provider_id,
                'account_number' => $phone,
                'merchant_reference' => 'deposit_' . uniqid(),
                'narration' => 'Neon Slots Deposit',
            ];

            Log::info('DusuPayService: Creating collection', [
                'phone' => $phone,
                'amount' => $amount,
                'provider' => $provider_id,
            ]);

            $response = Http::acceptJson()
                ->post(self::DUSU_PAY_ENDPOINT, $request_payload);

            dd($response);

            $statusCode = $response->status();
            $body = $response->json();

            if ($statusCode >= 400) {
                Log::error('DusuPayService: Collection request failed', [
                    'phone' => $phone,
                    'status' => $statusCode,
                    'response' => $body,
                ]);
            } else {
                Log::info('DusuPayService: Collection request successful', [
                    'phone' => $phone,
                    'response' => $body,
                ]);
            }

            return [
                'success' => $statusCode >= 200 && $statusCode < 300,
                'status_code' => $statusCode,
                'data' => $body,
            ];
        } catch (\Exception $e) {
            Log::error('DusuPayService: Exception during collection', [
                'phone' => $phone,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'status_code' => 0,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Determine provider ID based on phone number
     *
     * @param string $phone Phone number
     * @return string Provider ID (mtn_ug or airtel_ug)
     */
    protected function getProviderFromPhone(string $phone): string
    {
        // Remove + and spaces for comparison
        $cleaned = preg_replace('/[^\d]/', '', $phone);

        // MTN Uganda: 25677, 25678
        if (str_starts_with($cleaned, '25677') || str_starts_with($cleaned, '25678')) {
            return 'mtn_ug';
        }

        // Airtel Uganda: 25670, 25675
        if (str_starts_with($cleaned, '25670') || str_starts_with($cleaned, '25675')) {
            return 'airtel_ug';
        }

        // Default to MTN if not recognized
        return 'mtn_ug';
    }
}