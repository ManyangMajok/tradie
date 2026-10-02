export const OFFER_EXPIRY_MINUTES = 15;
export const DISPUTE_SLA_HOURS = 48;
export const AUTO_CONFIRM_DAYS = 7;

export const JOB_STATUS_LABELS: Record<string, string> = {
  pending_dispatch: 'Finding Tradie',
  offered: 'Offer Sent',
  assigned: 'Assigned',
  tradie_on_the_way: 'On the Way',
  in_progress: 'In Progress',
  completed: 'Completed',
  awaiting_client_response: 'Awaiting Review',
  confirmed: 'Confirmed',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
};

export const URGENCY_LABELS: Record<string, string> = {
  emergency: 'Emergency',
  same_day: 'Same Day',
  within_48h: 'Within 48h',
  flexible: 'Flexible',
};

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
