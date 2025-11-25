# Neon Slots Mobile - Backend API Specification

This document outlines the API endpoints required to support the Neon Slots Mobile frontend. All requests should send content type `application/json`.

## Base URL
`https://api.neonslots.ug/v1`

## 1. Authentication

### Send OTP
Initiates the login process by sending a code via SMS.
**POST** `/auth/send-otp`

**Request Body:**
```json
{
  "phone": "+256771234567" // Must start with +256 and be MTN/Airtel
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent"
}
```

### Verify OTP
Verifies the code and returns the session/user details.
**POST** `/auth/verify-otp`

**Request Body:**
```json
{
  "phone": "+256771234567",
  "otp": "1234"
}
```

**Response (200 OK):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "phone": "+256771234567",
    "isVerified": true
  },
  "wallet": {
    "id": "wallet_uuid",
    "balance": 1000,
    "currency": "CREDITS"
  }
}
```

---

## 2. Wallet

### Get Balance
Refresh the user's current balance.
**GET** `/wallet/balance`
**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "id": "wallet_uuid",
  "balance": 1500,
  "currency": "CREDITS"
}
```

### Deposit (Mobile Money)
Initiate a push payment request to the user's phone.
**POST** `/wallet/deposit`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 2000 // In Credits
}
```

**Response (200 OK):**
```json
{
  "transactionId": "tx_123",
  "status": "PENDING",
  "message": "Push notification sent to phone"
}
```

### Withdraw
Request a cashout to the registered mobile money number.
**POST** `/wallet/withdraw`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 5000 // In Credits
}
```

**Response (200 OK):**
```json
{
  "transactionId": "tx_456",
  "newBalance": 4500,
  "status": "PROCESSING"
}
```

---

## 3. Game Engine

### Spin
Executes a spin. The server calculates RNG, updates balance, and returns the result.
**POST** `/game/spin`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "betAmount": 50
}
```

**Response (200 OK):**
```json
{
  "reels": ["MATOOKE", "MATOOKE", "MATOOKE"], // SymbolType Strings
  "payout": 100,
  "isWin": true,
  "isBigWin": false,
  "isLdw": false, // Loss Disguised as Win flag
  "isNearMiss": false,
  "matchLines": [0],
  "transactionId": "tx_spin_789",
  "serverSignature": "HMAC_SIGNATURE_FOR_AUDIT"
}
```

**Error Response (402 Payment Required):**
```json
{
  "error": "Insufficient funds"
}
```

---

## 4. Admin / Configuration

### Set Configuration
Update the server-side RNG parameters. Allows operators to adjust the Target RTP (House Edge) and maximum liability per spin.

**POST** `/admin/config`
**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "targetRtp": 0.96, // 96% RTP = 4% House Edge.
  "maxWinMultiplier": 50 // Cap single wins at 50x bet
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "config": {
    "targetRtp": 0.96,
    "maxWinMultiplier": 50
  }
}
```

---

## Laravel Backend Integration Guide

To implement this API using Laravel, follow these steps.

### 1. Setup & Models

Run migrations for `users`, `wallets`, and `transactions`.

```bash
php artisan make:model Wallet -m
php artisan make:model Transaction -m
```

### 2. Routes (`routes/api.php`)

```php
use App\Http\Controllers\GameController;
use App\Http\Controllers\WalletController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/game/spin', [GameController::class, 'spin']);
    Route::get('/wallet/balance', [WalletController::class, 'balance']);
    // Admin routes
    Route::post('/admin/config', [GameController::class, 'setConfig'])->middleware('admin');
});
```

### 3. Game Controller Logic (`GameController.php`)

```php
public function spin(Request $request)
{
    $user = $request->user();
    $bet = $request->input('betAmount');
    
    // 1. Transactional Balance Check & Deduct
    DB::beginTransaction();
    try {
        if ($user->wallet->balance < $bet) {
            return response()->json(['error' => 'Insufficient funds'], 402);
        }
        
        $user->wallet->decrement('balance', $bet);
        
        // 2. Fetch Config (Cached)
        $targetRtp = Cache::get('admin_target_rtp', 0.96);
        $maxMult = Cache::get('admin_max_mult', 50);

        // 3. RNG Logic (Calculated RTP)
        // A: Calculate weights for valid symbols
        $validSymbols = collect(Symbols::getAll())->filter(function($s) use ($maxMult) {
            return $s['value'] <= $maxMult;
        });

        $weightedPool = [];
        $totalWeight = 0;
        $weightedValueSum = 0;

        foreach ($validSymbols as $s) {
            $weight = floor(400 / $s['value']);
            $totalWeight += $weight;
            $weightedValueSum += ($weight * $s['value']);
            // Populate pool for later selection
            for ($i = 0; $i < $weight; $i++) $weightedPool[] = $s;
        }

        // B: Calculate Required Win Frequency
        // RTP = WinFreq * AvgWinMult
        $avgWinMult = $weightedValueSum / $totalWeight;
        $winFreq = $targetRtp / $avgWinMult;

        // C: Roll
        $isWin = (mt_rand() / mt_getrandmax()) < $winFreq;
        $payout = 0;
        $reels = [];

        if ($isWin) {
            // Pick from weighted pool
            $symbol = $weightedPool[array_rand($weightedPool)];
            $reels = [$symbol['id'], $symbol['id'], $symbol['id']];
            $payout = $bet * $symbol['value'];
        } else {
            // Force loss (random mismatch)
            $reels = Symbols::getRandomMismatch();
        }

        // 4. Credit Win
        if ($payout > 0) {
            $user->wallet->increment('balance', $payout);
        }

        // 5. Log Transaction
        Transaction::create([
            'user_id' => $user->id,
            'amount' => $payout - $bet, // Net result
            'type' => 'SPIN'
        ]);

        DB::commit();

        return response()->json([
            'reels' => $reels,
            'payout' => $payout,
            'isWin' => $isWin,
            'transactionId' => 'tx_' . uniqid(),
            // ... other fields
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['error' => 'Server Error'], 500);
    }
}
```