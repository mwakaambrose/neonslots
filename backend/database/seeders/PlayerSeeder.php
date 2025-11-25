<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Player;
class PlayerSeeder extends Seeder
{
    public function run()
    {
        Player::factory()->count(50)->create();
    }
}
