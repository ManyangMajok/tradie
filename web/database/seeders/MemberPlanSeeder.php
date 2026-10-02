<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MemberPlanSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $plans = [
            [
                'slug' => 'basic',
                'name' => 'Basic',
                'yearly_price_cents' => 14900,
                'max_properties' => 1,
                'includes_discount' => true,
                'discount_percent' => 10,
                'priority_dispatch' => false,
                'stripe_price_id' => null,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'slug' => 'pro',
                'name' => 'Pro',
                'yearly_price_cents' => 24900,
                'max_properties' => 3,
                'includes_discount' => true,
                'discount_percent' => 10,
                'priority_dispatch' => true,
                'stripe_price_id' => null,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'slug' => 'investor',
                'name' => 'Investor',
                'yearly_price_cents' => 44900,
                'max_properties' => null,
                'includes_discount' => true,
                'discount_percent' => 10,
                'priority_dispatch' => true,
                'stripe_price_id' => null,
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as &$row) {
            $row['created_at'] = $now;
            $row['updated_at'] = $now;
        }

        DB::table('member_plans')->upsert(
            $plans,
            ['slug'],
            ['name', 'yearly_price_cents', 'max_properties', 'includes_discount',
                'discount_percent', 'priority_dispatch', 'is_active', 'sort_order', 'updated_at']
        );
    }
}
