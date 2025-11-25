<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use App\Models\Spin;
use App\Models\Transaction;
use App\Models\Wallet;
use App\Services\SlotEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GameController extends Controller
{
    protected $engine;

    public function __construct(SlotEngine $engine)
    {
        $this->engine = $engine;
    }

    public function spin(Request $request)
    {
        $request->validate(['bet' => 'required|integer|min:1']);
        $player = $request->user();
        $bet = (int) $request->input('bet');

        $wallet = Wallet::firstOrCreate(['player_id' => $player->id]);
        if ($wallet->balance_credits < $bet) {
            return response()->json(['error' => 'Insufficient funds'], 402);
        }

        DB::beginTransaction();
        try {
            // Lock/collect bet
            $wallet->decrement('balance_credits', $bet);

            // Log bet transaction
            Transaction::create([
                'player_id' => $player->id,
                'wallet_id' => $wallet->id,
                'type' => 'spin_bet',
                'amount_credits' => -1 * $bet,
                'status' => 'completed',
            ]);

            // Use frontend spin result
            $res = $request->only([
                'reels', 'payout', 'isWin', 'isBigWin', 'isLdw', 'isNearMiss', 'matchLines', 'transactionId', 'serverSignature'
            ]);
            $payout = (int) ($res['payout'] ?? 0);

            if ($payout > 0) {
                $wallet->increment('balance_credits', $payout);
                Transaction::create([
                    'player_id' => $player->id,
                    'wallet_id' => $wallet->id,
                    'type' => 'spin_win',
                    'amount_credits' => $payout,
                    'status' => 'completed',
                ]);
            }

            // Save spin record
            $spin = Spin::create([
                'player_id' => $player->id,
                'bet_credits' => $bet,
                'result_payload' => $res,
                'payout_credits' => $payout,
                'server_nonce' => $res['server_nonce'] ?? null,
                'server_signature' => $res['serverSignature'] ?? null,
            ]);

            DB::commit();

            // return payload using frontend naming (player)
            return response()->json(array_merge(['player' => ['id' => $player->id]], $res));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Server error', 'message' => $e->getMessage()], 500);
        }
    }
}
