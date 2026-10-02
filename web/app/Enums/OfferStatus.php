<?php

namespace App\Enums;

enum OfferStatus: string
{
    case Pending = 'pending';
    case Offered = 'offered';
    case Viewed = 'viewed';
    case Accepted = 'accepted';
    case Declined = 'declined';
    case Expired = 'expired';
    case Superseded = 'superseded';
}
