<?php

namespace App\Jobs;

use App\Models\Transaction;
use App\Services\RelwoxService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessDepositJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $txId;

    public function __construct(string $txId)
    {
        $this->txId = $txId;
    }

    public function handle(RelwoxService $relwox)
    {
        $tx = Transaction::find($this->txId);
        if (!$tx) return;

        try {
            $player = $tx->player;
            $amountCredits = (float) $tx->amount_credits;
            
            // Convert credits to UGX before sending to payment provider
            // Frontend sends credits, but Relwox expects UGX amounts
            $exchangeRate = config('game.exchange_rate', 25);
            $amountUgx = $amountCredits * $exchangeRate;

            $resp = $relwox->requestPayment($player->phone, $amountUgx, 'UGX', 'Neon Slots deposit');

            // Persist provider details and store UGX amount for reference
            $tx->meta = array_merge((array) $tx->meta, [
                'provider_response' => $resp,
                'amount_ugx' => $amountUgx,
                'amount_credits' => $amountCredits,
                'exchange_rate' => $exchangeRate,
            ]);
            if (isset($resp['internal_reference'])) {
                $tx->external_ref = $resp['internal_reference'];
            } elseif (isset($resp['reference'])) {
                $tx->external_ref = $resp['reference'];
            }

            // Map status (some providers give pending/processing/completed)
            $status = strtolower($resp['status'] ?? 'pending');
            $tx->status = $status;
            $tx->save();

            // If completed immediately, credit wallet
            if ($status === 'completed' || $status === 'success') {
                $wallet = $tx->wallet;
                if ($wallet) {
                    $wallet->increment('balance_credits', (int)$tx->amount_credits);
                }
                // notify player
                \App\Jobs\SendTransactionSmsJob::dispatch($tx->id);
            }
        } catch (\Throwable $e) {
            Log::error('ProcessDepositJob failed', ['error' => $e->getMessage(), 'tx' => $this->txId]);
            // update transaction meta with error
            $tx->meta = array_merge((array) $tx->meta, ['error' => $e->getMessage()]);
            $tx->status = 'failed';
            \App\Jobs\SendTransactionSmsJob::dispatch($tx->id);
            $tx->save();
        }
    }
}
