<?php
namespace Database\Factories;
use App\Models\Transaction;
use App\Models\Player;
use Illuminate\Database\Eloquent\Factories\Factory;
class TransactionFactory extends Factory
{
    protected $model = Transaction::class;
    public function definition()
    {
        return [
            'player_id' => Player::factory(),
            'type' => $this->faker->randomElement(['topup', 'cashout']),
            'amount_credits' => $this->faker->numberBetween(100, 10000),
            'created_at' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'updated_at' => now(),
        ];
    }
}
