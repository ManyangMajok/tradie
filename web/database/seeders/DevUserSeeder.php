<?php

namespace Database\Seeders;

use App\Enums\SubscriptionStatus;
use App\Enums\TradieCompanyStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\MemberPlan;
use App\Models\MemberSubscription;
use App\Models\Property;
use App\Models\Suburb;
use App\Models\TradieAvailability;
use App\Models\TradieCategory;
use App\Models\TradieCompany;
use App\Models\TradieCompanyCategory;
use App\Models\TradiePlan;
use App\Models\TradieServiceArea;
use App\Models\TradieSubscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DevUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = $this->createAdmin();
        $this->createMember($admin);
        $this->createTradie($admin, 'standard');
        $this->createTradie($admin, 'premium', 2);
    }

    private function createAdmin(): User
    {
        return User::updateOrCreate(
            ['email' => 'admin@tradify.dev'],
            [
                'role' => UserRole::Admin,
                'status' => UserStatus::Active,
                'first_name' => 'Admin',
                'last_name' => 'User',
                'phone' => '+61400000001',
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'password' => Hash::make('password'),
            ]
        );
    }

    private function createMember(User $admin): void
    {
        $basicPlan = MemberPlan::where('slug', 'basic')->firstOrFail();

        $member = User::updateOrCreate(
            ['email' => 'member@tradify.dev'],
            [
                'role' => UserRole::Member,
                'status' => UserStatus::Active,
                'first_name' => 'Jane',
                'last_name' => 'Member',
                'phone' => '+61400000002',
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'password' => Hash::make('password'),
            ]
        );

        MemberSubscription::updateOrCreate(
            ['user_id' => $member->id, 'status' => SubscriptionStatus::Active->value],
            [
                'member_plan_id' => $basicPlan->id,
                'status' => SubscriptionStatus::Active,
                'start_date' => now()->toDateString(),
                'end_date' => now()->addYear()->toDateString(),
                'auto_renew' => true,
            ]
        );
        $suburb = Suburb::where('name', 'Baldivis')->where('state', 'WA')->firstOrFail();
        Property::firstOrCreate(
            ['member_user_id' => $member->id, 'label' => 'Demo home'],
            ['address_line_1' => '12 Demo Street', 'suburb_id' => $suburb->id,
                'property_type' => 'house', 'is_primary' => true]
        );
    }

    private function createTradie(User $admin, string $planSlug, int $index = 1): void
    {
        $email = $index === 1 ? 'tradie@tradify.dev' : "tradie{$index}@tradify.dev";
        $phone = '+6140000000'.($index + 2);
        $planClass = TradiePlan::where('slug', $planSlug)->firstOrFail();

        $tradie = User::updateOrCreate(
            ['email' => $email],
            [
                'role' => UserRole::Tradie,
                'status' => UserStatus::Active,
                'first_name' => $planSlug === 'premium' ? 'Premium' : 'Standard',
                'last_name' => 'Tradie',
                'phone' => $phone,
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'password' => Hash::make('password'),
            ]
        );

        $company = TradieCompany::updateOrCreate(
            ['owner_user_id' => $tradie->id],
            [
                'business_name' => ucfirst($planSlug).' Trades Pty Ltd',
                'status' => TradieCompanyStatus::Approved,
                'approved_at' => now(),
                'approved_by_user_id' => $admin->id,
                'licence_expires_on' => now()->addYear()->toDateString(),
                'insurance_expires_on' => now()->addYear()->toDateString(),
                'rating_average' => 4.5,
                'rating_count' => 12,
            ]
        );

        TradieSubscription::updateOrCreate(
            ['tradie_company_id' => $company->id, 'status' => SubscriptionStatus::Active->value],
            [
                'tradie_plan_id' => $planClass->id,
                'status' => SubscriptionStatus::Active,
                'start_date' => now()->toDateString(),
                'end_date' => now()->addYear()->toDateString(),
                'auto_renew' => true,
            ]
        );

        $plumber = TradieCategory::where('slug', 'plumber')->first();
        $electrician = TradieCategory::where('slug', 'electrician')->first();

        foreach (array_filter([$plumber, $electrician]) as $category) {
            TradieCompanyCategory::updateOrCreate(
                ['tradie_company_id' => $company->id, 'tradie_category_id' => $category->id],
                ['is_active' => true]
            );
        }

        $suburbs = Suburb::where('state', 'WA')->where('is_active', true)
            ->whereIn('name', ['Baldivis', 'Wellard', 'Rockingham'])->get();

        foreach ($suburbs as $suburb) {
            TradieServiceArea::updateOrCreate(
                ['tradie_company_id' => $company->id, 'suburb_id' => $suburb->id],
                ['is_active' => true]
            );
        }

        for ($day = 0; $day <= 6; $day++) {
            TradieAvailability::updateOrCreate(
                ['tradie_company_id' => $company->id, 'day_of_week' => $day],
                [
                    'opens_at' => '00:00:00',
                    'closes_at' => '23:59:59',
                    'accepts_emergency' => true,
                ]
            );
        }
    }
}
