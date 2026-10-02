<?php

namespace App\Notifications;

use App\Models\Job;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TradieDisputeResolvedWarning extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Job $job,
        public readonly string $actionOnTradie,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $actionText = match ($this->actionOnTradie) {
            'warn' => 'This is a formal warning. Further disputes may result in suspension.',
            'suspend_7d' => 'Your account has been suspended for 7 days. During this time you will not receive new leads.',
            'suspend_indefinite' => 'Your account has been suspended. Please contact us to discuss reinstatement.',
            default => '',
        };

        return (new MailMessage)
            ->subject("Dispute resolved — job {$this->job->public_id}")
            ->greeting("Hi {$notifiable->first_name},")
            ->line("The dispute raised on job {$this->job->public_id} has been reviewed by our team.")
            ->line($actionText)
            ->line('If you have questions, reply to this email.')
            ->salutation('— TradeFinder');
    }
}
