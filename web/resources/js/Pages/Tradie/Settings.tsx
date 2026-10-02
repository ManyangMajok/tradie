import React from 'react';
import { useForm } from '@inertiajs/react';
import TradieLayout from '../../Layouts/TradieLayout';

interface Profile {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
}

interface Company {
    business_name: string;
    trading_name: string | null;
    about_text: string | null;
}

interface Props {
    profile: Profile;
    company: Company;
}

function SectionHeading({ title }: { title: string }) {
    return <h2 className="mb-4 text-base font-semibold text-gray-900">{title}</h2>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="mt-1">{children}</div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function Settings({ profile, company }: Props) {
    const profileForm = useForm({
        first_name: profile.first_name,
        last_name:  profile.last_name,
        phone:      profile.phone ?? '',
    });

    const companyForm = useForm({
        business_name: company.business_name,
        trading_name:  company.trading_name ?? '',
        about_text:    company.about_text ?? '',
    });

    const passwordForm = useForm({
        current_password: '',
        password:         '',
        password_confirmation: '',
    });

    function submitProfile(e: React.FormEvent) {
        e.preventDefault();
        profileForm.patch('/tradie/settings/profile');
    }

    function submitCompany(e: React.FormEvent) {
        e.preventDefault();
        companyForm.patch('/tradie/settings/company');
    }

    function submitPassword(e: React.FormEvent) {
        e.preventDefault();
        passwordForm.patch('/tradie/settings/password', {
            onSuccess: () => passwordForm.reset(),
        });
    }

    return (
        <div className="space-y-8 max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

            {/* Personal details */}
            <section className="rounded-xl border border-gray-200 bg-white px-6 py-5">
                <SectionHeading title="Personal details" />
                <form onSubmit={submitProfile} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="First name" error={profileForm.errors.first_name}>
                            <input
                                className={inputCls}
                                value={profileForm.data.first_name}
                                onChange={e => profileForm.setData('first_name', e.target.value)}
                            />
                        </Field>
                        <Field label="Last name" error={profileForm.errors.last_name}>
                            <input
                                className={inputCls}
                                value={profileForm.data.last_name}
                                onChange={e => profileForm.setData('last_name', e.target.value)}
                            />
                        </Field>
                    </div>
                    <Field label="Phone">
                        <input
                            className={inputCls}
                            value={profileForm.data.phone}
                            onChange={e => profileForm.setData('phone', e.target.value)}
                            placeholder="+254 7xx xxx xxx"
                        />
                    </Field>
                    <p className="text-xs text-gray-400">Email address cannot be changed here — contact support.</p>
                    <button
                        type="submit"
                        disabled={profileForm.processing}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                        Save
                    </button>
                </form>
            </section>

            {/* Business details */}
            <section className="rounded-xl border border-gray-200 bg-white px-6 py-5">
                <SectionHeading title="Business details" />
                <form onSubmit={submitCompany} className="space-y-4">
                    <Field label="Business name" error={companyForm.errors.business_name}>
                        <input
                            className={inputCls}
                            value={companyForm.data.business_name}
                            onChange={e => companyForm.setData('business_name', e.target.value)}
                        />
                    </Field>
                    <Field label="Trading name (optional)" error={companyForm.errors.trading_name}>
                        <input
                            className={inputCls}
                            value={companyForm.data.trading_name}
                            onChange={e => companyForm.setData('trading_name', e.target.value)}
                            placeholder="If different from business name"
                        />
                    </Field>
                    <Field label="About your business" error={companyForm.errors.about_text}>
                        <textarea
                            className={inputCls}
                            rows={4}
                            value={companyForm.data.about_text}
                            onChange={e => companyForm.setData('about_text', e.target.value)}
                            placeholder="Tell members about your experience and specialties…"
                        />
                    </Field>
                    <button
                        type="submit"
                        disabled={companyForm.processing}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                        Save
                    </button>
                </form>
            </section>

            {/* Change password */}
            <section className="rounded-xl border border-gray-200 bg-white px-6 py-5">
                <SectionHeading title="Change password" />
                <form onSubmit={submitPassword} className="space-y-4">
                    <Field label="Current password" error={passwordForm.errors.current_password}>
                        <input
                            type="password"
                            className={inputCls}
                            value={passwordForm.data.current_password}
                            onChange={e => passwordForm.setData('current_password', e.target.value)}
                            autoComplete="current-password"
                        />
                    </Field>
                    <Field label="New password" error={passwordForm.errors.password}>
                        <input
                            type="password"
                            className={inputCls}
                            value={passwordForm.data.password}
                            onChange={e => passwordForm.setData('password', e.target.value)}
                            autoComplete="new-password"
                        />
                    </Field>
                    <Field label="Confirm new password" error={passwordForm.errors.password_confirmation}>
                        <input
                            type="password"
                            className={inputCls}
                            value={passwordForm.data.password_confirmation}
                            onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                        />
                    </Field>
                    <button
                        type="submit"
                        disabled={passwordForm.processing}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                        Change password
                    </button>
                </form>
            </section>
        </div>
    );
}

Settings.layout = (page: React.ReactNode) => <TradieLayout>{page}</TradieLayout>;
