import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

export const LIVE_SYNC_HEADER = 'X-Live-Sync';

const activeLiveSyncTokens = new Set<number>();
let nextLiveSyncTokenId = 1;

export function isLiveSyncVisit(visit: unknown): boolean {
    if (!visit || typeof visit !== 'object') return false;
    const headers = (visit as { headers?: Record<string, string> }).headers;
    if (!headers || typeof headers !== 'object') return false;
    return headers[LIVE_SYNC_HEADER] === '1' || headers['x-live-sync'] === '1';
}

export function hasActiveLiveSync(): boolean {
    return activeLiveSyncTokens.size > 0;
}

export type LiveSyncStatus = 'live' | 'syncing' | 'paused' | 'reconnecting';

export interface LiveSyncController {
    status: LiveSyncStatus;
    isSyncing: boolean;
    isPaused: boolean;
    lastSyncedAt: Date | null;
    lastSyncedLabel: string;
    intervalMs: number;
    syncNow: () => void;
    pause: () => void;
    resume: () => void;
    togglePause: () => void;
}

export interface UsePollingLiveSyncOptions {
    enabled?: boolean;
    intervalMs?: number;
    paused?: boolean;
    immediate?: boolean;
    pauseWhileModalOrForm?: boolean;
}

export interface UseInertiaLiveSyncOptions {
    enabled?: boolean;
    intervalMs?: number;
    only?: string[];
    except?: string[];
    paused?: boolean;
    pauseWhileModalOrForm?: boolean;
}

