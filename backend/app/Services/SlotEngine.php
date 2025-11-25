<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class SlotEngine
{
    protected $targetRtp;
    protected $maxMultiplier;

    public function __construct(?float $targetRtp = null, ?int $maxMultiplier = null)
    {
        $this->targetRtp = $targetRtp ?? Cache::get('admin_target_rtp', 0.96);
        $this->maxMultiplier = $maxMultiplier ?? Cache::get('admin_max_mult', 50);
    }

    /**
     * Spin a machine. Expects machine to contain 'paytable' array
     * each symbol as ['id' => 'SYMBOL', 'value' => multiplier, 'weight' => optional]
     */
    public function spin(array $machineConfig, int $betCredits): array
    {
        $paytable = $machineConfig['paytable'] ?? [];
        if (empty($paytable)) {
            // fallback: single symbol losing
            return $this->buildResult([], 0, false, $betCredits);
        }

        // Filter by max multiplier
        $valid = array_filter($paytable, function ($s) {
            return Arr::get($s, 'value', 0) <= $this->maxMultiplier;
        });

        // Build weighted pool
        $weightedPool = [];
        $totalWeight = 0;
        $weightedValueSum = 0;

        foreach ($valid as $s) {
            $value = (float) Arr::get($s, 'value', 0);
            $weight = Arr::get($s, 'weight', (int) floor(400 / max(1, $value)));
            $totalWeight += $weight;
            $weightedValueSum += ($weight * $value);
            for ($i = 0; $i < $weight; $i++) {
                $weightedPool[] = $s;
            }
        }

        if ($totalWeight === 0 || empty($weightedPool)) {
            return $this->buildResult([], 0, false, $betCredits);
        }

        $avgWinMult = $weightedValueSum / $totalWeight;
        $winFreq = $this->targetRtp / max(0.000001, $avgWinMult);

        $isWin = (mt_rand() / mt_getrandmax()) < $winFreq;
        $payout = 0;
        $reels = [];
        $matchLines = [];
        $isLdw = false;
        $isNearMiss = false;
        $isBigWin = false;

        if ($isWin) {
            $symbol = $weightedPool[array_rand($weightedPool)];
            $symbolId = Arr::get($symbol, 'id');
            $reels = [$symbolId, $symbolId, $symbolId];
            $mult = (float) Arr::get($symbol, 'value', 0);
            $payout = (int) floor($betCredits * $mult);
            $isBigWin = $mult >= 10;
            // small chance to mark as LDW if payout < bet
            $isLdw = ($payout > 0 && $payout < $betCredits) && (mt_rand(1, 100) <= 10);
        } else {
            // Loss: try to produce near-miss sometimes
            $symbols = array_column($paytable, 'id');
            if (count($symbols) >= 3) {
                // create near-miss by matching two symbols
                if (mt_rand(1, 100) <= 8) {
                    $sym = $symbols[array_rand($symbols)];
                    $reels = [$sym, $sym, $symbols[array_rand($symbols)]];
                    $isNearMiss = true;
                } else {
                    // random mismatch
                    $reels = [
                        $symbols[array_rand($symbols)],
                        $symbols[array_rand($symbols)],
                        $symbols[array_rand($symbols)],
                    ];
                }
            }
        }

        return $this->buildResult($reels, $payout, $isWin, $betCredits, compact('isBigWin', 'isLdw', 'isNearMiss', 'matchLines'));
    }

    protected function buildResult(array $reels, int $payout, bool $isWin, int $betCredits, array $extra = []): array
    {
        $result = [
            'reels' => $reels,
            'payout' => $payout,
            'isWin' => $isWin,
            'isBigWin' => $extra['isBigWin'] ?? false,
            'isLdw' => $extra['isLdw'] ?? false,
            'isNearMiss' => $extra['isNearMiss'] ?? false,
            'matchLines' => $extra['matchLines'] ?? [],
            'bet' => $betCredits,
            'server_nonce' => (string) Str::uuid(),
        ];

        $payloadJson = json_encode($result);
        $signature = hash_hmac('sha256', $payloadJson, config('app.key'));
        $result['server_signature'] = $signature;
        $result['result_payload'] = $result;

        return $result;
    }
}
