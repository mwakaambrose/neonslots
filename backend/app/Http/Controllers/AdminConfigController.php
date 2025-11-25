<?php

namespace App\Http\Controllers;

use App\Models\AdminConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminConfigController extends Controller
{
    // Web: render edit page
    public function edit(Request $request)
    {
        $config = AdminConfig::first();
        return Inertia::render('admin/Config', ['config' => $config]);
    }

    // API: show config JSON
    public function show(Request $request)
    {
        $config = AdminConfig::first();
        return response()->json($config);
    }

    // API: update config
    public function update(Request $request)
    {
        $request->validate(['targetRtp' => 'required|numeric|min:0|max:1', 'maxWinMultiplier' => 'required|integer|min:1']);
        $config = AdminConfig::first();
        if (!$config) {
            $config = AdminConfig::create([
                'target_rtp' => $request->input('targetRtp'),
                'max_win_multiplier' => $request->input('maxWinMultiplier'),
            ]);
        } else {
            $config->update([
                'target_rtp' => $request->input('targetRtp'),
                'max_win_multiplier' => $request->input('maxWinMultiplier'),
            ]);
        }

        // Also update cache for backward compatibility
        cache()->put('admin_target_rtp', (float) $config->target_rtp);
        cache()->put('admin_max_mult', (int) $config->max_win_multiplier);

        return response()->json(['success' => true, 'config' => $config]);
    }
}
