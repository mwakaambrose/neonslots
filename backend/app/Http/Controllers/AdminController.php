<?php

namespace App\Http\Controllers;

use App\Models\Spin;
use App\Models\Transaction;
use App\Models\Player;
use App\Services\RelwoxService;
use App\Services\EazzyConnectService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function setConfig(Request $request)
    {
        $request->validate(['targetRtp' => 'required|numeric', 'maxWinMultiplier' => 'required|integer']);
        Cache::put('admin_target_rtp', (float) $request->input('targetRtp'));
        Cache::put('admin_max_mult', (int) $request->input('maxWinMultiplier'));
        return response()->json(['success' => true, 'config' => ['targetRtp' => (float) $request->input('targetRtp'), 'maxWinMultiplier' => (int) $request->input('maxWinMultiplier')]]);
    }

    public function clearBalanceCache(Request $request)
    {
        Cache::forget('admin_relwox_balance');
        Cache::forget('admin_eazzy_balance');
        Log::info('AdminDashboard: Balance cache cleared');
        return response()->json(['success' => true, 'message' => 'Cache cleared']);
    }

    public function dashboard(Request $request)
    {
        // Basic metrics (use updated_at as fallback for last activity)
        $dau = Player::where('updated_at', '>=', now()->subDay())->count();
        $mau = Player::where('updated_at', '>=', now()->subDays(30))->count();

        $totalSpins = Spin::count();
        $totalBets = (int) Spin::sum('bet_credits');
        $totalPayouts = (int) Spin::sum('payout_credits');
        $observedRtp = $totalBets > 0 ? ($totalPayouts / $totalBets) : 0.0;

        $netRevenue = $totalBets - $totalPayouts;

        // approximate spins per session and avg session length using grouped spins
        $sessions = DB::table('spins')
            ->select('player_id', DB::raw('MIN(created_at) as first_at'), DB::raw('MAX(created_at) as last_at'), DB::raw('COUNT(*) as spins'))
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('player_id')
            ->get();

        $avgSessionLengthSeconds = $sessions->count()
            ? ($sessions->sum(function ($s) { return strtotime($s->last_at) - strtotime($s->first_at); }) / $sessions->count())
            : 0;
        $avgSpinsPerSession = $sessions->count() ? ($sessions->avg('spins')) : 0;

        // Per-machine summaries (bets, payouts, observed RTP)
        $machineSummaries = DB::table('spins')
            ->select('machine_id', DB::raw('COUNT(*) as spins_count'), DB::raw('SUM(bet_credits) as total_bets'), DB::raw('SUM(payout_credits) as total_payouts'))
            ->groupBy('machine_id')
            ->get()
            ->map(function ($row) {
                return [
                    'machine_id' => $row->machine_id,
                    'spins_count' => (int) $row->spins_count,
                    'total_bets' => (int) $row->total_bets,
                    'total_payouts' => (int) $row->total_payouts,
                    'observed_rtp' => ($row->total_bets > 0) ? ($row->total_payouts / $row->total_bets) : 0.0,
                ];
            });

        // Inspect recent spins for LDW / near-miss frequency (last 1000 spins)
        $recentSpins = Spin::orderBy('created_at', 'desc')->limit(1000)->get();
        $ldwCount = 0;
        $nearMissCount = 0;
        foreach ($recentSpins as $s) {
            $payload = $s->result_payload ?? [];
            if (is_array($payload)) {
                if (!empty($payload['isLdw'])) $ldwCount++;
                if (!empty($payload['isNearMiss'])) $nearMissCount++;
            }
        }

        // Build 7-day time series for RTP, DAU, Spins, Net Revenue
        $days = [];
        $rtpSeries = [];
        $dauSeries = [];
        $spinsSeries = [];
        $revenueSeries = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = now()->subDays($i)->toDateString();
            $days[] = $day;

            $dayBets = (int) DB::table('spins')->whereDate('created_at', $day)->sum('bet_credits');
            $dayPayouts = (int) DB::table('spins')->whereDate('created_at', $day)->sum('payout_credits');
            $rtpSeries[] = $dayBets > 0 ? round($dayPayouts / $dayBets, 4) : 0.0;

            $daySpins = (int) DB::table('spins')->whereDate('created_at', $day)->count();
            $spinsSeries[] = $daySpins;

            $dayDau = (int) DB::table('spins')->whereDate('created_at', $day)->distinct('player_id')->count('player_id');
            $dauSeries[] = $dayDau;

            $revenueSeries[] = $dayBets - $dayPayouts;
        }

        $configModel = \App\Models\AdminConfig::first();
        $currentConfig = [
            'targetRtp' => $configModel->target_rtp ?? Cache::get('admin_target_rtp', 0.96),
            'maxWinMultiplier' => $configModel->max_win_multiplier ?? Cache::get('admin_max_mult', 50),
        ];

        // Fetch wallet balances from payment providers (cached for 5 minutes)
        $relwoxBalance = null;
        $eazzyBalance = null;
        $relwoxError = null;
        $eazzyError = null;

        // Check cache first
        $relwoxCacheKey = 'admin_relwox_balance';
        $eazzyCacheKey = 'admin_eazzy_balance';
        
        $cachedRelwox = Cache::get($relwoxCacheKey);
        $cachedEazzy = Cache::get($eazzyCacheKey);

        if ($cachedRelwox !== null) {
            $relwoxBalance = $cachedRelwox['balance'] ?? null;
            $relwoxError = $cachedRelwox['error'] ?? null;
            Log::info('AdminDashboard: Using cached Relwox balance', ['balance' => $relwoxBalance]);
        } else {
            try {
                $relwoxService = new RelwoxService();
                $relwoxResponse = $relwoxService->checkWalletBalance('UGX');
                $relwoxBalance = $relwoxResponse['balance'] ?? $relwoxResponse['amount'] ?? $relwoxResponse['wallet_balance'] ?? null;
                
                // Cache the result for 5 minutes
                Cache::put($relwoxCacheKey, [
                    'balance' => $relwoxBalance,
                    'error' => null,
                    'fetched_at' => now()->toIso8601String(),
                ], now()->addMinutes(5));
                
                Log::info('AdminDashboard: Relwox balance fetched', [
                    'response' => $relwoxResponse,
                    'balance' => $relwoxBalance,
                ]);
            } catch (\Exception $e) {
                $relwoxError = $e->getMessage();
                
                // Cache error for 1 minute to avoid hammering the API
                Cache::put($relwoxCacheKey, [
                    'balance' => null,
                    'error' => $relwoxError,
                    'fetched_at' => now()->toIso8601String(),
                ], now()->addMinute());
                
                Log::error('AdminDashboard: Failed to fetch Relwox balance', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        if ($cachedEazzy !== null) {
            $eazzyBalance = $cachedEazzy['balance'] ?? null;
            $eazzyError = $cachedEazzy['error'] ?? null;
            Log::info('AdminDashboard: Using cached EazzyConnect balance', ['balance' => $eazzyBalance]);
        } else {
            try {
                $eazzyService = new EazzyConnectService();
                $eazzyResponse = $eazzyService->getAccountBalance();
                $eazzyBalance = $eazzyResponse['balance'] ?? $eazzyResponse['amount'] ?? $eazzyResponse['account_balance'] ?? $eazzyResponse['wallet_balance'] ?? null;
                
                // Cache the result for 5 minutes
                Cache::put($eazzyCacheKey, [
                    'balance' => $eazzyBalance,
                    'error' => null,
                    'fetched_at' => now()->toIso8601String(),
                ], now()->addMinutes(5));
                
                Log::info('AdminDashboard: EazzyConnect balance fetched', [
                    'response' => $eazzyResponse,
                    'balance' => $eazzyBalance,
                ]);
            } catch (\Exception $e) {
                $eazzyError = $e->getMessage();
                
                // Cache error for 1 minute to avoid hammering the API
                Cache::put($eazzyCacheKey, [
                    'balance' => null,
                    'error' => $eazzyError,
                    'fetched_at' => now()->toIso8601String(),
                ], now()->addMinute());
                
                Log::error('AdminDashboard: Failed to fetch EazzyConnect balance', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        return Inertia::render('admin/Dashboard', [
            'dau' => $dau,
            'mau' => $mau,
            'totalSpins' => $totalSpins,
            'totalBets' => $totalBets,
            'totalPayouts' => $totalPayouts,
            'observedRtp' => $observedRtp,
            'netRevenue' => $netRevenue,
            'avgSessionLengthSeconds' => $avgSessionLengthSeconds,
            'avgSpinsPerSession' => $avgSpinsPerSession,
            'machineSummaries' => $machineSummaries,
            'ldwRecent' => $ldwCount,
            'nearMissRecent' => $nearMissCount,
            'timeseries' => [
                'days' => $days,
                'rtp' => $rtpSeries,
                'dau' => $dauSeries,
                'spins' => $spinsSeries,
                'revenue' => $revenueSeries,
            ],
            'config' => $currentConfig,
            'providerBalances' => [
                'relwox' => [
                    'balance' => $relwoxBalance,
                    'currency' => 'UGX',
                    'error' => $relwoxError,
                ],
                'eazzyconnect' => [
                    'balance' => $eazzyBalance,
                    'currency' => 'UGX',
                    'error' => $eazzyError,
                ],
            ],
        ]);
    }
}
