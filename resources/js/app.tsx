import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';
import toast, { Toaster } from 'react-hot-toast';

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Global toast deduplication tracker
let activeVisitMethod = 'get';
let lastToastMessage: string | null = null;
let lastToastTime = 0;

function showToast(type: 'success' | 'error' | 'info' | 'warning', msg?: string | null) {
    if (!msg || typeof msg !== 'string') return;
    const trimmed = msg.trim();
    if (!trimmed) return;

    const now = Date.now();
    if (lastToastMessage === trimmed && now - lastToastTime < 1000) {
        return;
    }
    lastToastMessage = trimmed;
    lastToastTime = now;

    if (type === 'success') {
        toast.success(trimmed);
    } else if (type === 'error') {
        toast.error(trimmed);
    } else if (type === 'warning') {
        toast(trimmed, { icon: '⚠️' });
    } else {
        toast(trimmed, { icon: 'ℹ️' });
    }
}

// Track request methods to know when a mutating operation (POST/PUT/PATCH/DELETE) succeeds
router.on('start', (event) => {
    activeVisitMethod = (event.detail.visit.method || 'get').toLowerCase();
});

// Automatically show toast on every Inertia server response!
router.on('success', (event) => {
    const page = event.detail.page;
    const flash = page.props?.flash as { success?: string; error?: string; info?: string; warning?: string } | undefined;

    if (flash?.success) {
        showToast('success', flash.success);
    } else if (flash?.error) {
        showToast('error', flash.error);
    } else if (flash?.warning) {
        showToast('warning', flash.warning);
    } else if (flash?.info) {
        showToast('info', flash.info);
    } else if (activeVisitMethod !== 'get') {
        // Fallback for any successful mutating server request that didn't set a custom flash message
        showToast('success', 'تم تنفيذ العملية بنجاح');
    }

    activeVisitMethod = 'get';
});

// Automatically show validation errors as toast
router.on('error', (event) => {
    const errors = event.detail;
    if (errors && typeof errors === 'object') {
        const errorList = Object.values(errors);
        if (errorList.length > 0) {
            showToast('error', String(errorList[0]));
        }
    }
    activeVisitMethod = 'get';
});

// Automatically show server exception errors
router.on('exception', () => {
    showToast('error', 'حدث خطأ في الخادم أثناء تنفيذ العملية');
    activeVisitMethod = 'get';
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Check for initial page flash messages
        const initialFlash = props.initialPage?.props?.flash as any;
        if (initialFlash?.success) {
            showToast('success', initialFlash.success);
        } else if (initialFlash?.error) {
            showToast('error', initialFlash.error);
        } else if (initialFlash?.warning) {
            showToast('warning', initialFlash.warning);
        } else if (initialFlash?.info) {
            showToast('info', initialFlash.info);
        }

        root.render(
            <>
                <App {...props} />
                <Toaster
                    position="top-center"
                    reverseOrder={false}
                    toastOptions={{
                        duration: 4000,
                        style: {
                            fontFamily: 'Tajawal, Cairo, sans-serif',
                            fontSize: '13px',
                            fontWeight: 700,
                            borderRadius: '16px',
                            padding: '12px 20px',
                            color: '#0f172a',
                            background: '#ffffff',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                            direction: 'rtl',
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#ffffff',
                            },
                            style: {
                                border: '1px solid #fecaca',
                                background: '#fef2f2',
                                color: '#991b1b',
                            },
                        },
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#ffffff',
                            },
                            style: {
                                border: '1px solid #a7f3d0',
                                background: '#f0fdf4',
                                color: '#065f46',
                            },
                        },
                    }}
                />
            </>
        );
    },
    progress: {
        color: '#005ab5',
    },
});

// This will set light / dark mode on load...
initializeTheme();
