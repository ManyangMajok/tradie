<?php

namespace App\Notifications;

use App\Models\Job;
use App\Models\Review;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminJobDisputed extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Job $job,
        public readonly Review $review,
    ) {}

    public function via(object $notifiable): array
    {
        // in_app (X3) is Phase 2 broadcast infrastructure. See docs/08-notifications.md §2.
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $company = $this->job->assignedCompany;

        return (new MailMessage)
            ->subject("Job dispute requires review — {$this->job->public_id}")
            ->greeting('Admin alert,')
            ->line("Job {$this->job->public_id} ({$company->business_name}) has been disputed by the member.")
            ->line('Review summary:')
            ->line("- Work completed: {$this->review->work_completed_status}")
            ->line('- Call-out fee honoured: '.($this->review->no_callout_fee_honoured ? 'Yes' : 'No'))
            ->line("- Discount honoured: {$this->review->discount_honoured}")
            ->line("- Stars: {$this->review->stars}/5")
            ->line('"'.($this->review->review_text ?? '(no comment)').'"')
            ->salutation('— Tradify System');
    }
}