function formatSyncTimeArabic(date: Date | null): string {
    if (!date) return 'الآن';
    const hours24 = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const period = hours24 >= 12 ? 'م' : 'ص';
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${minutes}:${seconds} ${period}`;
}

export function shouldDeferAutoSync(pauseWhileModalOrForm: boolean): boolean {
    if (typeof document === 'undefined') return true;
    if (document.hidden) return true;
    if (!pauseWhileModalOrForm) return false;

    if (document.querySelector('[data-live-sync-pause="true"], [role="dialog"][aria-modal="true"]')) {
        return true;
    }

    const activeEl = document.activeElement as HTMLElement | null;
    if (activeEl) {
        const tag = activeEl.tagName;
        const isEditable =
            tag === 'INPUT' ||
            tag === 'TEXTAREA' ||
            tag === 'SELECT' ||
            activeEl.isContentEditable;
        if (isEditable && activeEl.closest('form') !== null) {
            return true;
        }
    }

    return false;
}

export function usePollingLiveSync(
    fetcher: () => Promise<boolean | void> | boolean | void,
    options: UsePollingLiveSyncOptions = {}
): LiveSyncController {
    const {
        enabled = true,
        intervalMs = 3000,
        paused = false,
        immediate = false,
        pauseWhileModalOrForm = false,
    } = options;

    const [userPaused, setUserPaused] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const inFlightRef = useRef(false);
    const mountedRef = useRef(true);
    const effectivePaused = paused || userPaused;

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const runSync = useCallback(
        async (force = false) => {
            if (!enabled && !force) return;
            if (inFlightRef.current) return;
            if (!force && (effectivePaused || shouldDeferAutoSync(pauseWhileModalOrForm))) {
                return;
            }

            inFlightRef.current = true;
            if (mountedRef.current) {
                setIsSyncing(true);
            }

            try {
                const result = await fetcherRef.current();
                if (!mountedRef.current) return;

                if (result === false) {
                    setHasError(true);
                } else {
                    setHasError(false);
                    setLastSyncedAt(new Date());
                }
            } catch {
                if (mountedRef.current) {
                    setHasError(true);
                }
            } finally {
                inFlightRef.current = false;
                if (mountedRef.current) {
                    setIsSyncing(false);
                }
            }
        },
        [enabled, effectivePaused, pauseWhileModalOrForm]
    );

    useEffect(() => {
        if (!enabled) return;

        if (immediate && !effectivePaused && !shouldDeferAutoSync(pauseWhileModalOrForm)) {
            void runSync(false);
        }

        const timer = setInterval(() => {
            void runSync(false);
        }, intervalMs);

        const handleVisibilityChange = () => {
            if (typeof document !== 'undefined' && !document.hidden && !effectivePaused) {
                void runSync(false);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled, effectivePaused, immediate, intervalMs, pauseWhileModalOrForm, runSync]);

    const prevPausedRef = useRef(effectivePaused);
    useEffect(() => {
        if (prevPausedRef.current && !effectivePaused && enabled) {
            void runSync(false);
        }
        prevPausedRef.current = effectivePaused;
    }, [effectivePaused, enabled, runSync]);

    const syncNow = useCallback(() => {
        void runSync(true);
    }, [runSync]);

    const pause = useCallback(() => setUserPaused(true), []);
    const resume = useCallback(() => setUserPaused(false), []);
    const togglePause = useCallback(() => setUserPaused((p) => !p), []);

    const status: LiveSyncStatus = effectivePaused
        ? 'paused'
        : hasError
          ? 'reconnecting'
          : isSyncing
            ? 'syncing'
            : 'live';

    const lastSyncedLabel = useMemo(() => formatSyncTimeArabic(lastSyncedAt), [lastSyncedAt]);

    return useMemo(
        () => ({
            status,
            isSyncing,
            isPaused: effectivePaused,
            lastSyncedAt,
            lastSyncedLabel,
            intervalMs,
            syncNow,
            pause,
            resume,
            togglePause,
        }),
        [status, isSyncing, effectivePaused, lastSyncedAt, lastSyncedLabel, intervalMs, syncNow, pause, resume, togglePause]
    );
}

export function useInertiaLiveSync(options: UseInertiaLiveSyncOptions = {}): LiveSyncController {
    const {
        enabled = true,
        intervalMs = 4000,
        only,
        except,
        paused = false,
        pauseWhileModalOrForm = true,
    } = options;

    const [userPaused, setUserPaused] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

    const mountedRef = useRef(true);
    const inFlightRef = useRef(false);
    const userVisitsInFlightRef = useRef(0);
    const cancelInFlightRef = useRef<VoidFunction | null>(null);
    const sawFailureRef = useRef(false);

    const onlyKey = only?.join('|') ?? '';
    const exceptKey = except?.join('|') ?? '';
    const effectivePaused = paused || userPaused;

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            cancelInFlightRef.current?.();
            cancelInFlightRef.current = null;
        };
    }, []);

    useEffect(() => {
        const offStart = router.on('start', (event) => {
            if (isLiveSyncVisit(event.detail.visit)) return;
            userVisitsInFlightRef.current += 1;
            if (inFlightRef.current && cancelInFlightRef.current) {
                cancelInFlightRef.current();
            }
        });

        const offFinish = router.on('finish', (event) => {
            if (isLiveSyncVisit(event.detail.visit)) return;
            userVisitsInFlightRef.current = Math.max(0, userVisitsInFlightRef.current - 1);
            if (mountedRef.current) {
                setLastSyncedAt(new Date());
            }
        });

        const offCancel = router.on('cancel', () => {
            userVisitsInFlightRef.current = Math.max(0, userVisitsInFlightRef.current - 1);
        });

        const offException = router.on('exception', () => {
            if (inFlightRef.current) {
                sawFailureRef.current = true;
            }
        });

        const offInvalid = router.on('invalid', () => {
            if (inFlightRef.current) {
                sawFailureRef.current = true;
            }
        });

        return () => {
            offStart();
            offFinish();
            offCancel();
            offException();
            offInvalid();
        };
    }, []);

    const runReload = useCallback(
        (force = false) => {
            if (!enabled && !force) return;
            if (inFlightRef.current) return;
            if (userVisitsInFlightRef.current > 0) return;
            if (!force && (effectivePaused || shouldDeferAutoSync(pauseWhileModalOrForm))) {
                return;
            }

            const token = nextLiveSyncTokenId++;
            activeLiveSyncTokens.add(token);
            inFlightRef.current = true;
            sawFailureRef.current = false;

            if (mountedRef.current) {
                setIsSyncing(true);
            }

            let cleanedUp = false;
            const cleanup = () => {
                if (cleanedUp) return;
                cleanedUp = true;
                activeLiveSyncTokens.delete(token);
                inFlightRef.current = false;
                cancelInFlightRef.current = null;
                if (mountedRef.current) {
                    setIsSyncing(false);
                }
            };

            const onlyProps = onlyKey ? onlyKey.split('|').filter(Boolean) : [];
            const exceptProps = exceptKey ? exceptKey.split('|').filter(Boolean) : [];

            router.reload({
                ...(onlyProps.length > 0 ? { only: onlyProps } : {}),
                ...(exceptProps.length > 0 ? { except: exceptProps } : {}),
                async: true,
                showProgress: false,
                headers: {
                    [LIVE_SYNC_HEADER]: '1',
                },
                onCancelToken: ({ cancel }) => {
                    cancelInFlightRef.current = cancel;
                },
                onSuccess: () => {
                    sawFailureRef.current = false;
                    if (mountedRef.current) {
                        setHasError(false);
                        setLastSyncedAt(new Date());
                    }
                },
                onError: () => {
                    sawFailureRef.current = true;
                    if (mountedRef.current) {
                        setHasError(true);
                    }
                },
                onCancel: () => {
                    cleanup();
                },
                onFinish: () => {
                    if (sawFailureRef.current && mountedRef.current) {
                        setHasError(true);
                    }
                    cleanup();
                },
            });
        },
        [enabled, effectivePaused, pauseWhileModalOrForm, onlyKey, exceptKey]
    );

    useEffect(() => {
        if (!enabled) return;

        const timer = setInterval(() => {
            runReload(false);
        }, intervalMs);

        const handleVisibilityChange = () => {
            if (typeof document !== 'undefined' && !document.hidden && !effectivePaused) {
                runReload(false);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled, effectivePaused, intervalMs, runReload]);

    const prevPausedRef = useRef(effectivePaused);
    useEffect(() => {
        if (prevPausedRef.current && !effectivePaused && enabled) {
            runReload(false);
        }
        prevPausedRef.current = effectivePaused;
    }, [effectivePaused, enabled, runReload]);

    const syncNow = useCallback(() => {
        runReload(true);
    }, [runReload]);

    const pause = useCallback(() => setUserPaused(true), []);
    const resume = useCallback(() => setUserPaused(false), []);
    const togglePause = useCallback(() => setUserPaused((p) => !p), []);

    const status: LiveSyncStatus = effectivePaused
        ? 'paused'
        : hasError
          ? 'reconnecting'
          : isSyncing
            ? 'syncing'
            : 'live';

    const lastSyncedLabel = useMemo(() => formatSyncTimeArabic(lastSyncedAt), [lastSyncedAt]);

    return useMemo(
        () => ({
            status,
            isSyncing,
            isPaused: effectivePaused,
            lastSyncedAt,
            lastSyncedLabel,
            intervalMs,
            syncNow,
            pause,
            resume,
            togglePause,
        }),
        [status, isSyncing, effectivePaused, lastSyncedAt, lastSyncedLabel, intervalMs, syncNow, pause, resume, togglePause]
    );
}
