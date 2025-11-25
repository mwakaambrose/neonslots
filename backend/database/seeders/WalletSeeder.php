<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Wallet;
use App\Models\Player;
class WalletSeeder extends Seeder
{
    public function run()
    {
        Player::all()->each(function ($player) {
            Wallet::factory()->create(['player_id' => $player->id]);
        });
    }
}
