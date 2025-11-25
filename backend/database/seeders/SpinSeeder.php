<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Spin;
use App\Models\Player;
use App\Models\Machine;
class SpinSeeder extends Seeder
{
    public function run()
    {
        $machines = Machine::all();
        $config = \App\Models\AdminConfig::singleton();
        $targetRtp = $config->targetRtp ?? 0.96;
        $maxMult = $config->maxWinMultiplier ?? 50;
        Player::all()->each(function ($player) use ($machines, $targetRtp, $maxMult) {
            foreach ($machines as $machine) {
                $sessionStart = now()->subDays(rand(0, 365))->subMinutes(rand(0, 1440));
                $spins = [];
                $totalBets = 0;
                $winIndices = [];
                $spinCount = 100;
                $sessionSizes = [];
                $remaining = $spinCount;
                // Randomly divide spins into sessions of 10–30 spins
                while ($remaining > 0) {
                    $size = min($remaining, rand(10, 30));
                    $sessionSizes[] = $size;
                    $remaining -= $size;
                }
                $spinIdx = 0;
                foreach ($sessionSizes as $sessSize) {
                    $sessStart = $sessionStart->copy()->addDays(rand(0, 7))->addMinutes(rand(0, 1440));
                    $sessDuration = rand(5, 30) * 60; // 5–30 min in seconds
                    for ($j = 0; $j < $sessSize; $j++, $spinIdx++) {
                        $bet = rand(10, 1000);
                        $totalBets += $bet;
                        $win = rand(0, 100) < 30;
                        if ($win) $winIndices[] = $spinIdx;
                        $spins[] = [
                            'player_id' => $player->id,
                            'machine_id' => $machine->id,
                            'bet_credits' => $bet,
                            'payout_credits' => 0, // assign later
                            'result_payload' => [
                                'isLdw' => $win && rand(0, 100) < 20,
                                'isNearMiss' => rand(0, 100) < 10,
                            ],
                            'created_at' => $sessStart->copy()->addSeconds(intval($j * $sessDuration / $sessSize)),
                            'updated_at' => now(),
                        ];
                    }
                }
                // Distribute total allowed payout only among win spins
                $targetTotalPayouts = min($totalBets * $targetRtp, $totalBets);
                $remainingPayout = $targetTotalPayouts;
                foreach ($winIndices as $idx) {
                    $spin = &$spins[$idx];
                    $maxPayout = min($spin['bet_credits'] * $maxMult, $remainingPayout);
                    // Use a random realistic multiplier, but never exceed maxPayout
                    $mult = rand(1, $maxMult);
                    $payout = min($spin['bet_credits'] * $mult, $maxPayout);
                    $spin['payout_credits'] = $payout;
                    $remainingPayout -= $payout;
                }
                foreach ($spins as $spin) {
                    \App\Models\Spin::create($spin);
                }
            }
        });
    }
}
