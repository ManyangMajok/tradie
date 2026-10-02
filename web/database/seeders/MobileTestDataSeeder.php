<?php

namespace Database\Seeders;

use App\Enums\JobStatus;
use App\Enums\OfferStatus;
use App\Enums\Urgency;
use App\Models\IssueType;
use App\Models\Job;
use App\Models\JobOffer;
use App\Models\JobStatusLog;
use App\Models\Property;
use App\Models\Suburb;
use App\Models\TradieCategory;
use App\Models\TradieCompany;
use App\Models\TradiePerformanceDaily;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeds realistic test data for mobile app development.
 *
 * Run: php artisan db:seed --class=MobileTestDataSeeder
 *
 * Pre-requisites: DatabaseSeeder must have already run (suburbs, categories, plans, dev users).
 */
class MobileTestDataSeeder extends Seeder
{
    public function run(): void
    {
        $member = User::where('email', 'member@tradify.dev')->firstOrFail();
        $tradie = User::where('email', 'tradie@tradify.dev')->firstOrFail();
        $tradie2 = User::where('email', 'tradie2@tradify.dev')->firstOrFail();
        $tradieCompany = $tradie->tradieCompany;
        $tradieCompany2 = $tradie2->tradieCompany;

        $this->createProperties($member);
        $this->createActiveLeads($member, $tradieCompany, $tradieCompany2);
        $this->createJobsInVariousStates($member, $tradieCompany);
        $this->createPerformanceData($tradieCompany);

        $this->command->info('✓ Mobile test data seeded successfully.');
        $this->command->info('  • Properties: '.Property::where('member_user_id', $member->id)->count());
        $this->command->info('  • Jobs: '.Job::where('member_user_id', $member->id)->count());
        $this->command->info('  • Active leads (offers): '.JobOffer::where('tradie_company_id', $tradieCompany->id)->whereIn('status', ['offered', 'viewed'])->count());
        $this->command->info('  • Performance rows: '.TradiePerformanceDaily::where('tradie_company_id', $tradieCompany->id)->count());
    }

    private function createProperties(User $member): void
    {
        $suburbs = Suburb::where('state', 'WA')->where('is_active', true)->limit(3)->get();

        Property::updateOrCreate(
            ['member_user_id' => $member->id, 'label' => 'My Home'],
            [
                'address_line_1' => '14 Swan River Way',
                'suburb_id' => $suburbs[0]->id,
                'property_type' => 'house',
                'is_primary' => true,
                'access_notes' => 'Ring doorbell. Dog in backyard — friendly but noisy.',
            ]
        );

        Property::updateOrCreate(
            ['member_user_id' => $member->id, 'label' => 'Investment Unit'],
            [
                'address_line_1' => '8/42 Marine Terrace',
                'suburb_id' => $suburbs[1]->id ?? $suburbs[0]->id,
                'property_type' => 'apartment',
                'gate_code' => '4521#',
                'access_notes' => 'Unit 8, third floor. Tenant is home weekdays after 5pm.',
            ]
        );

        if (isset($suburbs[2])) {
            Property::updateOrCreate(
                ['member_user_id' => $member->id, 'label' => 'Rental Property'],
                [
                    'address_line_1' => '27 Banksia Crescent',
                    'suburb_id' => $suburbs[2]->id,
                    'property_type' => 'house',
                    'access_notes' => 'Key under the blue pot at the front door.',
                ]
            );
        }
    }

