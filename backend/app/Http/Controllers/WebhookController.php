<?php

namespace App\Http\Controllers;

use App\Jobs\SendTransactionSmsJob;
use App\Models\Transaction;
use App\Models\Wallet;
use App\Services\RelwoxService;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    // Example deposit webhook from mobile money provider
    public function depositWebhook(Request $request)
    {
        // Accept webhook from relwox: validate signature first
        $signature = $request->header('X-Relwox-Signature') ?? $request->header('X-Signature') ?? $request->header('Signature');
        $payload = $request->getContent();

        $relwox = new RelwoxService();
        if ($signature && !$relwox->validateWebhookSignature($signature, $payload)) {
            return response()->json(['error' => 'invalid signature'], 403);
        }

        // expected fields: status, amount, phone, internal_reference/reference/external_ref
        $data = $request->all();

        // Find transaction by possible reference keys
        $ref = $data['internal_reference'] ?? $data['reference'] ?? $data['external_ref'] ?? null;
        if (!$ref) {
            return response()->json(['error' => 'missing reference'], 400);
        }

        $tx = Transaction::where('external_ref', $ref)->orWhere('meta->provider_response->internal_reference', $ref)->first();
        if (!$tx) {
            // try by exact external_ref fallback
            $tx = Transaction::where('external_ref', $ref)->first();
        }
        if (!$tx) return response()->json(['error' => 'not found'], 404);

        $status = strtolower($data['status'] ?? 'pending');
        $tx->meta = array_merge((array)$tx->meta, ['webhook_payload' => $data]);

        if (in_array($status, ['completed', 'success'])) {
            $tx->status = 'completed';
            // Credit wallet only for deposits
            if ($tx->type === 'deposit') {
                $wallet = Wallet::firstOrCreate(['player_id' => $tx->player_id]);
                $amount = isset($data['amount']) ? (int)$data['amount'] : (int)$tx->amount_credits;
                $wallet->increment('balance_credits', $amount);
            }
        } elseif (in_array($status, ['failed', 'error', 'rejected'])) {
            // For failed withdrawals, refund
            if ($tx->type === 'withdrawal') {
                $wallet = Wallet::firstOrCreate(['player_id' => $tx->player_id]);
                $wallet->increment('balance_credits', abs((int)$tx->amount_credits));
            }
            $tx->status = 'failed';
        } else {
            $tx->status = $status;
        }

        // Save any reference
        if (!empty($ref)) $tx->external_ref = $ref;
        $tx->save();

        // Send SMS notification about transaction
        SendTransactionSmsJob::dispatch($tx->id);

        return response()->json(['ok' => true]);
    }
}
