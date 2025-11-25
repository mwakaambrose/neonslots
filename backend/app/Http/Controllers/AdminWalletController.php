<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminWalletController extends Controller
{
    public function index(Request $request)
    {
        $wallets = Wallet::with('player')->orderByDesc('balance_credits')->paginate(20);
        return Inertia::render('admin/Wallets', ['wallets' => $wallets]);
    }

    public function show(Request $request, $id)
    {
        $wallet = Wallet::with('player')->findOrFail($id);
        return Inertia::render('admin/PlayerShow', ['wallet' => $wallet]);
    }
}
