<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use Illuminate\Http\Request;

class MachineController extends Controller
{
    public function index(Request $request)
    {
        $machines = Machine::where('active', true)->get()->map(function ($m) {
            return [
                'id' => $m->id,
                'name' => $m->name,
                'reels_config' => $m->reels_config,
                'paytable' => $m->paytable,
                'rtp' => (float) $m->rtp,
                'volatility' => $m->volatility,
            ];
        });

        return response()->json(['machines' => $machines]);
    }
}
