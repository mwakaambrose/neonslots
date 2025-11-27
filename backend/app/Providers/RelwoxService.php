<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;

class RelwoxService
{
    private string $baseUrl;
    private string $apiKey;
    private string $accountNo;
    private string $webhookSecret;

    public function __construct()
    {
        $this->baseUrl = config('services.relwox.base_url', 'https://payments.relworx.com/api');
        $this->apiKey = config('services.relwox.api_key');
        $this->accountNo = config('services.relwox.account_no');
        $this->webhookSecret = config('services.relwox.webhook_secret');
    }


    ///////////////////////   MOBILE MONEY   ///////////////////

    /**
     * Request payment from a mobile money subscriber (Collection)
     *
     * @param string $phoneNumber International format phone number (e.g., +256701345678)
     * @param float $amount Amount to collect
     * @param string $currency Currency code (e.g., UGX)
     * @param string|null $description Optional description
     * @return array
     * @throws Exception
     */
    public function requestPayment(string $phoneNumber, float $amount, string $currency = 'UGX', ?string $description = null): array
    {
        try {
            $payload = [
                'account_no' => $this->accountNo,
                'reference' => $this->generateReference(),
                'msisdn' => $phoneNumber,
                'currency' => $currency,
                'amount' => $amount,
            ];

            if ($description) {
                $payload['description'] = $description;
            }

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/vnd.relworx.v2',
                'Authorization' => 'Bearer ' . $this->apiKey
            ])->post("{$this->baseUrl}/mobile-money/request-payment", $payload);

            if ($response->successful()) {
                return $response->json();
            }

            throw new Exception("Failed to request payment: " . $response->body());
        } catch (Exception $e) {
            Log::error("Relwox payment request error", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => $payload
            ]);
            throw $e;
        }
    }

    /**
     * Send payment to a mobile money subscriber (Withdrawal)
     *
     * @param string $phoneNumber International format phone number (e.g., +256701345678)
     * @param float $amount Amount to send
     * @param string $currency Currency code (e.g., UGX)
     * @param string|null $description Optional description
     * @return array
     * @throws Exception
     */
    public function sendPayment(string $phoneNumber, float $amount, string $currency = 'UGX', ?string $description = null): array
    {
        try {
            $payload = [
                'account_no' => $this->accountNo,
                'reference' => $this->generateReference(),
                'msisdn' => $phoneNumber,
                'currency' => $currency,
                'amount' => $amount,
            ];

            if ($description) {
                $payload['description'] = $description;
            }

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/vnd.relworx.v2',
                'Authorization' => 'Bearer ' . $this->apiKey
            ])->post("{$this->baseUrl}/mobile-money/send-payment", $payload);

            if ($response->successful()) {
                return $response->json();
            }

            throw new Exception("Failed to send payment: " . $response->body());
        } catch (Exception $e) {
            Log::error("Relwox payment send error", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => $payload
            ]);
            throw $e;
        }
    }

    /**
     * Check the status of a transaction
     *
     * @param string $internalReference The internal reference returned by request/send payment
     * @return array
     * @throws Exception
     */
    public function checkTransactionStatus(string $internalReference): array
    {
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/vnd.relworx.v2',
                'Authorization' => 'Bearer ' . $this->apiKey
            ])->get("{$this->baseUrl}/mobile-money/check-request-status", [
                'internal_reference' => $internalReference,
                'account_no' => $this->accountNo
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            throw new Exception("Failed to check transaction status: " . $response->body());
        } catch (Exception $e) {
            Log::error("Relwox status check error", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'internal_reference' => $internalReference
            ]);
            throw $e;
        }
    }

    /**
     * Check wallet balance
     *
     * @param string $currency Currency code (e.g., UGX)
     * @return array
     * @throws Exception
     */
    public function checkWalletBalance(string $currency = 'UGX'): array
    {
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/vnd.relworx.v2',
                'Authorization' => 'Bearer ' . $this->apiKey
            ])->get("{$this->baseUrl}/mobile-money/check-wallet-balance", [
                'account_no' => $this->accountNo,
                'currency' => $currency
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            throw new Exception("Failed to check wallet balance: " . $response->body());
        } catch (Exception $e) {
            Log::error("Relwox balance check error", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'currency' => $currency
            ]);
            throw $e;
        }
    }
    
    /**
     * Validate a webhook signature
     *
     * @param string $signature The signature from the webhook header
     * @param string $payload The raw webhook payload
     * @return bool
     */
    public function validateWebhookSignature(string $signature, string $payload): bool
    {
        $calculatedSignature = hash_hmac('sha256', $payload, $this->webhookSecret);
        return hash_equals($calculatedSignature, $signature);
    }

    /**
     * Generate a unique reference for transactions
     *
     * @return string
     */
    private function generateReference(): string
    {
        return Str::random(32);
    }
}