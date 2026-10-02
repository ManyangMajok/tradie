<?php

namespace App\Notifications;

use App\Models\JobOffer;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TradieLeadOffered extends Notification
{
    use Queueable;

    public function __construct(public readonly JobOffer $offer) {}

    public function via(object $notifiable): array
    {
        // SMS (T1) and in_app channels deferred — SMS requires Twilio SDK + TwilioChannel;
        // in_app is Phase 2 broadcast infrastructure. See docs/08-notifications.md §2.4 + footnote ¹.
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $job = $this->offer->job;
        $category = $job->category->name;
        $suburb = $job->property->suburb->name;
        $urgency = ucwords(str_replace('_', ' ', $job->urgency->value));
        $leadUrl = url("/tradie/leads/{$this->offer->id}");

        return (new MailMessage)
            ->subject("New lead — {$urgency} {$category} in {$suburb}")
            ->greeting("New lead, {$notifiable->first_name}!")
            ->line("**{$urgency} {$category}** in {$suburb}")
            ->line('Issue: '.($job->issueType?->name ?? $job->custom_issue ?? 'Not specified'))
            ->line('Description: '.$job->description)
            ->action('View & Accept Lead', $leadUrl)
            ->salutation('— Tradify');
    }
}
