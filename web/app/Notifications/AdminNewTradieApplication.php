<?php

namespace App\Notifications;

use App\Models\TradieCompany;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminNewTradieApplication extends Notification
{
    use Queueable;

    public function __construct(public readonly TradieCompany $company) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $owner = $this->company->owner;
        $adminUrl = url('/admin/applications');

        return (new MailMessage)
            ->subject('New tradie application — '.$this->company->business_name)
            ->greeting('New application received')
            ->line("{$owner->first_name} {$owner->last_name} has applied as a tradie.")
            ->line('**Business:** '.$this->company->business_name)
            ->line('**Email:** '.$owner->email)
            ->line('**Phone:** '.$owner->phone)
            ->action('Review application', $adminUrl)
            ->salutation('Tradify Admin');
    }
}
