<?php

namespace App\Notifications;

use App\Models\TradieCompany;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TradieApplicationApproved extends Notification
{
    use Queueable;

    public function __construct(public readonly TradieCompany $company) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $loginUrl = url('/login');

        return (new MailMessage)
            ->subject('Your Tradify application has been approved!')
            ->greeting("Welcome to Tradify, {$notifiable->first_name}!")
            ->line('Your application for **'.$this->company->business_name.'** has been approved.')
            ->line('Log in to activate your subscription and start receiving leads.')
            ->action('Log in and activate', $loginUrl)
            ->line('Questions? Reply to this email.')
            ->salutation('The Tradify Team');
    }
}
