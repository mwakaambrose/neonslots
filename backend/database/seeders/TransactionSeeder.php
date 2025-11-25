<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Transaction;
use App\Models\Player;
class TransactionSeeder extends Seeder
{
    public function run()
    {
        Player::all()->each(function ($player) {
            Transaction::factory()->count(20)->create(['player_id' => $player->id]);
        });
    }
}
