<?php

namespace App\Http\Controllers;

use App\Models\Player;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminPlayerController extends Controller
{
    public function index(Request $request)
    {
        $players = Player::orderByDesc('created_at')->paginate(30);
        return Inertia::render('admin/Players', ['players' => $players]);
    }

    public function show(Request $request, $id)
    {
        $player = Player::with('wallet')->findOrFail($id);
        return Inertia::render('admin/PlayerShow', ['wallet' => $player->wallet ?? ['player' => $player]]);
    }
}
