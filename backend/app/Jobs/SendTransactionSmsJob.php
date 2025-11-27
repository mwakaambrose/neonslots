<?php

namespace App\Jobs;

use App\Models\Transaction;
use App\Services\EazzyConnectService;
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

    public function handle(EazzyConnectService $sms)
    {
        $tx = Transaction::find($this->txId);
        if (!$tx) return;

        try {
            $player = $tx->player;
            $status = $tx->status;
            $amount = abs((int) $tx->amount_credits);

            $message = '';
            if ($tx->type === 'deposit') {
                $message = $status === 'completed'
                    ? "Your deposit of $amount credits was successful. Ref: {$tx->external_ref}."
                    : "Your deposit of $amount credits is {$status}. We'll notify you when it's complete. Ref: {$tx->external_ref}.";
            } else {
                $message = $status === 'completed'
                    ? "Your cashout of $amount credits was successful. Ref: {$tx->external_ref}."
                    : "Your cashout of $amount credits is {$status}. We'll notify you when it's complete. Ref: {$tx->external_ref}.";
            }

            $sms->sendSms($player->phone, $message);
        } catch (\Throwable $e) {
            Log::error('SendTransactionSmsJob failed', ['error' => $e->getMessage(), 'tx' => $this->txId]);
        }
    }
}
