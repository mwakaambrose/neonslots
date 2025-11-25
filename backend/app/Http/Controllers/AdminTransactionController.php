<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminTransactionController extends Controller
{
    public function index(Request $request)
    {
        $txs = Transaction::with('player')->orderByDesc('created_at')->paginate(30);
        return Inertia::render('admin/Deposits', ['transactions' => $txs]);
    }
}
