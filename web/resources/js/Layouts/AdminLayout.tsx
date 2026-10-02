import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, Briefcase, Users, UserCheck, ShieldAlert, BarChart2, MapPin, Tag, List, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../Hooks/useAuth';
import { Logo } from '../Components/ui/Logo';

const nav = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/admin/tradies', label: 'Tradies', icon: Users },
    { href: '/admin/applications', label: 'Applications', icon: UserCheck },
    { href: '/admin/disputes', label: 'Disputes', icon: ShieldAlert },
    { href: '/admin/metrics', label: 'Metrics', icon: BarChart2 },
    { href: '/admin/suburbs', label: 'Suburbs', icon: MapPin },
    { href: '/admin/categories', label: 'Categories', icon: Tag },
    { href: '/admin/issue-types', label: 'Issue Types', icon: List },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { flash, url } = usePage().props as any;
    const currentUrl: string = url ?? (typeof window !== 'undefined' ? window.location.pathname : '');
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-600 focus:shadow focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
                Skip to main content
            </a>

            <aside
                id="admin-sidebar"
                aria-label="Admin navigation"
                className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white shadow-md transition-transform lg:static lg:translate-x-0 ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-16 items-center border-b border-gray-100 px-6">
                    <Link href="/admin">
                        <Logo size="sm" />
                    </Link>
                </div>
                <nav aria-label="Admin menu" className="mt-4 px-3 space-y-0.5">
                    {nav.map(({ href, label, icon: Icon }) => {
                        const active = href === '/admin'
                            ? currentUrl === '/admin'
                            : currentUrl === href || currentUrl.startsWith(href + '/');
                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-current={active ? 'page' : undefined}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-brand-50 text-brand-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                } focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500`}
                            >
                                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4">
                    <div className="mb-2 text-xs text-gray-500">{user?.email}</div>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500"
                    >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Sign out
                    </Link>
                </div>
            </aside>

            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/30 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            <div className="flex flex-1 flex-col min-w-0">
                <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 lg:px-6">
                    <button
                        className="rounded-md p-1 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 lg:hidden"
                        onClick={() => setMobileOpen((v) => !v)}
                        aria-expanded={mobileOpen}
                        aria-controls="admin-sidebar"
                        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    >
                        {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                    </button>
                    <div className="ml-auto text-sm font-medium text-gray-700">
                        Admin — {user?.first_name} {user?.last_name}
                    </div>
                </header>

                <main id="main-content" className="flex-1 p-4 lg:p-6">
                    {flash?.success && (
                        <div role="status" aria-live="polite" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                            {flash.error}
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}
