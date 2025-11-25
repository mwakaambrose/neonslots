<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\ProgressiveJackpot;
use App\Models\Machine;
class ProgressiveJackpotSeeder extends Seeder
{
    public function run()
    {
        $machineIds = Machine::pluck('id')->toArray();
        // Create a few jackpots, each linked to random machines
        foreach (range(1, 5) as $i) {
            $ids = $this->fakerMachineIds($machineIds);
            \App\Models\ProgressiveJackpot::factory()->create([
                'machine_ids' => json_encode($ids),
            ]);
        }
    }

    protected function fakerMachineIds($allIds)
    {
        // Pick 1-3 random machine ids
        shuffle($allIds);
        return array_slice($allIds, 0, rand(1, 3));
    }
}
