<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

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
        $request->validate(['amount' => 'required|integer|min:1']);
        $player = $request->user();
        $amount = $request->input('amount');

        $wallet = Wallet::firstOrCreate(['player_id' => $player->id]);
        $tx = Transaction::create([
            'player_id' => $player->id,
            'wallet_id' => $wallet->id,
            'type' => 'deposit',
            'amount_credits' => $amount,
            'status' => 'pending',
            'external_ref' => 'mpesa_' . uniqid(),
        ]);

        $wallet->balance_credits += $amount;
        $wallet->save();

        // Return wallet and transaction info
        return response()->json([
            'transactionId' => $tx->id,
            'status' => "completed",
            // 'status' => $tx->status,
            'message' => 'Please enter your mobile money PIN on the prompt sent to your phone.',
            'external_ref' => $tx->external_ref,
            'wallet' => [
                'id' => $wallet->id,
                'balance' => $wallet->balance_credits,
                'currency' => 'CREDITS',
            ],
        ]);
    }

    public function withdraw(Request $request)
    {
        $request->validate(['amount' => 'required|integer|min:1']);
        $player = $request->user();
        $amount = $request->input('amount');

        $wallet = Wallet::firstOrCreate(['player_id' => $player->id]);
        if ($wallet->balance_credits < $amount) {
            return response()->json(['error' => 'Insufficient funds'], 402);
        }

        DB::beginTransaction();
        try {
            $wallet->decrement('balance_credits', $amount);
            $tx = Transaction::create([
                'player_id' => $player->id,
                'wallet_id' => $wallet->id,
                'type' => 'withdrawal',
                'amount_credits' => -1 * $amount,
                'status' => 'processing',
            ]);
            DB::commit();
            return response()->json(['transactionId' => $tx->id, 'newBalance' => $wallet->balance_credits, 'status' => $tx->status]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Server error'], 500);
        }
    }
}
