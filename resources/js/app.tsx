import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';
import { AppToaster, ToastContainer, notify } from './components/common/toast';
import { hasActiveLiveSync, isLiveSyncVisit } from './hooks/use-live-sync';

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
        notify.success(trimmed);
    } else if (type === 'error') {
        notify.error(trimmed);
    } else if (type === 'warning') {
        notify.warning(trimmed);
    } else {
        notify.info(trimmed);
    }
}

// Track request methods to know when a mutating operation (POST/PUT/PATCH/DELETE) succeeds
router.on('start', (event) => {
    if (isLiveSyncVisit(event.detail.visit)) {
        return;
    }
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
    const raw = (event.detail as any)?.errors || event.detail;
    if (raw && typeof raw === 'object') {
        const errorList = Object.values(raw);
        if (errorList.length > 0) {
            const first = errorList[0];
            let errorMsg = 'حدث خطأ في التحقق من البيانات المدخلة';
            if (typeof first === 'string') {
                errorMsg = first;
            } else if (Array.isArray(first) && first.length > 0) {
                errorMsg = String(first[0]);
            } else if (typeof first === 'object' && first !== null) {
                const nested = Object.values(first);
                if (nested.length > 0) {
                    const nestedFirst = nested[0];
                    errorMsg = Array.isArray(nestedFirst) ? String(nestedFirst[0]) : String(nestedFirst);
                }
            }
            if (errorMsg && errorMsg !== '[object Object]') {
                showToast('error', errorMsg);
            }
        }
    }
    activeVisitMethod = 'get';
});

// Suppress non-Inertia response alerts on silent background GET live-sync polls
router.on('invalid', (event) => {
    if (hasActiveLiveSync() && activeVisitMethod === 'get') {
        event.preventDefault();
    }
});

// Automatically show server exception errors
router.on('exception', (event) => {
    if (hasActiveLiveSync() && activeVisitMethod === 'get') {
        event.preventDefault();
        return;
    }
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
                <AppToaster />
                <ToastContainer />
            </>
        );
    },
    progress: {
        color: '#005ab5',
    },
});

// This will set light / dark mode on load...
initializeTheme();
