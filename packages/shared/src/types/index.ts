// Core domain types — mirror the backend Eloquent models

export type UserRole = 'member' | 'tradie' | 'admin';

export interface AuthUser {
  id: number;
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

export type JobStatus =
  | 'pending_dispatch'
  | 'offered'
  | 'assigned'
  | 'tradie_on_the_way'
  | 'in_progress'
  | 'completed'
  | 'awaiting_client_response'
  | 'confirmed'
  | 'disputed'
  | 'cancelled';

export type UrgencyLevel = 'emergency' | 'same_day' | 'within_48h' | 'flexible';

export interface Job {
  id: number;
  public_id: string;
  status: JobStatus;
  urgency: UrgencyLevel;
  title: string;
  description: string;
  address_line_1: string;
  suburb: string;
  state: string;
  postcode: string;
  created_at: string;
  scheduled_for: string | null;
  assigned_tradie?: TradieCompanySummary;
  category: string;
  issue_type: string;
  photo_urls: string[];
  // Present on job detail (post-accept); null on lead cards
  member_first_name: string | null;
  member_last_name: string | null;
  member_phone: string | null;
}

export interface TradieCompanySummary {
  id: number;
  business_name: string;
  rating_average: number | null;
  rating_count: number;
  is_premium: boolean;
}

export type OfferStatus = 'pending' | 'offered' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'superseded';

export interface JobOffer {
  id: number;
  public_id: string;
  status: OfferStatus;
  offered_at: string;
  expires_at: string;
  job: Job;
  rank: number;
}

export interface TradieSubscription {
  status: 'active' | 'past_due' | 'cancelled' | 'expired';
  plan_name: string;
  plan_slug: string;
  yearly_price_cents: number;
  dispatch_rank_boost: number;
  featured_listing: boolean;
  end_date: string;
  auto_renew: boolean;
}

export interface PerformanceStats {
  leads_offered: number;
  leads_accepted: number;
  leads_declined: number;
  leads_expired: number;
  jobs_completed: number;
  jobs_disputed: number;
  acceptance_rate: number | null;
  avg_response_minutes: number | null;
  reported_revenue_cents: number;
  rating_average: number | null;
  rating_count: number;
}

export interface ServiceArea {
  id: number;
  suburb_id: number;
  suburb_name: string;
  postcode: string;
  state: string;
}

export interface TradieCategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
}

export interface AvailabilitySlot {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  is_available: boolean;
  start_time: string; // "08:00"
  end_time: string;   // "17:00"
}

export interface Property {
  id: number;
  label: string;
  address_line_1: string;
  suburb: string;
  state: string;
  postcode: string;
  property_type: 'house' | 'unit' | 'townhouse' | 'commercial' | 'other';
  is_primary: boolean;
}

export interface MemberSubscription {
  status: 'active' | 'past_due' | 'cancelled';
  plan_name: string;
  yearly_price_cents: number;
  end_date: string;
  auto_renew: boolean;
}
