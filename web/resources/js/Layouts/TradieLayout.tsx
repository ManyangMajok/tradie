import React from 'react';
import { LayoutDashboard, Briefcase, ChartNoAxesCombined, MapPin, Calendar, Settings, CreditCard, Wrench } from 'lucide-react';
import WorkspaceLayout from './WorkspaceLayout';
const navigation = [
    { href: '/tradie', label: 'Leads', icon: LayoutDashboard, exact: true, aliases: ['/tradie/leads'] },
    { href: '/tradie/jobs', label: 'My jobs', icon: Briefcase },
    { href: '/tradie/performance', label: 'Performance', icon: ChartNoAxesCombined },
    { href: '/tradie/categories', label: 'Trades', icon: Wrench },
    { href: '/tradie/service-areas', label: 'Service areas', icon: MapPin },
    { href: '/tradie/availability', label: 'Availability', icon: Calendar },
    { href: '/tradie/subscription', label: 'Subscription', icon: CreditCard, aliases: ['/tradie/activate-subscription'] },
    { href: '/tradie/settings', label: 'Settings', icon: Settings },
];
export default function TradieLayout({ children }: { children: React.ReactNode }) {
    return <WorkspaceLayout navigation={navigation} role="Fundi">{children}</WorkspaceLayout>;
}
