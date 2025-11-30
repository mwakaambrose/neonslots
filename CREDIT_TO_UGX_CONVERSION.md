# Credit to UGX Conversion Fix

## Problem

The frontend sends deposit/withdrawal amounts in **credits**, but the Relwox payment service expects amounts in **UGX**. The exchange rate is **1 Credit = 25 UGX**.

### Example
- Frontend sends: `40 credits`
- Relwox expects: `1000 UGX` (40 × 25)
- Previous behavior: Sent `40 UGX` → **Error: "Minimum: 500 UGX"**

## Solution

### 1. Added Exchange Rate Config
Created `backend/config/game.php`:
```php
'exchange_rate' => env('EXCHANGE_RATE', 25),
```

### 2. Updated ProcessDepositJob
- Converts credits to UGX before calling `RelwoxService::requestPayment()`
- Stores both amounts in transaction meta for reference

### 3. Updated ProcessWithdrawJob
- Converts credits to UGX before calling `RelwoxService::sendPayment()`
- Stores both amounts in transaction meta for reference

### 4. Fixed WebhookController
- Uses original `amount_credits` from transaction (already in credits)
- No conversion needed since webhook confirms the original credit amount

## Flow

### Deposit Flow
1. Frontend → `POST /api/wallet/deposit` with `{"amount": 40}` (credits)
2. WalletController → Stores `amount_credits: 40` in transaction
3. ProcessDepositJob → Converts: `40 credits × 25 = 1000 UGX`
4. RelwoxService → Sends `1000 UGX` to payment provider ✅
5. Webhook → Confirms payment, credits wallet with `40 credits`

### Withdrawal Flow
1. Frontend → `POST /api/wallet/withdraw` with `{"amount": 200}` (credits)
2. WalletController → Stores `amount_credits: -200` in transaction
3. ProcessWithdrawJob → Converts: `200 credits × 25 = 5000 UGX`
4. RelwoxService → Sends `5000 UGX` to player's mobile money ✅

## Transaction Meta

Both jobs now store in `transaction.meta`:
```json
{
  "amount_ugx": 1000,
  "amount_credits": 40,
  "exchange_rate": 25,
  "provider_response": {...}
}
```

## Configuration

Set in `.env` (optional, defaults to 25):
```env
EXCHANGE_RATE=25
```

## Testing

After deployment, test with:
```bash
# Deposit 40 credits = 1000 UGX
curl -X POST https://admin.neonslots.site/api/wallet/deposit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 40}'
```

Should now succeed (1000 UGX > 500 UGX minimum) ✅

