<?php
namespace Database\Factories;
use App\Models\ProgressiveJackpot;
use App\Models\Machine;
use Illuminate\Database\Eloquent\Factories\Factory;
class ProgressiveJackpotFactory extends Factory
{
    protected $model = ProgressiveJackpot::class;
    public function definition()
    {
        return [
            'machine_ids' => json_encode([$this->faker->uuid]),
            'current_value' => $this->faker->numberBetween(1000, 1000000),
            'contribution_rate' => $this->faker->randomFloat(3, 0.001, 0.05),
            'last_payout_at' => $this->faker->optional()->dateTimeBetween('-2 years', 'now'),
            'created_at' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'updated_at' => now(),
        ];
    }
}
