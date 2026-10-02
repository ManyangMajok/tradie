<?php

namespace App\Notifications;

use App\Models\Job;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MemberJobDelayed extends Notification
{
    use Queueable;

    public function __construct(public readonly Job $job) {}

    // Dispute SLA: admin responds within 48 hours (docs/01-product-spec.md §1.8).
    private const DISPUTE_SLA = '48 hours';

    public function via(object $notifiable): array
    {
        // SMS (J6) requires Twilio SDK + TwilioChannel — deferred (footnote ¹ in 08-notifications.md).
        // in_app channel is Phase 2 broadcast infrastructure.
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $category = $this->job->category->name;
        $suburb = $this->job->property->suburb->name;

        if ($this->job->selected_tradie_company_id !== null) {
            return (new MailMessage)
                ->subject("Choose another tradie — {$this->job->public_id}")
                ->greeting("Hi {$notifiable->first_name},")
                ->line("Your chosen {$category} tradie could not accept your request in {$suburb}.")
                ->line('Open your request to choose another available tradie. Our team has also been notified.')
                ->action('Choose another tradie', url("/jobs/{$this->job->public_id}"));
        }

        return (new MailMessage)
            ->subject("Update on your {$category} request — {$this->job->public_id}")
            ->greeting("Hi {$notifiable->first_name},")
            ->line("We're having trouble finding an available {$category} tradie in {$suburb} right now.")
            ->line('Our team has been alerted and will personally review your request and find you a tradie within **'.self::DISPUTE_SLA.'**.')
            ->line("Your job reference: **{$this->job->public_id}**")
            ->action('View your request', url("/jobs/{$this->job->public_id}"))
            ->line('Sorry for the wait — we appreciate your patience.')
            ->salutation('— Tradify');
    }
}
