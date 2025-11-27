<?php

namespace App\Jobs;

use App\Models\Transaction;
use App\Services\RelwoxService;
use App\Services\EazzyConnectService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessWithdrawJob implements ShouldQueue
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
            $amount = abs((float) $tx->amount_credits);

            $resp = $relwox->sendPayment($player->phone, $amount, 'UGX', 'Neon Slots withdrawal');

            // persist response and external reference
            $tx->meta = array_merge((array) $tx->meta, ['provider_response' => $resp]);
            if (isset($resp['internal_reference'])) {
                $tx->external_ref = $resp['internal_reference'];
            } elseif (isset($resp['reference'])) {
                $tx->external_ref = $resp['reference'];
            }

            $status = strtolower($resp['status'] ?? 'processing');
            $tx->status = $status;
            $tx->save();
            // notify player
            \App\Jobs\SendTransactionSmsJob::dispatch($tx->id);

            // if immediate failure, refund wallet and mark failed
            if (in_array($status, ['failed', 'error'])) {
                $wallet = $tx->wallet;
                if ($wallet) {
                    $wallet->increment('balance_credits', abs((int)$tx->amount_credits));
                }
            }
        } catch (\Throwable $e) {
            Log::error('ProcessWithdrawJob failed', ['error' => $e->getMessage(), 'tx' => $this->txId]);
            // refund wallet
            $wallet = $tx->wallet;
            if ($wallet) {
                $wallet->increment('balance_credits', abs((int)$tx->amount_credits));
            }
            $tx->meta = array_merge((array) $tx->meta, ['error' => $e->getMessage()]);
            $tx->status = 'failed';
            $tx->save();
            \App\Jobs\SendTransactionSmsJob::dispatch($tx->id);
        }
    }
}
