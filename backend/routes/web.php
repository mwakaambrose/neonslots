<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\AdminController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Admin dashboard (now available at /dashboard)
    Route::get('dashboard', [AdminController::class, 'dashboard'])->name('dashboard');

    // Admin config editor page
    Route::get('admin/config', [\App\Http\Controllers\AdminConfigController::class, 'edit'])->name('admin.config');

    // Admin pages: wallets, deposits/cashouts, plays
    Route::get('admin/wallets', [\App\Http\Controllers\AdminWalletController::class, 'index'])->name('admin.wallets');
    Route::get('admin/wallets/{id}', [\App\Http\Controllers\AdminWalletController::class, 'show'])->name('admin.wallets.show');

    Route::get('admin/deposits', [\App\Http\Controllers\AdminTransactionController::class, 'index'])->name('admin.deposits');

    // Topups route (alias of deposits) kept for a clearer admin label
    Route::get('admin/topups', [\App\Http\Controllers\AdminTransactionController::class, 'index'])->name('admin.topups');

    // Players listing & profile
    Route::get('admin/players', [\App\Http\Controllers\AdminPlayerController::class, 'index'])->name('admin.players.index');
    Route::get('admin/players/{id}', [\App\Http\Controllers\AdminPlayerController::class, 'show'])->name('admin.players.show');

    Route::get('admin/plays', [\App\Http\Controllers\AdminPlaysController::class, 'index'])->name('admin.plays');
    Route::get('admin/plays/{id}', [\App\Http\Controllers\AdminPlaysController::class, 'show'])->name('admin.plays.show');
});

require __DIR__.'/settings.php';
