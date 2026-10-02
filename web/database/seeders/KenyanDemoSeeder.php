<?php

namespace Database\Seeders;

use App\Enums\OfferStatus;
use App\Models\Job;
use App\Models\JobCompletionReport;
use App\Models\JobOffer;
use App\Models\JobStatusLog;
use App\Models\MemberPlan;
use App\Models\MemberSubscription;
use App\Models\Property;
use App\Models\Review;
use App\Models\SavedTradie;
use App\Models\Suburb;
use App\Models\TradieCategory;
use App\Models\TradieCompany;
use App\Models\TradiePerformanceDaily;
use App\Models\TradiePlan;
use App\Models\TradieServiceArea;
use App\Models\TradieSubscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class KenyanDemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $admin = $this->person('admin@tradify.dev', 'Amina', 'Otieno', 'admin', 1);
            $member = $this->person('member@tradify.dev', 'Wanjiku', 'Mwangi', 'member', 2);
            MemberSubscription::firstOrCreate(['user_id' => $member->id, 'status' => 'active'], [
                'member_plan_id' => MemberPlan::where('slug', 'basic')->firstOrFail()->id,
                'start_date' => now()->toDateString(), 'end_date' => now()->addYear()->toDateString(), 'auto_renew' => true,
            ]);
            $home = Property::updateOrCreate(['member_user_id' => $member->id, 'label' => 'Demo home'], [
                'address_line_1' => '12 Demo Court, Westlands',
                'suburb_id' => Suburb::where('name', 'Westlands')->firstOrFail()->id,
                'property_type' => 'apartment',
            ]);
            if (! $member->properties()->where('is_primary', true)->exists()) {
                $home->update(['is_primary' => true]);
            }
            $profiles = [
                ['Kamau', 'Njoroge', 'Westlands Plumbing & Electrical', ['Westlands', 'Kilimani', 'Karen', 'Langata'], [5, 5, 4]],
                ['Faith', 'Achieng', 'Nairobi Home Care Fundis', ['Westlands', 'Kilimani', 'Kasarani', 'Embakasi'], [5, 5, 5]],
                ['Brian', 'Kiptoo', 'Jirani Repairs Nairobi', ['Westlands', 'Kilimani', 'Ruiru', 'Kitengela'], [4, 4, 5]],
                ['Zawadi', 'Ali', 'Pwani Home Services', ['Nyali', 'Bamburi'], [5, 4, 5]],
                ['Otieno', 'Ouma', 'Lakeview Repairs Kisumu', ['Milimani'], [4, 5, 4]],
                ['Mercy', 'Wambui', 'Nakuru Reliable Fundis', ['Nakuru Town'], [5, 5, 4]],
                ['Peter', 'Mutua', 'Kitengela Maintenance', ['Kitengela', 'Ruiru'], [4, 4, 4]],
                ['Grace', 'Wanjiru', 'New Neighbourhood Fundis', ['Westlands', 'Kilimani', 'Karen'], []],
            ];
            foreach ($profiles as $index => [$first, $last, $business, $areas, $stars]) {
                $number = $index + 1;
                $email = $number === 1 ? 'tradie@tradify.dev' : "tradie{$number}@tradify.dev";
                $owner = $this->person($email, $first, $last, 'tradie', $number + 2);
                $company = TradieCompany::updateOrCreate(['owner_user_id' => $owner->id], [
                    'business_name' => $business, 'status' => 'approved',
                    'about_text' => 'Fictional Kenyan demo provider. Plumbing, electrical and general home maintenance in '.implode(', ', $areas).'.',
                    'approved_at' => now(), 'approved_by_user_id' => $admin->id,
                    'licence_state' => 'KE',
                    'abn' => 'DEMO-KE-'.str_pad((string) $number, 3, '0', STR_PAD_LEFT),
                    'licence_expires_on' => now()->addYear()->toDateString(),
                    'insurance_expires_on' => now()->addYear()->toDateString(),
                ]);
                TradieSubscription::firstOrCreate(['tradie_company_id' => $company->id, 'status' => 'active'], [
                    'tradie_plan_id' => TradiePlan::where('slug', $number === 2 ? 'premium' : 'standard')->firstOrFail()->id,
                    'start_date' => now()->toDateString(), 'end_date' => now()->addYear()->toDateString(), 'auto_renew' => true,
                ]);
                foreach (TradieCategory::where('is_active', true)->get() as $category) {
                    $company->categories()->updateOrCreate(['tradie_category_id' => $category->id], ['is_active' => true]);
                }
                $company->serviceAreas()->whereHas('suburb', fn ($query) => $query->where('state', 'WA'))->update(['is_active' => false]);
                foreach (Suburb::whereIn('name', $areas)->where('is_active', true)->get() as $area) {
                    TradieServiceArea::withTrashed()->updateOrCreate(['tradie_company_id' => $company->id, 'suburb_id' => $area->id], ['is_active' => true, 'deleted_at' => null]);
                }
                foreach (range(0, 6) as $day) {
                    $company->availability()->updateOrCreate(['day_of_week' => $day], [
                        'opens_at' => '00:00:00', 'closes_at' => '23:59:59', 'accepts_emergency' => true,
                    ]);
                }
                // Each regional history belongs to a matching local demo property.
                $localHome = $home;
                if (! in_array('Westlands', $areas)) {
                    $localMember = $this->person("member{$number}@tradify.dev", $first, $last, 'member', 100 + $number);
                    MemberSubscription::firstOrCreate(['user_id' => $localMember->id, 'status' => 'active'], [
                        'member_plan_id' => MemberPlan::where('slug', 'basic')->firstOrFail()->id,
                        'start_date' => now()->toDateString(), 'end_date' => now()->addYear()->toDateString(), 'auto_renew' => true,
                    ]);
                    $localHome = Property::firstOrCreate(['member_user_id' => $localMember->id, 'label' => 'Demo home'], [
                        'address_line_1' => 'Plot 12 Demo Estate, '.$areas[0], 'suburb_id' => Suburb::where('name', $areas[0])->firstOrFail()->id,
                        'property_type' => 'house', 'is_primary' => true,
                    ]);
                }
                foreach ($stars as $reviewIndex => $rating) {
                    $this->history($company, $localHome, $reviewIndex, $rating, 'confirmed');
                }
                if ($number === 1) {
                    $this->history($company, $home, 10, null, 'assigned');
                    $this->history($company, $home, 11, null, 'in_progress');
                    $this->history($company, $home, 12, null, 'completed');
                }
                if ($number <= 2) {
                    SavedTradie::firstOrCreate(['member_user_id' => $member->id, 'tradie_company_id' => $company->id]);
                }
                $this->performance($company);
                $reviews = Review::where('tradie_company_id', $company->id);
                $company->update(['rating_count' => $reviews->count(), 'rating_average' => $reviews->avg('stars')]);
            }
        });
    }

    private function performance(TradieCompany $company): void
    {
        // Aggregate actual demo/retained records rather than inventing dashboard totals.
        foreach (range(0, 29) as $offset) {
            $day = now()->subDays($offset)->toDateString();
            $offers = JobOffer::where('tradie_company_id', $company->id)->whereDate('offered_at', $day)->get();
            $reports = JobCompletionReport::where('tradie_company_id', $company->id)->whereDate('submitted_at', $day)->get();
            $completed = Job::where('assigned_tradie_company_id', $company->id)->whereDate('completed_at', $day)->count();
            TradiePerformanceDaily::updateOrCreate(['tradie_company_id' => $company->id, 'date' => $day], [
                'leads_offered' => $offers->count(), 'leads_accepted' => $offers->where('status', OfferStatus::Accepted)->count(),
                'leads_declined' => $offers->where('status', OfferStatus::Declined)->count(),
                'leads_expired' => $offers->where('status', OfferStatus::Expired)->count(),
                'jobs_completed' => $completed,
                'reported_revenue_cents' => $reports->sum('invoice_total_cents'),
                'discount_given_cents' => $reports->sum('discount_amount_cents'),
                'avg_response_time_seconds' => $offers->where('status', OfferStatus::Accepted)->avg('response_time_seconds'),
            ]);
        }
    }

    private function person(string $email, string $first, string $last, string $role, int $number): User
    {
        $user = User::firstOrNew(['email' => $email]);
        $user->fill(['first_name' => $first, 'last_name' => $last, 'role' => $role, 'status' => 'active',
            'phone' => '+254700'.str_pad((string) $number, 6, '0', STR_PAD_LEFT),
            'email_verified_at' => now(), 'phone_verified_at' => now()]);
        if (! $user->exists) {
            $user->password = Hash::make('password');
        }
        $user->save();

        return $user;
    }

    private function history(TradieCompany $company, Property $property, int $index, ?int $stars, string $status): void
    {
        $key = '[Demo KE] '.$company->id.'-'.$index;
        if (Job::where('member_user_id', $property->member_user_id)->where('custom_issue', $key)->exists()) {
            return;
        }
        $date = now()->subDays(20 - $index);
        $job = Job::create([
            'member_user_id' => $property->member_user_id, 'property_id' => $property->id,
            'tradie_category_id' => TradieCategory::where('slug', $index % 2 ? 'electrician' : 'plumber')->firstOrFail()->id,
            'custom_issue' => $key, 'urgency' => 'flexible',
            'description' => $index % 2 ? 'Repair the kitchen socket and check the lighting at our demo home.' : 'Repair the leaking kitchen tap and check the water storage tank at our demo home.',
            'status' => $status, 'selected_tradie_company_id' => $company->id, 'assigned_tradie_company_id' => $company->id,
            'submitted_at' => $date, 'dispatched_at' => $date, 'assigned_at' => $date->copy()->addMinutes(2),
            'started_at' => $status !== 'assigned' ? $date->copy()->addHour() : null,
            'completed_at' => in_array($status, ['completed', 'confirmed']) ? $date->copy()->addHours(3) : null,
            'confirmed_at' => $status === 'confirmed' ? $date->copy()->addHours(4) : null, 'dispatch_round' => 1,
        ]);
        JobOffer::create(['job_id' => $job->id, 'tradie_company_id' => $company->id, 'round' => 1, 'rank_in_round' => 1,
            'score' => null, 'status' => 'accepted', 'offered_at' => $date, 'expires_at' => $date->copy()->addHour(),
            'accepted_at' => $date->copy()->addMinutes(2)]);
        JobStatusLog::create(['job_id' => $job->id, 'from_status' => null, 'to_status' => $status,
            'changed_by_system' => true, 'note' => 'Fictional Kenyan demonstration history.', 'created_at' => $date]);
        if (in_array($status, ['completed', 'confirmed'])) {
            JobCompletionReport::create(['job_id' => $job->id, 'tradie_company_id' => $company->id,
                'submitted_by_user_id' => $company->owner_user_id, 'summary_of_work' => 'Completed the requested repair and tested the installation. Fictional demo work.',
                'invoice_total_cents' => 450000, 'no_callout_fee_confirmed' => true,
                'discount_applied' => true, 'discount_amount_cents' => 50000, 'submitted_at' => $date->copy()->addHours(3)]);
        }
        if ($stars !== null) {
            Review::create(['job_id' => $job->id, 'member_user_id' => $property->member_user_id,
                'tradie_company_id' => $company->id, 'stars' => $stars, 'work_completed_status' => 'yes',
                'no_callout_fee_honoured' => true, 'discount_honoured' => 'yes',
                'review_text' => 'Demo review: arrived on time, explained the repair and honoured the member discount.',
                'was_auto_confirmed' => false, 'submitted_at' => $date->copy()->addHours(4)]);
        }
    }
}
