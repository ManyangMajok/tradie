import React from 'react';
import { usePage } from '@inertiajs/react';
import { ArrowUpRight, MapPin, Wrench, House } from 'lucide-react';
import { Logo } from '../Components/ui/Logo';
interface AuthLayoutProps { children: React.ReactNode; title?: string; subtitle?: string }
export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    const { flash } = usePage().props;
    return <div className="workspace flex min-h-dvh p-3 sm:p-6"><div className="workspace-frame mx-auto flex w-full max-w-screen-2xl flex-1 flex-col rounded-3xl p-5 sm:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4"><a href="/" className="rounded-full bg-white px-4 py-3"><Logo size="sm" /></a><span className="text-sm text-gray-500">Local people. Skilled hands.</span></header>
        <main className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-2 lg:gap-20 lg:px-10">
            <section className="hidden lg:block"><span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-gray-600"><MapPin className="size-4 text-brand-700" aria-hidden="true" /> Your local service network</span><h2 className="mt-7 max-w-lg text-balance text-5xl font-semibold leading-tight">Good people.<br />Great work.<br /><span className="text-brand-700">All connected.</span></h2><p className="mt-6 max-w-md text-pretty leading-7 text-gray-500">A simpler space to find a fundi, manage your jobs and take care of the places that matter.</p><div className="mt-10 grid max-w-lg grid-cols-2 gap-4"><div className="rounded-3xl bg-accent-500 p-6 text-gray-950"><Wrench className="size-6" aria-hidden="true" /><p className="mt-8 text-lg font-semibold">Local expertise</p><p className="mt-2 text-sm">Fundis for your community.</p></div><div className="rounded-3xl bg-white p-6"><House className="size-6" aria-hidden="true" /><p className="mt-8 text-lg font-semibold">Every property</p><p className="mt-2 text-sm text-gray-500">Care, all in one place.</p></div></div></section>
            <section className="mx-auto w-full max-w-md"><div className="mb-7"><span className="mb-5 inline-flex size-12 items-center justify-center rounded-full bg-white"><ArrowUpRight className="size-6" aria-hidden="true" /></span>{title && <h1 className="text-balance text-3xl font-semibold">{title}</h1>}{subtitle && <p className="mt-3 text-pretty text-gray-500">{subtitle}</p>}</div>{flash.success && <p role="status" className="mb-4 rounded-2xl bg-green-50 p-4 text-sm text-green-800">{flash.success}</p>}{flash.error && <p role="alert" className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-800">{flash.error}</p>}{children}<p className="mt-6 text-center text-sm text-gray-500">One account. Your own workspace.</p></section>
        </main><footer className="text-xs text-gray-500">TradeFinder · Built around your community.</footer>
    </div></div>;
}
