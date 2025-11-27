Relwox integration (jobs + webhook)
================================

This folder contains the Relwox payment integration used by the Neon Slots backend.

What was added
- ProcessDepositJob: requests mobile-money collection via Relwox and updates Transaction meta/status.
- ProcessWithdrawJob: sends payments via Relwox and updates Transaction meta/status (refunds wallet on failure).
- SendTransactionSmsJob: sends SMS notifications to players via EazzyConnect when a transaction changes state.
- WebhookController: validates incoming Relwox webhook signatures and updates Transaction and Wallet on success/failure.

How it works
- When `/api/wallet/deposit` is called the controller creates a pending Transaction and dispatches `ProcessDepositJob`.
- When `/api/wallet/withdraw` is called the controller creates a processing Transaction, decrements the wallet (hold), then dispatches `ProcessWithdrawJob`.
- Relwox will send a webhook to `/api/deposit/webhook` when transaction status changes. The webhook will validate the signature (HMAC sha256), top up the wallet on completed deposits, refund on failed withdrawals, and send an SMS notification.

Developer notes
- Ensure queue worker is running to handle jobs:

```bash
php artisan queue:work --tries=3
```

- The Relwox HTTP signature verification expects the webhook secret configured in `RELWOX_WEBHOOK_SECRET`.
- SMS uses the EazzyConnect provider — configure `services.ezzyconnect` in `config/services.php`.
