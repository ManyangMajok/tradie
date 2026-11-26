import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Logo } from '../../Components/ui/Logo';
import { NavItem, linkClass } from './types';

export default function Layout({ children, navigation }: {children: React.ReactNode; navigation: NavItem[]}) {
    const { url, props } = usePage();
    const flash = props.flash as {success?: string; error?: string};
    return <div className="min-h-dvh bg-gray-50 text-gray-900">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:block focus:bg-white focus:p-3">Skip to content</a>
        <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
                <Link href="/admin" aria-label="TradeFinder admin home"><Logo /></Link>
                <div className="flex items-center gap-5"><span className="text-sm text-gray-600">Admin workspace</span><Link href="/logout" method="post" as="button" className={linkClass}>Sign out</Link></div>
            </div>
        </header>
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[14rem_1fr]">
            <nav aria-label="Admin navigation" className="self-start rounded-xl border border-gray-200 bg-white p-3">
                {[{key:'',label:'Overview'},...navigation].map(item => {
                    const href='/admin'+(item.key ? '/'+item.key : '');
                    const active=item.key ? url.startsWith(href) : url === href;
                    return <Link key={item.key} href={href} aria-current={active ? 'page' : undefined} className={active ? 'block rounded-lg bg-brand-50 px-3 py-3 font-medium text-brand-800 focus-visible:outline-2' : 'block rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100 focus-visible:outline-2'}>{item.label}</Link>;
                })}
            </nav>
            <main id="main-content" className="min-w-0">
                {flash?.success && <p role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">{flash.success}</p>}
                {flash?.error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{flash.error}</p>}
                {children}
            </main>
        </div>
    </div>;
}
