<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsLog extends Model
{
    protected $fillable = [
        'phone_number',
        'message',
        'message_id',
        'status',
        'status_code',
        'cost',
        'currency',
        'message_parts',
        'type',
        'response_data',
    ];

    protected $casts = [
        'response_data' => 'array',
        'cost' => 'decimal:4',
        'message_parts' => 'integer',
        'status_code' => 'integer',
    ];

    /**
     * Create a log entry from AfricasTalking response
     *
     * @param string $phoneNumber
     * @param string $message
     * @param object $recipient AfricasTalking recipient response
     * @param string $type
     * @return self
     */
    public static function logFromResponse(
        string $phoneNumber,
        string $message,
        object $recipient,
        string $type = 'general'
    ): self {
        // Parse cost (e.g., "UGX 27.0000" -> currency: UGX, amount: 27.0000)
        $costString = $recipient->cost ?? null;
        $currency = null;
        $costAmount = null;

        if ($costString) {
            $parts = explode(' ', $costString);
            if (count($parts) === 2) {
                $currency = $parts[0];
                $costAmount = (float) $parts[1];
            }
        }

        return self::create([
            'phone_number' => $recipient->number ?? $phoneNumber,
            'message' => $message,
            'message_id' => $recipient->messageId ?? null,
            'status' => $recipient->status ?? 'Unknown',
            'status_code' => $recipient->statusCode ?? null,
            'cost' => $costAmount, // Store only numeric value
            'currency' => $currency,
            'message_parts' => $recipient->messageParts ?? 1,
            'type' => $type,
            'response_data' => json_decode(json_encode($recipient), true),
        ]);
    }

    /**
     * Get total cost for a specific period
     *
     * @param string|null $currency
     * @param string|null $startDate
     * @param string|null $endDate
     * @return float
     */
    public static function getTotalCost(
        ?string $currency = null,
        ?string $startDate = null,
        ?string $endDate = null
    ): float {
        $query = self::query();

        if ($currency) {
            $query->where('currency', $currency);
        }

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        return (float) $query->sum('cost');
    }

    /**
     * Get successful SMS count
     */
    public static function getSuccessCount(?string $startDate = null, ?string $endDate = null): int
    {
        $query = self::where('status', 'Success');

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        return $query->count();
    }

    /**
     * Get failed SMS count
     */
    public static function getFailedCount(?string $startDate = null, ?string $endDate = null): int
    {
        $query = self::where('status', '!=', 'Success');

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        return $query->count();
    }
}
