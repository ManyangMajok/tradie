<?php

namespace App\Notifications;

use App\Models\Job;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MemberTradieOnTheWay extends Notification
{
    use Queueable;

    public function __construct(public readonly Job $job) {}

    public function via(object $notifiable): array
    {
        // SMS (J3) requires Twilio SDK + TwilioChannel; in_app is Phase 2.
        // See docs/08-notifications.md §2 and footnote ¹.
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $company = $this->job->assignedCompany;
        $property = $this->job->property;

        return (new MailMessage)
            ->subject('Your tradie is on the way')
            ->greeting("Hi {$notifiable->first_name},")
            ->line("{$company->business_name} is on their way to {$property->address_line_1}, {$property->suburb->name}.")
            ->action('View job', url("/jobs/{$this->job->public_id}"))
            ->salutation('— Tradify');
    }
}
