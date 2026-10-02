<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TradieApplicationRejected extends Notification
{
    use Queueable;

    public function __construct(public readonly string $reason = '') {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('Your Tradify application was not approved')
            ->greeting("Hi {$notifiable->first_name},")
            ->line('After reviewing your application, we are unable to approve it at this time.');

        if ($this->reason) {
            $message->line('**Reason:** '.$this->reason);
        }

        return $message
            ->line('If you believe this is an error, please reply to this email.')
            ->salutation('The Tradify Team');
    }
}
