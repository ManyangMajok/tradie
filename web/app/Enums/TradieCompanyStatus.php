<?php

namespace App\Enums;

enum TradieCompanyStatus: string
{
    case PendingReview = 'pending_review';
    case Approved = 'approved';
    case Suspended = 'suspended';
    case Rejected = 'rejected';
}
