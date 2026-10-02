<?php

namespace App\Notifications;

use App\Models\Job;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MemberJobAutoConfirmed extends Notification
{
    use Queueable;

    public function __construct(public readonly Job $job) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $company = $this->job->assignedCompany;

        return (new MailMessage)
            ->subject("Your job with {$company->business_name} has been confirmed")
            ->greeting("Hi {$notifiable->first_name},")
            ->line("Your recent job with {$company->business_name} was marked complete 7 days ago. Since we didn't hear back, we've assumed everything went fine.")
            ->line("If there was an issue, reply to this email and we'll take a look.")
            ->salutation('— TradeFinder');
    }
}
