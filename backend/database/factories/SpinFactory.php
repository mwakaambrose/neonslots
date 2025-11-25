<?php
namespace Database\Factories;
use App\Models\Spin;
use App\Models\Player;
use App\Models\Machine;
use Illuminate\Database\Eloquent\Factories\Factory;
class SpinFactory extends Factory
{
    protected $model = Spin::class;
    public function definition()
    {
        return [
            'player_id' => Player::factory(),
            'machine_id' => Machine::factory(),
            'bet_credits' => $this->faker->numberBetween(1, 1000),
            'payout_credits' => $this->faker->numberBetween(0, 2000),
            'result_payload' => [
                'isLdw' => $this->faker->boolean(20),
                'isNearMiss' => $this->faker->boolean(10),
            ],
            'created_at' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'updated_at' => now(),
        ];
    }
}
