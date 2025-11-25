<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MachineController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminConfigController;

Route::post('/auth/send-otp', [AuthController::class, 'sendOtp']);
Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);

Route::get('/machines', [MachineController::class, 'index']);

Route::post('/deposit/webhook', [WebhookController::class, 'depositWebhook']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/game/spin', [GameController::class, 'spin']);
    Route::get('/wallet/balance', [WalletController::class, 'balance']);
    Route::post('/wallet/deposit', [WalletController::class, 'depositInit']);
    Route::post('/wallet/withdraw', [WalletController::class, 'withdraw']);

    // admin config - recommend further admin middleware in production
    Route::post('/admin/config', [AdminConfigController::class, 'update']);
    Route::get('/admin/config', [AdminConfigController::class, 'show']);
});

// Health check endpoint
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});