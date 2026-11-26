import React from 'react';
import { LayoutDashboard, Users, Wrench, House, Briefcase, MapPin, Shapes, ListChecks, type LucideIcon } from 'lucide-react';
import WorkspaceLayout from '../../Layouts/WorkspaceLayout';
import { NavItem } from './types';
const icons: Record<string, LucideIcon> = { people: Users, fundis: Wrench, properties: House, jobs: Briefcase, locations: MapPin, categories: Shapes, 'issue-types': ListChecks };
export default function Layout({ children, navigation }: { children: React.ReactNode; navigation: NavItem[] }) {
    const items = [{ href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true }, ...navigation.map(item => ({ href: '/admin/' + item.key, label: item.label, icon: icons[item.key] ?? Shapes }))];
    return <WorkspaceLayout navigation={items} role="Admin">{children}</WorkspaceLayout>;
}
