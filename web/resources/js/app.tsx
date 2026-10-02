import { createInertiaApp } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from './Components/ErrorBoundary';
import React from 'react';

// NProgress-style loading indicator via Inertia's built-in progress events
let npBar: HTMLDivElement | null = null;
let npTimer: ReturnType<typeof setTimeout> | null = null;

function showProgress() {
    if (!npBar) {
        npBar = document.createElement('div');
        npBar.setAttribute('role', 'progressbar');
        npBar.setAttribute('aria-label', 'Page loading');
        npBar.style.cssText =
            'position:fixed;top:0;left:0;height:3px;background:#6366f1;z-index:9999;transition:width 200ms ease;width:0';
        document.body.appendChild(npBar);
    }
    npBar.style.width = '0';
    npBar.style.opacity = '1';
    npTimer = setTimeout(() => {
        if (npBar) npBar.style.width = '70%';
    }, 50);
}

function hideProgress() {
    if (npTimer) clearTimeout(npTimer);
    if (npBar) {
        npBar.style.width = '100%';
        setTimeout(() => {
            if (npBar) {
                npBar.style.opacity = '0';
                setTimeout(() => {
                    if (npBar) { npBar.style.width = '0'; }
                }, 300);
            }
        }, 150);
    }
}

router.on('start', () => showProgress());
router.on('finish', () => hideProgress());


createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true }) as Record<
            string,
            { default: React.ComponentType }
        >;
        return pages[`./Pages/${name}.tsx`];
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ErrorBoundary>
                <App {...props} />
            </ErrorBoundary>
        );
    },
});
