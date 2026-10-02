<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TradieCategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $categories = [
            ['slug' => 'plumber', 'name' => 'Plumber', 'sort_order' => 1],
            ['slug' => 'electrician', 'name' => 'Electrician', 'sort_order' => 2],
            ['slug' => 'locksmith', 'name' => 'Locksmith', 'sort_order' => 3],
            ['slug' => 'roofer', 'name' => 'Roofer', 'sort_order' => 4],
            ['slug' => 'pest-control', 'name' => 'Pest Control', 'sort_order' => 5],
            ['slug' => 'handyman', 'name' => 'Handyman', 'sort_order' => 6],
            ['slug' => 'hvac', 'name' => 'HVAC', 'sort_order' => 7],
            ['slug' => 'appliance-repair', 'name' => 'Appliance Repair', 'sort_order' => 8],
        ];

        foreach ($categories as &$row) {
            $row['is_active'] = true;
            $row['created_at'] = $now;
            $row['updated_at'] = $now;
        }

        DB::table('tradie_categories')->upsert(
            $categories,
            ['slug'],
            ['name', 'sort_order', 'is_active', 'updated_at']
        );
    }
}
