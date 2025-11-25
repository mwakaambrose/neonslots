<?php

namespace App\Http\Controllers;

use App\Models\Player;
use App\Models\Wallet;
use Illuminate\Support\Str;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function sendOtp(Request $request)
    {
        $request->validate(['phone' => 'required|string']);
        $phone = $request->input('phone');
        $code = rand(1000, 9999);

        // Store OTP in database
        \App\Models\Otp::create([
            'phone' => $phone,
            'code' => $code,
            'expires_at' => now()->addMinutes(5),
        ]);

        // Dispatch job to send SMS
        \App\Jobs\SendOtpSmsJob::dispatch($phone, $code);

        return response()->json(['success' => true, 'message' => 'OTP sent']);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate(['phone' => 'required|string', 'otp' => 'required|string']);
        $phone = $request->input('phone');
        $otp = $request->input('otp');

        $otpRecord = \App\Models\Otp::where('phone', $phone)
            ->where('code', $otp)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (!$otpRecord) {
            return response()->json(['error' => 'Invalid OTP'], 422);
        }

        $player = Player::firstOrCreate(['phone' => $phone], [
            'display_name' => 'Player ' . Str::random(6),
        ]);

        // ensure wallet exists
        $wallet = Wallet::firstOrCreate(['player_id' => $player->id], ['balance_credits' => 0]);

        // create token on Player (Sanctum)
        $token = $player->createToken('mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'player' => [
                'id' => $player->id,
                'phone' => $player->phone,
                'display_name' => $player->display_name,
            ],
            'wallet' => [
                'id' => $wallet->id,
                'balance' => $wallet->balance_credits,
                'currency' => 'CREDITS',
            ],
        ]);
    }
}
