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

        // Check for rate limiting (max 5 attempts per phone per 15 minutes)
        $attemptsKey = 'otp_attempts_' . $phone;
        $attempts = \Illuminate\Support\Facades\Cache::get($attemptsKey, 0);
        
        if ($attempts >= 5) {
            \Illuminate\Support\Facades\Log::warning('AuthController: Too many OTP verification attempts', ['phone' => $phone]);
            return response()->json([
                'error' => 'Too many failed attempts. Please request a new OTP.',
                'retry_after' => \Illuminate\Support\Facades\Cache::get($attemptsKey . '_until', now()->addMinutes(15)->timestamp)
            ], 429);
        }

        $otpRecord = \App\Models\Otp::where('phone', $phone)
            ->where('code', $otp)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (!$otpRecord) {
            // Increment failed attempts
            \Illuminate\Support\Facades\Cache::put($attemptsKey, $attempts + 1, now()->addMinutes(15));
            \Illuminate\Support\Facades\Cache::put($attemptsKey . '_until', now()->addMinutes(15)->timestamp, now()->addMinutes(15));
            
            \Illuminate\Support\Facades\Log::info('AuthController: Invalid OTP attempt', [
                'phone' => $phone,
                'attempts' => $attempts + 1,
            ]);
            
            return response()->json([
                'error' => 'Invalid or expired OTP code. Please try again.',
                'hint' => 'For testing, use code 1234',
                'attempts_remaining' => max(0, 5 - ($attempts + 1))
            ], 422);
        }

        // Clear attempts on success
        \Illuminate\Support\Facades\Cache::forget($attemptsKey);
        \Illuminate\Support\Facades\Cache::forget($attemptsKey . '_until');

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
