<?php
namespace Database\Factories;
use App\Models\Machine;
use Illuminate\Database\Eloquent\Factories\Factory;
class MachineFactory extends Factory
{
    protected $model = Machine::class;
    public function definition()
    {
        return [
            'name' => $this->faker->word() . ' Slot',
            'created_at' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'updated_at' => now(),
        ];
    }
}
