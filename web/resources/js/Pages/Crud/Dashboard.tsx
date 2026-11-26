import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from './Layout';
import { NavItem, linkClass } from './types';

export default function Dashboard({ navigation, counts }: {navigation: NavItem[]; counts: Record<string, number>}) {
    return <Layout navigation={navigation}>
        <Head title="Admin overview" />
        <h1 className="text-balance text-3xl font-semibold">Admin overview</h1>
        <p className="mt-2 text-pretty text-gray-600">Manage your members, fundi businesses and service records.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {navigation.map(item => <Link key={item.key} href={'/admin/'+item.key} className="rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-500 focus-visible:outline-2 focus-visible:outline-brand-600">
                <h2 className="text-balance font-medium text-gray-600">{item.label}</h2><p className="mt-3 text-3xl font-semibold tabular-nums">{counts[item.key]}</p><p className="mt-4 text-sm font-medium text-brand-700">View records →</p>
            </Link>)}
        </div>
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-balance text-lg font-semibold">Getting started</h2>
            <p className="mt-2 text-pretty text-gray-600">Add members under People and fundis under Fundis. Add optional business details in the same fundi form, then manage properties and jobs.</p>
            <Link href="/admin/people/create" className={'mt-3 inline-block '+linkClass}>Add a person</Link>
        </section>
    </Layout>;
}
