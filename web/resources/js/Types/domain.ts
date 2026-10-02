export type UserRole = 'admin' | 'member' | 'tradie';
export type UserStatus = 'active' | 'suspended' | 'pending_verification';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete' | 'paused';
export type PropertyType = 'house' | 'apartment' | 'townhouse' | 'duplex' | 'commercial' | 'other';
export type JobStatus =
    | 'pending_dispatch'
    | 'offered'
    | 'assigned'
    | 'tradie_on_the_way'
    | 'in_progress'
    | 'awaiting_client_response'
    | 'rescheduled'
    | 'completed'
    | 'confirmed'
    | 'disputed'
    | 'cancelled';
export type OfferStatus = 'pending' | 'offered' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'superseded';

export interface AuthUser {
    id: number;
    role: UserRole;
    status: UserStatus;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    email_verified_at: string | null;
}

export interface MemberPlan {
    id: number;
    slug: string;
    name: string;
    yearly_price_cents: number;
    max_properties: number | null;
    includes_discount: boolean;
    discount_percent: number;
    priority_dispatch: boolean;
    stripe_price_id: string | null;
}

export interface MemberSubscription {
    id: number;
    status: SubscriptionStatus;
    plan: { name: string; yearly_price_cents: number };
    start_date: string | null;
    end_date: string | null;
    auto_renew: boolean;
    canceled_at: string | null;
}

export interface Suburb {
    id: number;
    name: string;
    postcode: string;
    state: string;
}

export interface Property {
    id: number;
    label: string;
    address_line_1: string;
    address_line_2: string | null;
    suburb_id: number;
    property_type: PropertyType;
    is_primary: boolean;
}
