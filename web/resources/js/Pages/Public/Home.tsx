import React from 'react';

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Tradify</h1>
            <p className="mt-4 text-lg text-gray-500">
                Trusted local fundis across Kenya. No call-out fees. Member discounts.
            </p>
            <div className="mt-8 flex gap-4">
                <a href="/register/member" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Become a Member
                </a>
                <a href="/login" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Sign In
                </a>
            </div>
        </div>
    );
}