    private function createActiveLeads(User $member, TradieCompany $company1, TradieCompany $company2): void
    {
        $plumber = TradieCategory::where('slug', 'plumber')->first();
        $electrician = TradieCategory::where('slug', 'electrician')->first();
        $property = Property::where('member_user_id', $member->id)->first();
        $plumbingIssue = IssueType::where('tradie_category_id', $plumber?->id)->first();

        if (! $property || ! $plumber) {
            return;
        }

        // Lead 1: Emergency plumbing — urgent, expires soon
        $job1 = Job::create([
            'member_user_id' => $member->id,
            'property_id' => $property->id,
            'tradie_category_id' => $plumber->id,
            'issue_type_id' => $plumbingIssue?->id,
            'urgency' => Urgency::Emergency,
            'description' => 'Burst pipe under kitchen sink — water spraying everywhere. Need someone ASAP.',
            'status' => JobStatus::Offered,
            'submitted_at' => now()->subMinutes(3),
            'dispatched_at' => now()->subMinutes(2),
            'dispatch_round' => 1,
        ]);

        JobOffer::create([
            'job_id' => $job1->id,
            'tradie_company_id' => $company1->id,
            'status' => OfferStatus::Offered,
            'offered_at' => now()->subMinutes(2),
            'expires_at' => now()->addMinutes(2), // 2 min countdown
            'score' => 87.5,
            'round' => 1,
            'rank_in_round' => 1,
        ]);

        // Lead 2: Same-day electrical — moderate urgency
        if ($electrician) {
            $electricalIssue = IssueType::where('tradie_category_id', $electrician->id)->first();

            $job2 = Job::create([
                'member_user_id' => $member->id,
                'property_id' => $property->id,
                'tradie_category_id' => $electrician->id,
                'issue_type_id' => $electricalIssue?->id,
                'urgency' => Urgency::SameDay,
                'description' => 'Power outlet in master bedroom stopped working. Might be a tripped circuit?',
                'status' => JobStatus::Offered,
                'submitted_at' => now()->subMinutes(20),
                'dispatched_at' => now()->subMinutes(18),
                'dispatch_round' => 1,
            ]);

            JobOffer::create([
                'job_id' => $job2->id,
                'tradie_company_id' => $company1->id,
                'status' => OfferStatus::Offered,
                'offered_at' => now()->subMinutes(5),
                'expires_at' => now()->addMinutes(15), // 15 min window
                'score' => 72.0,
                'round' => 1,
                'rank_in_round' => 1,
            ]);
        }

        // Lead 3: Flexible plumbing — already viewed
        $job3 = Job::create([
            'member_user_id' => $member->id,
            'property_id' => $property->id,
            'tradie_category_id' => $plumber->id,
            'urgency' => Urgency::Flexible,
            'description' => 'Slow draining shower. Been getting worse over the past week.',
            'status' => JobStatus::Offered,
            'submitted_at' => now()->subHours(2),
            'dispatched_at' => now()->subHours(2),
            'dispatch_round' => 1,
        ]);

        JobOffer::create([
            'job_id' => $job3->id,
            'tradie_company_id' => $company1->id,
            'status' => OfferStatus::Viewed,
            'offered_at' => now()->subHour(),
            'viewed_at' => now()->subMinutes(30),
            'expires_at' => now()->addMinutes(30),
            'score' => 65.0,
            'round' => 1,
            'rank_in_round' => 1,
        ]);
    }

