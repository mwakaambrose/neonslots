<?php
namespace Database\Factories;
use App\Models\Player;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
class PlayerFactory extends Factory
{
    protected $model = Player::class;
    public function definition()
    {
        return [
            'display_name' => $this->faker->userName(),
            'phone' => $this->faker->unique()->phoneNumber(),
            'kyc_status' => $this->faker->randomElement(['unverified', 'pending', 'verified']),
            'last_login' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'created_at' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'updated_at' => now(),
        ];
    }
}
