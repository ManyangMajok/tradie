<?php

namespace App\Enums;

enum JobStatus: string
{
    case PendingDispatch = 'pending_dispatch';
    case Offered = 'offered';
    case Assigned = 'assigned';
    case TradieOnTheWay = 'tradie_on_the_way';
    case InProgress = 'in_progress';
    case AwaitingClientResponse = 'awaiting_client_response';
    case Rescheduled = 'rescheduled';
    case Completed = 'completed';
    case Confirmed = 'confirmed';
    case Disputed = 'disputed';
    case Cancelled = 'cancelled';
}
