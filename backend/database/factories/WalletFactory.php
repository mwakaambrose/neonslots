<?php
namespace Database\Factories;
use App\Models\Wallet;
use App\Models\Player;
use Illuminate\Database\Eloquent\Factories\Factory;
class WalletFactory extends Factory
{
    protected $model = Wallet::class;
    public function definition()
    {
        return [
            'balance_credits' => $this->faker->numberBetween(0, 100000),
            'locked_credits' => $this->faker->numberBetween(0, 10000),
            'created_at' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'updated_at' => now(),
            'player_id' => Player::factory(),
        ];
    }
}
