<?php

namespace App\Notifications;

use App\Models\Job;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminJobUnassigned extends Notification
{
    use Queueable;

    public function __construct(public readonly Job $job) {}

    public function via(object $notifiable): array
    {
        // in_app channel is Phase 2. See docs/08-notifications.md §2.7.
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $job = $this->job->load(['member', 'category', 'property.suburb', 'offers.company']);
        $member = $job->member;
        $category = $job->category->name;
        $suburb = $job->property->suburb->name;
        $urgency = ucwords(str_replace('_', ' ', $job->urgency->value));
        $adminUrl = url("/admin/jobs/{$job->public_id}");

        $offerLines = $job->offers->map(function ($offer) {
            $company = $offer->company->business_name ?? '(unknown)';
            $status = ucwords(str_replace('_', ' ', $offer->status->value));
            $time = $offer->offered_at?->format('d/m H:i');

            return "- {$company} — {$status} at {$time}";
        })->implode("\n");

        return (new MailMessage)
            ->subject("🚨 Job requires manual assignment: {$job->public_id}")
            ->greeting('Action required,')
            ->line($job->selected_tradie_company_id
                ? "Job **{$job->public_id}** is waiting for the member to choose another tradie. Their previous choice did not accept."
                : "Job **{$job->public_id}** needs manual assignment — all dispatch rounds exhausted.")
            ->line("**Member:** {$member->full_name} ({$member->phone})")
            ->line("**Category:** {$category}")
            ->line("**Suburb:** {$suburb}")
            ->line("**Urgency:** {$urgency}")
            ->line("**Rounds attempted:** {$job->dispatch_round}")
            ->line('**Submitted:** '.$job->submitted_at?->format('d/m/Y H:i'))
            ->line("**Tradies offered (none accepted):**\n{$offerLines}")
            ->action('Assign manually', $adminUrl)
            ->salutation('— Tradify System');
    }
}
