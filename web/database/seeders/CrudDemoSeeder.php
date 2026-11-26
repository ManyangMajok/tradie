<?php

namespace Database\Seeders;

use App\Models\Job;
use App\Models\Property;
use App\Models\Suburb;
use App\Models\TradieCategory;
use App\Models\TradieCompany;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CrudDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }
        DB::transaction(function () {
            User::firstOrCreate(['email' => 'admin@tradify.dev'], ['first_name' => 'Amina', 'last_name' => 'Admin', 'role' => 'admin', 'status' => 'active', 'phone' => '+254700000001', 'password' => 'password']);
            $member = User::firstOrCreate(['email' => 'member@tradify.dev'], ['first_name' => 'Wanjiku', 'last_name' => 'Kamau', 'role' => 'member', 'status' => 'active', 'phone' => '+254700000002', 'password' => 'password']);
            $owner = User::firstOrCreate(['email' => 'tradie@tradify.dev'], ['first_name' => 'Brian', 'last_name' => 'Otieno', 'role' => 'tradie', 'status' => 'active', 'phone' => '+254700000003', 'password' => 'password']);
            $company = TradieCompany::firstOrCreate(['owner_user_id' => $owner->id], ['business_name' => 'Nairobi Home Repairs', 'about_text' => 'Fictional business for demonstration.', 'status' => 'approved']);
            $location = Suburb::where('name', 'Westlands')->firstOrFail();
            $property = Property::firstOrCreate(['member_user_id' => $member->id, 'label' => 'Westlands home'], ['address_line_1' => '10 Demo Road', 'suburb_id' => $location->id, 'property_type' => 'apartment', 'is_primary' => false]);
            $category = TradieCategory::where('slug', 'plumber')->firstOrFail();
            Job::firstOrCreate(['property_id' => $property->id, 'custom_issue' => 'Repair a leaking kitchen tap'], ['member_user_id' => $member->id, 'tradie_category_id' => $category->id, 'description' => 'Example job managed manually by the admin.', 'urgency' => 'flexible', 'status' => 'pending_dispatch', 'assigned_tradie_company_id' => $company->id]);
        });
    }
}
