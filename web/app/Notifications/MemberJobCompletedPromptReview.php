<?php

namespace App\Notifications;

use App\Models\Job;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MemberJobCompletedPromptReview extends Notification
{
    use Queueable;

    public function __construct(public readonly Job $job) {}

    public function via(object $notifiable): array
    {
        // SMS (J4) requires Twilio SDK + TwilioChannel; in_app is Phase 2.
        // See docs/08-notifications.md §2.5 and footnote ¹.
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $company = $this->job->assignedCompany;
        $reviewUrl = url("/jobs/{$this->job->public_id}");

        return (new MailMessage)
            ->subject("How did it go with {$company->business_name}?")
            ->greeting("Hi {$notifiable->first_name},")
            ->line("{$company->business_name} has marked your job complete.")
            ->line('Quick 1-min check: was the call-out fee waived and your discount applied?')
            ->action('Leave your review', $reviewUrl)
            ->salutation('— TradeFinder');
    }
}
