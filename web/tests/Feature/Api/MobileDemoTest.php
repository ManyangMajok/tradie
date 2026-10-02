<?php

use App\Models\Job;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

it('supports Kenyan mobile discovery selection acceptance and owned saved providers', function () {
    Queue::fake();
    Notification::fake();
    $this->seed(DatabaseSeeder::class);
    $member = User::where('email', 'member@tradify.dev')->firstOrFail();
    $token = $this->postJson('/api/v1/auth/login', [
        'email' => $member->email, 'password' => 'password', 'device_name' => 'mobile-test', 'app' => 'member',
    ])->assertOk()->assertJsonPath('user.role', 'member')->json('access_token');
    $this->withToken($token);
    $reference = $this->getJson('/api/v1/member/jobs/create')->assertOk()->json();
    $payload = ['property_id' => $reference['properties'][0]['id'], 'tradie_category_id' => $reference['categories'][0]['id'], 'urgency' => 'flexible'];
    $tradies = $this->getJson('/api/v1/member/jobs/available-tradies?'.http_build_query($payload))->assertOk()->assertJsonPath('location', 'Westlands')->json('tradies');
    expect(count($tradies))->toBe(4);
    expect(array_column($tradies, 'rating_average'))->toBe([5, 4.67, 4.33, null]);
    $this->getJson('/api/v1/member/saved-tradies')->assertOk()->assertJsonCount(2, 'data');
    $this->getJson('/api/v1/member/locations')->assertOk()->assertJsonCount(12, 'data');
    $payload += ['custom_issue' => 'Kitchen tap leak', 'description' => 'The kitchen tap is leaking at our home.'];
    $this->postJson('/api/v1/member/jobs', $payload)->assertUnprocessable();
    $payload['selected_tradie_company_id'] = $tradies[1]['id'];
    $response = $this->postJson('/api/v1/member/jobs', $payload)->assertCreated();
    $job = Job::findOrFail($response->json('job.id'));
    expect($job->offers()->pluck('tradie_company_id')->all())->toBe([$tradies[1]['id']]);
    $this->getJson('/api/v1/member/jobs/'.$job->public_id)->assertOk()->assertJsonPath('data.selected_tradie_company_id', $tradies[1]['id']);
    $offer = $job->offers()->first();
    app('auth')->forgetGuards();
    $this->withToken($offer->company->owner->createToken('tradie-test')->plainTextToken)
        ->postJson('/api/v1/tradie/leads/'.$offer->id.'/accept')->assertOk();
    expect($job->fresh()->assigned_tradie_company_id)->toBe($tradies[1]['id']);
    $this->postJson('/api/v1/tradie/jobs/'.$job->public_id.'/status', ['to_status' => 'tradie_on_the_way'])->assertOk();
    $this->postJson('/api/v1/tradie/jobs/'.$job->public_id.'/status', ['to_status' => 'in_progress'])->assertOk();
    $this->postJson('/api/v1/tradie/jobs/'.$job->public_id.'/complete', [
        'summary_of_work' => 'Replaced the kitchen tap washer.', 'invoice_total_cents' => 450000,
        'no_callout_fee_confirmed' => true, 'discount_applied' => true, 'discount_amount_cents' => 50000,
    ])->assertCreated()->assertJsonPath('report.invoice_total_cents', 450000);
    app('auth')->forgetGuards();
    $this->withToken($token)->postJson('/api/v1/member/jobs/'.$job->public_id.'/review', [
        'stars' => 5, 'review_text' => 'Prompt service in Westlands.', 'work_completed_status' => 'yes',
        'no_callout_fee_honoured' => true, 'discount_honoured' => 'yes',
    ])->assertCreated()->assertJsonPath('job.status', 'confirmed');

});
