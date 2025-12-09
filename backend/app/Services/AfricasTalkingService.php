<?php
namespace App\Services;

use AfricasTalking\SDK\AfricasTalking;
use App\Models\SmsLog;
use Illuminate\Support\Facades\Log;

class AfricasTalkingService
{
    protected $sms;
    protected $username;
    protected $apiKey;

    public function __construct()
    {
        $this->username = config('services.africastalking.username');
        $this->apiKey = config('services.africastalking.api_key');
        
        $AT = new AfricasTalking($this->username, $this->apiKey);
        $this->sms = $AT->sms();
    }

    /**
     * Send an SMS message
     *
     * @param string|array $to Phone number(s) in international format (e.g., +254XXXXXXXXX)
     * @param string $message The SMS message content
     * @param string|null $from Optional sender ID (shortcode or alphanumeric)
     * @param string $type SMS type for logging (e.g., 'otp', 'transaction', 'general')
     * @return array Response with status and data
     */
    public function sendSms($to, string $message, ?string $from = null, string $type = 'general'): array
    {
        try {
            // Ensure $to is an array
            if (!is_array($to)) {
                $to = [$to];
            }

            $options = [
                'to' => $to,
                'message' => $message,
            ];

            if ($from) {
                $options['from'] = $from;
            }

            $result = $this->sms->send($options);

            if ($result['status'] === 'success') {
                // Log each recipient
                if (isset($result['data']->SMSMessageData->Recipients)) {
                    foreach ($result['data']->SMSMessageData->Recipients as $recipient) {
                        SmsLog::logFromResponse(
                            $recipient->number ?? '',
                            $message,
                            $recipient,
                            $type
                        );
                    }
                }

                Log::info('AfricasTalking: SMS sent successfully', [
                    'recipients' => $to,
                    'response' => $result['data'],
                ]);
                return [
                    'success' => true,
                    'data' => $result['data'],
                ];
            } else {
                Log::error('AfricasTalking: Failed to send SMS', [
                    'recipients' => $to,
                    'error' => $result['data'],
                ]);
                return [
                    'success' => false,
                    'error' => $result['data'],
                ];
            }
        } catch (\Exception $e) {
            Log::error('AfricasTalking: Exception while sending SMS', [
                'recipients' => $to,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send OTP code via SMS
     *
     * @param string $phone Phone number in international format
     * @param string $code The OTP code
     * @return array Response with status and data
     */
    public function sendOtp(string $phone, string $code): array
    {
        $message = "Your OTP code is: $code";
        return $this->sendSms($phone, $message, null, 'otp');
    }

    /**
     * Send transaction notification via SMS
     *
     * @param string $phone Phone number in international format
     * @param string $message Transaction details
     * @return array Response with status and data
     */
    public function sendTransactionSms(string $phone, string $message): array
    {
        return $this->sendSms($phone, $message, null, 'transaction');
    }
}