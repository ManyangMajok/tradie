<?php

use App\Console\Commands\AutoConfirmStaleJobs;
use App\Console\Commands\SweepExpiredOffers;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Safety-net: expire any offers the queue worker missed
Schedule::command(SweepExpiredOffers::class)->everyMinute();

// Confirm completed jobs with no member review after 7 days
Schedule::command(AutoConfirmStaleJobs::class)->dailyAt('02:00');
