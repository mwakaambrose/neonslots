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
                // Webhook sends amount in UGX, but we store credits in wallet
                // Use the original transaction amount_credits (already in credits)
                $amountCredits = (int)$tx->amount_credits;
                $wallet->increment('balance_credits', $amountCredits);
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

    /**
     * Webhook for send payment (withdrawal) from Relwox
     */
    public function withdrawWebhook(Request $request)
    {
        // Accept webhook from relwox: validate signature first
        $signature = $request->header('X-Relwox-Signature') ?? $request->header('X-Signature') ?? $request->header('Signature');
        $payload = $request->getContent();

        $relwox = new RelwoxService();
        if ($signature && !$relwox->validateWebhookSignature($signature, $payload)) {
            \Illuminate\Support\Facades\Log::warning('WebhookController: Invalid signature for withdraw webhook');
            return response()->json(['error' => 'invalid signature'], 403);
        }

        // expected fields: status, amount, phone, internal_reference/reference/external_ref
        $data = $request->all();

        // Find transaction by possible reference keys
        $ref = $data['internal_reference'] ?? $data['reference'] ?? $data['external_ref'] ?? null;
        if (!$ref) {
            \Illuminate\Support\Facades\Log::warning('WebhookController: Missing reference in withdraw webhook', ['data' => $data]);
            return response()->json(['error' => 'missing reference'], 400);
        }

        $tx = Transaction::where('external_ref', $ref)
            ->orWhere('meta->provider_response->internal_reference', $ref)
            ->where('type', 'withdrawal')
            ->first();

        if (!$tx) {
            \Illuminate\Support\Facades\Log::warning('WebhookController: Transaction not found for withdraw webhook', ['ref' => $ref]);
            return response()->json(['error' => 'not found'], 404);
        }

        $status = strtolower($data['status'] ?? 'pending');
        $tx->meta = array_merge((array)$tx->meta, ['webhook_payload' => $data]);

        if (in_array($status, ['completed', 'success'])) {
            $tx->status = 'completed';
            // For withdrawals, the funds have already been deducted from wallet
            // No need to update wallet balance here
        } elseif (in_array($status, ['failed', 'error', 'rejected'])) {
            // For failed withdrawals, refund the wallet
            $wallet = Wallet::firstOrCreate(['player_id' => $tx->player_id]);
            $wallet->increment('balance_credits', abs((int)$tx->amount_credits));
            $tx->status = 'failed';
            \Illuminate\Support\Facades\Log::info('WebhookController: Withdrawal failed, refunded wallet', [
                'transaction_id' => $tx->id,
                'player_id' => $tx->player_id,
                'amount_credits' => abs((int)$tx->amount_credits),
            ]);
        } else {
            $tx->status = $status;
        }

        // Save any reference
        if (!empty($ref)) $tx->external_ref = $ref;
        $tx->save();

        // Send SMS notification about transaction
        SendTransactionSmsJob::dispatch($tx->id);

        \Illuminate\Support\Facades\Log::info('WebhookController: Withdraw webhook processed', [
            'transaction_id' => $tx->id,
            'status' => $tx->status,
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Webhook for product purchase from Relwox (if needed)
     */
    public function productWebhook(Request $request)
    {
        // Accept webhook from relwox: validate signature first
        $signature = $request->header('X-Relwox-Signature') ?? $request->header('X-Signature') ?? $request->header('Signature');
        $payload = $request->getContent();

        $relwox = new RelwoxService();
        if ($signature && !$relwox->validateWebhookSignature($signature, $payload)) {
            \Illuminate\Support\Facades\Log::warning('WebhookController: Invalid signature for product webhook');
            return response()->json(['error' => 'invalid signature'], 403);
        }

        $data = $request->all();
        
        \Illuminate\Support\Facades\Log::info('WebhookController: Product purchase webhook received', ['data' => $data]);

        // Handle product purchase webhook if needed
        // For now, just log it and return success
        return response()->json(['ok' => true, 'message' => 'Product webhook received']);
    }
}
