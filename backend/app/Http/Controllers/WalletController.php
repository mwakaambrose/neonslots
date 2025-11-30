<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use App\Jobs\ProcessDepositJob;
use App\Jobs\ProcessWithdrawJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WalletController extends Controller
{
    public function balance(Request $request)
    {
        $player = $request->user();
        $wallet = Wallet::firstOrCreate(['player_id' => $player->id]);

        return response()->json([
            'player' => ['id' => $player->id, 'phone' => $player->phone],
            'wallet' => ['id' => $wallet->id, 'balance' => $wallet->balance_credits, 'currency' => 'CREDITS'],
        ]);
    }

    public function depositInit(Request $request)
    {
        $startTime = microtime(true);
        $request->validate(['amount' => 'required|integer|min:1']);
        $player = $request->user();
        $amount = $request->input('amount');

        Log::info('WalletController: Deposit initiated', [
            'player_id' => $player->id,
            'player_phone' => $player->phone,
            'amount_credits' => $amount,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $wallet = Wallet::firstOrCreate(['player_id' => $player->id]);
        
        Log::info('WalletController: Wallet retrieved/created', [
            'player_id' => $player->id,
            'wallet_id' => $wallet->id,
            'current_balance' => $wallet->balance_credits,
        ]);

        $tx = Transaction::create([
            'player_id' => $player->id,
            'wallet_id' => $wallet->id,
            'type' => 'deposit',
            'amount_credits' => $amount,
            'status' => 'pending',
            'external_ref' => 'deposit_' . uniqid(),
        ]);

        Log::info('WalletController: Transaction created', [
            'transaction_id' => $tx->id,
            'player_id' => $player->id,
            'amount_credits' => $amount,
            'external_ref' => $tx->external_ref,
        ]);

        // Dispatch a job to invoke the Relwox collection (requestPayment)
        ProcessDepositJob::dispatch($tx->id);

        Log::info('WalletController: ProcessDepositJob dispatched', [
            'transaction_id' => $tx->id,
            'job_dispatched_at' => now()->toIso8601String(),
        ]);

        $duration = round((microtime(true) - $startTime) * 1000, 2);
        Log::info('WalletController: Deposit request completed', [
            'transaction_id' => $tx->id,
            'duration_ms' => $duration,
        ]);

        // Return initial pending response — job will update tx status/meta and webhook will top up on final success
        return response()->json([
            'transactionId' => $tx->id,
            'status' => $tx->status,
            'message' => 'Request sent. Follow the mobile prompt to complete payment.',
            'external_ref' => $tx->external_ref,
        ]);
    }

    public function withdraw(Request $request)
    {
        $startTime = microtime(true);
        $request->validate(['amount' => 'required|integer|min:1']);
        $player = $request->user();
        $amount = $request->input('amount');

        Log::info('WalletController: Withdrawal initiated', [
            'player_id' => $player->id,
            'player_phone' => $player->phone,
            'amount_credits' => $amount,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $wallet = Wallet::firstOrCreate(['player_id' => $player->id]);
        
        Log::info('WalletController: Wallet retrieved/created', [
            'player_id' => $player->id,
            'wallet_id' => $wallet->id,
            'current_balance' => $wallet->balance_credits,
            'requested_amount' => $amount,
        ]);

        if ($wallet->balance_credits < $amount) {
            Log::warning('WalletController: Insufficient funds for withdrawal', [
                'player_id' => $player->id,
                'wallet_id' => $wallet->id,
                'current_balance' => $wallet->balance_credits,
                'requested_amount' => $amount,
            ]);
            return response()->json(['error' => 'Insufficient funds'], 402);
        }

        DB::beginTransaction();
        try {
            $oldBalance = $wallet->balance_credits;
            $wallet->decrement('balance_credits', $amount);
            $newBalance = $wallet->fresh()->balance_credits;

            Log::info('WalletController: Balance decremented', [
                'player_id' => $player->id,
                'wallet_id' => $wallet->id,
                'old_balance' => $oldBalance,
                'amount_decremented' => $amount,
                'new_balance' => $newBalance,
            ]);

            $tx = Transaction::create([
                'player_id' => $player->id,
                'wallet_id' => $wallet->id,
                'type' => 'withdrawal',
                'amount_credits' => -1 * $amount,
                'status' => 'processing',
            ]);

            Log::info('WalletController: Transaction created', [
                'transaction_id' => $tx->id,
                'player_id' => $player->id,
                'amount_credits' => -1 * $amount,
            ]);

            // dispatch withdraw job to call Relwox sendPayment
            ProcessWithdrawJob::dispatch($tx->id);

            Log::info('WalletController: ProcessWithdrawJob dispatched', [
                'transaction_id' => $tx->id,
                'job_dispatched_at' => now()->toIso8601String(),
            ]);

            DB::commit();

            $duration = round((microtime(true) - $startTime) * 1000, 2);
            Log::info('WalletController: Withdrawal request completed', [
                'transaction_id' => $tx->id,
                'duration_ms' => $duration,
                'final_balance' => $newBalance,
            ]);

            return response()->json(['transactionId' => $tx->id, 'newBalance' => $newBalance, 'status' => $tx->status]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('WalletController: Withdrawal failed', [
                'player_id' => $player->id,
                'amount' => $amount,
                'error' => $e->getMessage(),
                'error_trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Server error'], 500);
        }
    }
}
