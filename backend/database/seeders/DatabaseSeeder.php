<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'ambrose@zzzimba.com'],
            [
                'name' => 'Ambrose Mwaka',
                'password' => 'Win@2026WithTech',
                'email_verified_at' => now(),
            ]
        );
        // $this->call([
        //     PlayerSeeder::class,
        //     MachineSeeder::class,
        //     WalletSeeder::class,
        //     TransactionSeeder::class,
        //     SpinSeeder::class,
        //     ProgressiveJackpotSeeder::class,
        // ]);
    }
}
