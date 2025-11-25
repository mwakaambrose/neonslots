<?php

namespace App\Http\Controllers;

use App\Models\Spin;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminPlaysController extends Controller
{
    public function index(Request $request)
    {
        $spins = Spin::with('player', 'machine')->orderByDesc('created_at')->paginate(30);
        return Inertia::render('admin/Plays', ['spins' => $spins]);
    }

    public function show(Request $request, $id)
    {
        $spin = Spin::with('player', 'machine')->findOrFail($id);
        return Inertia::render('admin/PlaysShow', ['spin' => $spin]);
    }
}
