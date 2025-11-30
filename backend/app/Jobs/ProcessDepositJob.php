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
        $startTime = microtime(true);
        $tx = Transaction::find($this->txId);
        
        if (!$tx) {
            Log::warning('ProcessDepositJob: Transaction not found', ['tx_id' => $this->txId]);
            return;
        }

        Log::info('ProcessDepositJob: Started', [
            'tx_id' => $this->txId,
            'transaction_id' => $tx->id,
            'player_id' => $tx->player_id,
            'amount_credits' => $tx->amount_credits,
            'status' => $tx->status,
        ]);

        try {
            $player = $tx->player;
            $amountCredits = (float) $tx->amount_credits;
            
            // Convert credits to UGX before sending to payment provider
            // Frontend sends credits, but Relwox expects UGX amounts
            $exchangeRate = config('game.exchange_rate', 25);
            $amountUgx = $amountCredits * $exchangeRate;

            Log::info('ProcessDepositJob: Amount conversion', [
                'tx_id' => $this->txId,
                'amount_credits' => $amountCredits,
                'exchange_rate' => $exchangeRate,
                'amount_ugx' => $amountUgx,
                'player_phone' => $player->phone,
            ]);

            $paymentStartTime = microtime(true);
            $resp = $relwox->requestPayment($player->phone, $amountUgx, 'UGX', 'Neon Slots deposit');
            $paymentDuration = round((microtime(true) - $paymentStartTime) * 1000, 2);

            Log::info('ProcessDepositJob: Payment provider response', [
                'tx_id' => $this->txId,
                'payment_duration_ms' => $paymentDuration,
                'provider_response' => $resp,
                'response_status' => $resp['status'] ?? 'unknown',
            ]);

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

            Log::info('ProcessDepositJob: Transaction status updated', [
                'tx_id' => $this->txId,
                'new_status' => $status,
                'external_ref' => $tx->external_ref,
            ]);

            // If completed immediately, credit wallet
            if ($status === 'completed' || $status === 'success') {
                $wallet = $tx->wallet;
                if ($wallet) {
                    $oldBalance = $wallet->balance_credits;
                    $wallet->increment('balance_credits', (int)$tx->amount_credits);
                    $newBalance = $wallet->fresh()->balance_credits;
                    
                    Log::info('ProcessDepositJob: Wallet credited immediately', [
                        'tx_id' => $this->txId,
                        'wallet_id' => $wallet->id,
                        'amount_credits' => $tx->amount_credits,
                        'old_balance' => $oldBalance,
                        'new_balance' => $newBalance,
                    ]);
                }
                // notify player
                \App\Jobs\SendTransactionSmsJob::dispatch($tx->id);
                Log::info('ProcessDepositJob: SMS notification dispatched', ['tx_id' => $this->txId]);
            } else {
                Log::info('ProcessDepositJob: Payment pending, waiting for webhook', [
                    'tx_id' => $this->txId,
                    'status' => $status,
                ]);
            }

            $totalDuration = round((microtime(true) - $startTime) * 1000, 2);
            Log::info('ProcessDepositJob: Completed successfully', [
                'tx_id' => $this->txId,
                'total_duration_ms' => $totalDuration,
                'final_status' => $status,
            ]);
        } catch (\Throwable $e) {
            $totalDuration = round((microtime(true) - $startTime) * 1000, 2);
            Log::error('ProcessDepositJob: Failed', [
                'tx_id' => $this->txId,
                'error' => $e->getMessage(),
                'error_trace' => $e->getTraceAsString(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'duration_ms' => $totalDuration,
            ]);
            // update transaction meta with error
            $tx->meta = array_merge((array) $tx->meta, ['error' => $e->getMessage()]);
            $tx->status = 'failed';
            \App\Jobs\SendTransactionSmsJob::dispatch($tx->id);
            $tx->save();
        }
    }
}
