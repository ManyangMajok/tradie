import React from 'react';
import { Home, Wrench, Star, CreditCard, Building2, Settings } from 'lucide-react';
import WorkspaceLayout from './WorkspaceLayout';
const navigation = [
    { href: '/dashboard', label: 'Overview', icon: Home },
    { href: '/jobs', label: 'My jobs', icon: Wrench },
    { href: '/properties', label: 'Properties', icon: Building2 },
    { href: '/saved-tradies', label: 'Saved fundis', icon: Star },
    { href: '/membership', label: 'Membership', icon: CreditCard },
    { href: '/settings', label: 'Settings', icon: Settings },
];
export default function MemberLayout({ children }: { children: React.ReactNode }) {
    return <WorkspaceLayout navigation={navigation} role="Client">{children}</WorkspaceLayout>;
}
