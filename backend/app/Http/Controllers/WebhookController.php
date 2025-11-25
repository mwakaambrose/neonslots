<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    // Example deposit webhook from mobile money provider
    public function depositWebhook(Request $request)
    {
        // expected: external_ref, status, amount, phone
        $data = $request->only(['external_ref', 'status', 'amount', 'phone']);
        if (empty($data['external_ref'])) {
            return response()->json(['error' => 'missing external_ref'], 400);
        }

        $tx = Transaction::where('external_ref', $data['external_ref'])->first();
        if (!$tx) {
            return response()->json(['error' => 'not found'], 404);
        }

        if ($data['status'] === 'COMPLETED' || $data['status'] === 'completed') {
            $tx->update(['status' => 'completed']);
            // credit wallet
            $wallet = Wallet::firstOrCreate(['player_id' => $tx->player_id]);
            $wallet->increment('balance_credits', (int) $data['amount']);
        } else {
            $tx->update(['status' => 'failed']);
        }

        return response()->json(['ok' => true]);
    }
}
