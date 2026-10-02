<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TradiePlanSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $plans = [
            [
                'slug' => 'standard',
                'name' => 'Standard',
                'yearly_price_cents' => 49900,
                'dispatch_rank_boost' => 0,
                'featured_listing' => false,
                'suburb_exclusivity' => false,
                'stripe_price_id' => null,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'slug' => 'premium',
                'name' => 'Premium',
                'yearly_price_cents' => 99900,
                'dispatch_rank_boost' => 100,
                'featured_listing' => true,
                'suburb_exclusivity' => false,
                'stripe_price_id' => null,
                'is_active' => true,
                'sort_order' => 2,
            ],
        ];

        foreach ($plans as &$row) {
            $row['created_at'] = $now;
            $row['updated_at'] = $now;
        }

        DB::table('tradie_plans')->upsert(
            $plans,
            ['slug'],
            ['name', 'yearly_price_cents', 'dispatch_rank_boost', 'featured_listing',
                'suburb_exclusivity', 'is_active', 'sort_order', 'updated_at']
        );
    }
}
