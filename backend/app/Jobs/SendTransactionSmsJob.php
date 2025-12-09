<?php

namespace App\Jobs;

use App\Models\Transaction;
use App\Services\AfricasTalkingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTransactionSmsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $txId;

    public function __construct(string $txId)
    {
        $this->txId = $txId;
    }

    public function handle(AfricasTalkingService $sms)
    {
        $tx = Transaction::find($this->txId);
        if (!$tx) return;

        try {
            $player = $tx->player;
            $status = $tx->status;
            $amount = abs((int) $tx->amount_credits);

            $message = '';
            $isDeposit = $tx->type === 'deposit';
            $isSuccess = $status === 'completed';
            $isFailed = in_array($status, ['failed', 'error'], true);

            if ($isDeposit) {
                if ($isSuccess) {
                    $message = "Your deposit of $amount credits was successful. Ref: {$tx->external_ref}.";
                } elseif ($isFailed) {
                    $message = "Your deposit of $amount credits failed. Ref: {$tx->external_ref}.";
                } else {
                    $message = "Your deposit of $amount credits is {$status}. We'll notify you when it's complete. Ref: {$tx->external_ref}.";
                }
            } else {
                if ($isSuccess) {
                    $message = "Your cashout of $amount credits was successful. Ref: {$tx->external_ref}.";
                } elseif ($isFailed) {
                    $message = "Your cashout of $amount credits failed. Ref: {$tx->external_ref}.";
                } else {
                    $message = "Your cashout of $amount credits is {$status}. We'll notify you when it's complete. Ref: {$tx->external_ref}.";
                }
            }

            $sms->sendTransactionSms($player->phone, $message);
        } catch (\Throwable $e) {
            Log::error('SendTransactionSmsJob failed', ['error' => $e->getMessage(), 'tx' => $this->txId]);
        }
    }
}
