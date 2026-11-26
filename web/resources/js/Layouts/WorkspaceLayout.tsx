import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, LogOut, type LucideIcon } from 'lucide-react';
import { Logo } from '../Components/ui/Logo';
import { useAuth } from '../Hooks/useAuth';

export interface WorkspaceNav { href: string; label: string; icon: LucideIcon; exact?: boolean; aliases?: string[] }
export default function WorkspaceLayout({ children, navigation, role }: { children: React.ReactNode; navigation: WorkspaceNav[]; role: string }) {
    const { user } = useAuth();
    const { url, props } = usePage();
    const path = url.split('?')[0];
    const flash = props.flash as { success?: string; error?: string };
    const isActive = (item: WorkspaceNav) => path === item.href || (!item.exact && path.startsWith(item.href + '/')) || item.aliases?.some(alias => path === alias || path.startsWith(alias + '/'));
    const initials = ((user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')).toUpperCase();
    return <div className="workspace min-h-dvh p-2 text-gray-900 sm:p-3">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <div className="workspace-frame mx-auto max-w-screen-2xl rounded-3xl p-3 sm:p-5">
            <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
                <Link href={navigation[0].href} aria-label="TradeFinder home" className="rounded-full bg-white px-4 py-3"><Logo size="sm" /></Link>
                <nav aria-label={`${role} quick navigation`} className="hidden flex-wrap gap-1 rounded-full bg-white p-1.5 xl:flex">
                    {navigation.slice(0, 4).map(item => <Link key={item.href} href={item.href} className="workspace-tab" data-active={isActive(item)} aria-current={isActive(item) ? 'page' : undefined}>{item.label}</Link>)}
                </nav>
                <div className="flex min-w-0 items-center gap-3 rounded-full bg-white px-3 py-2">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800" aria-hidden="true">{initials}</span>
                    <div className="hidden min-w-0 sm:block"><p className="max-w-40 truncate text-sm font-medium">{user?.first_name} {user?.last_name}</p><p className="text-xs text-gray-500">{role} workspace</p></div>
                    <Link href="/logout" method="post" as="button" aria-label="Sign out" title="Sign out" className="rounded-full p-3 text-gray-600 hover:bg-gray-100"><LogOut className="size-4" aria-hidden="true" /></Link>
                </div>
            </header>
            <div className="flex gap-5 lg:gap-7">
                <aside className="hidden w-14 shrink-0 lg:block">
                    <nav aria-label={`${role} navigation`} className="sticky top-5 flex flex-col items-center gap-2 rounded-full bg-white py-3">
                        {navigation.map(({ icon: Icon, ...item }) => <Link key={item.href} href={item.href} title={item.label} aria-label={item.label} aria-current={isActive({ ...item, icon: Icon }) ? 'page' : undefined} data-active={isActive({ ...item, icon: Icon })} className="workspace-rail-link"><Icon className="size-5" aria-hidden="true" /><span className="rail-label">{item.label}</span></Link>)}
                    </nav>
                </aside>
                <div className="min-w-0 flex-1">
                    <nav aria-label={`${role} mobile navigation`} className="mb-6 flex flex-wrap gap-2 lg:hidden">
                        {navigation.map(item => <Link key={item.href} href={item.href} className="workspace-tab bg-white" data-active={isActive(item)} aria-current={isActive(item) ? 'page' : undefined}>{item.label}</Link>)}
                    </nav>
                    <main id="main-content" tabIndex={-1} className="min-w-0 pb-6 outline-none">
                        {flash?.success && <p role="status" className="mb-5 rounded-2xl bg-green-50 p-4 text-sm text-green-800">{flash.success}</p>}
                        {flash?.error && <p role="alert" className="mb-5 rounded-2xl bg-red-50 p-4 text-sm text-red-800">{flash.error}</p>}
                        {children}
                    </main>
                    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 py-4 text-xs text-gray-500"><span>TradeFinder · Local expertise, closer to home.</span><span className="inline-flex items-center gap-1">Your {role.toLowerCase()} workspace <ArrowUpRight className="size-3" aria-hidden="true" /></span></footer>
                </div>
            </div>
        </div>
    </div>;
}
