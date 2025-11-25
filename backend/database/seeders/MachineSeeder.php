<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Machine;
class MachineSeeder extends Seeder
{
    public function run()
    {
        Machine::factory()->count(10)->create();
    }
}