    private function createJobsInVariousStates(User $member, TradieCompany $company): void
    {
        $property = Property::where('member_user_id', $member->id)->first();
        $plumber = TradieCategory::where('slug', 'plumber')->first();
        $electrician = TradieCategory::where('slug', 'electrician')->first();

        if (! $property || ! $plumber) {
            return;
        }

        // Job A: Assigned — tradie on the way
        $jobA = Job::create([
            'member_user_id' => $member->id,
            'property_id' => $property->id,
            'tradie_category_id' => $plumber->id,
            'urgency' => Urgency::SameDay,
            'description' => 'Hot water system not heating. Tank model — Rheem 250L.',
            'status' => JobStatus::TradieOnTheWay,
            'submitted_at' => now()->subHours(4),
            'dispatched_at' => now()->subHours(4),
            'assigned_tradie_company_id' => $company->id,
            'assigned_at' => now()->subHours(3),
            'on_the_way_at' => now()->subMinutes(20),
        ]);

        $this->logStatusChange($jobA, null, JobStatus::PendingDispatch);
        $this->logStatusChange($jobA, JobStatus::PendingDispatch, JobStatus::Offered);
        $this->logStatusChange($jobA, JobStatus::Offered, JobStatus::Assigned);
        $this->logStatusChange($jobA, JobStatus::Assigned, JobStatus::TradieOnTheWay);

        // Job B: In Progress
        $jobB = Job::create([
            'member_user_id' => $member->id,
            'property_id' => $property->id,
            'tradie_category_id' => $plumber->id,
            'urgency' => Urgency::Within48h,
            'description' => 'Leaking tap in bathroom. Drip drip drip. Driving me nuts.',
            'status' => JobStatus::InProgress,
            'submitted_at' => now()->subDay(),
            'dispatched_at' => now()->subDay(),
            'assigned_tradie_company_id' => $company->id,
            'assigned_at' => now()->subHours(22),
            'on_the_way_at' => now()->subHours(3),
            'started_at' => now()->subHours(2),
        ]);

        $this->logStatusChange($jobB, null, JobStatus::PendingDispatch);
        $this->logStatusChange($jobB, JobStatus::PendingDispatch, JobStatus::Assigned);
        $this->logStatusChange($jobB, JobStatus::Assigned, JobStatus::TradieOnTheWay);
        $this->logStatusChange($jobB, JobStatus::TradieOnTheWay, JobStatus::InProgress);

        // Job C: Completed (awaiting member review)
        $jobC = Job::create([
            'member_user_id' => $member->id,
            'property_id' => $property->id,
            'tradie_category_id' => $electrician?->id ?? $plumber->id,
            'urgency' => Urgency::Flexible,
            'description' => 'Install new downlights in living room. 6 x LED recessed.',
            'status' => JobStatus::Completed,
            'submitted_at' => now()->subDays(5),
            'dispatched_at' => now()->subDays(5),
            'assigned_tradie_company_id' => $company->id,
            'assigned_at' => now()->subDays(4),
            'started_at' => now()->subDays(3),
            'completed_at' => now()->subDays(2),
        ]);

        $this->logStatusChange($jobC, null, JobStatus::PendingDispatch);
        $this->logStatusChange($jobC, JobStatus::PendingDispatch, JobStatus::Assigned);
        $this->logStatusChange($jobC, JobStatus::Assigned, JobStatus::InProgress);
        $this->logStatusChange($jobC, JobStatus::InProgress, JobStatus::Completed);

        // Job D: Confirmed (completed + reviewed)
        $jobD = Job::create([
            'member_user_id' => $member->id,
            'property_id' => $property->id,
            'tradie_category_id' => $plumber->id,
            'urgency' => Urgency::SameDay,
            'description' => 'Blocked toilet downstairs. Plunger not working.',
            'status' => JobStatus::Confirmed,
            'submitted_at' => now()->subWeeks(2),
            'dispatched_at' => now()->subWeeks(2),
            'assigned_tradie_company_id' => $company->id,
            'assigned_at' => now()->subDays(13),
            'started_at' => now()->subDays(13),
            'completed_at' => now()->subDays(12),
            'confirmed_at' => now()->subDays(11),
        ]);

        $this->logStatusChange($jobD, null, JobStatus::PendingDispatch);
        $this->logStatusChange($jobD, JobStatus::PendingDispatch, JobStatus::Assigned);
        $this->logStatusChange($jobD, JobStatus::Assigned, JobStatus::Completed);
        $this->logStatusChange($jobD, JobStatus::Completed, JobStatus::Confirmed);

        // Job E: Cancelled by member
        Job::create([
            'member_user_id' => $member->id,
            'property_id' => $property->id,
            'tradie_category_id' => $plumber->id,
            'urgency' => Urgency::Flexible,
            'description' => 'Dripping outdoor tap — actually fixed it myself.',
            'status' => JobStatus::Cancelled,
            'submitted_at' => now()->subWeeks(3),
            'cancelled_at' => now()->subWeeks(3)->addHours(2),
            'cancellation_reason' => 'Fixed it myself',
        ]);
    }

    private function createPerformanceData(TradieCompany $company): void
    {
        // 30 days of performance data
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();

            TradiePerformanceDaily::updateOrCreate(
                ['tradie_company_id' => $company->id, 'date' => $date],
                [
                    'leads_offered' => $offered = rand(0, 4),
                    'leads_accepted' => $accepted = rand(0, $offered),
                    'leads_declined' => rand(0, max(0, $offered - $accepted)),
                    'leads_expired' => max(0, $offered - $accepted - rand(0, 1)),
                    'jobs_completed' => rand(0, $accepted),
                    'jobs_disputed' => rand(0, 1) > 0.9 ? 1 : 0,
                    'reported_revenue_cents' => rand(0, $accepted) * rand(15000, 85000),
                    'avg_response_time_seconds' => $offered > 0 ? rand(30, 300) : null,
                ]
            );
        }
    }

    private function logStatusChange(Job $job, ?JobStatus $from, JobStatus $to): void
    {
        JobStatusLog::create([
            'job_id' => $job->id,
            'from_status' => $from,
            'to_status' => $to,
            'changed_by_user_id' => $job->member_user_id,
            'changed_by_system' => true,
        ]);
    }
}
