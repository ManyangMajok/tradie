<?php

namespace App\Notifications;

use App\Models\Job;
use App\Models\Review;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TradieJobDisputed extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Job $job,
        public readonly Review $review,
    ) {}

    public function via(object $notifiable): array
    {
        // in_app (T5) is Phase 2 broadcast infrastructure. See docs/08-notifications.md §2.9.
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $workStatus = ucwords(str_replace('_', ' ', $this->review->work_completed_status));

        return (new MailMessage)
            ->subject("Dispute raised on job {$this->job->public_id}")
            ->greeting("Hi {$notifiable->first_name},")
            ->line("A member has raised a concern about job {$this->job->public_id}.")
            ->line('Their review:')
            ->line("- Work completed: {$workStatus}")
            ->line('- Call-out fee waived: '.($this->review->no_callout_fee_honoured ? 'Yes' : 'No'))
            ->line("- Discount applied: {$this->review->discount_honoured}")
            ->line('"'.($this->review->review_text ?? '(no comment)').'"')
            ->line('Our team will review this and may contact you. In the meantime, new leads to your business are paused pending review.')
            ->line("If you'd like to respond first, reply to this email.")
            ->salutation('— Tradify');
    }
}
