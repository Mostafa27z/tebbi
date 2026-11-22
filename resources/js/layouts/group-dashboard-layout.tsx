import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Building2,
    Users,
    Stethoscope,
    ShieldCheck,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    PanelRightClose,
    PanelRightOpen,
    ExternalLink,
    Briefcase,
    Plus,
    Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LiveSyncIndicator } from '@/components/common/live-sync-indicator';
import { LiveSyncController, useInertiaLiveSync } from '@/hooks/use-live-sync';

export type GroupTab = 'overview' | 'facilities' | 'doctors' | 'specialties' | 'staff';

interface GroupDashboardLayoutProps {
    children: React.ReactNode;
    activeTab?: GroupTab;
    group: {
        id: number;
        name_ar: string;
        name_en?: string;
        cr_number?: string;
    };
    counts?: {
        facilities?: number;
        doctors?: number;
        specialties?: number;
        staff?: number;
    };
    onOpenAddModal?: () => void;
    addModalLabel?: string;
    liveSync?: LiveSyncController;
    liveSyncIntervalMs?: number;
    liveSyncPaused?: boolean;
}

export const GroupDashboardLayout: React.FC<GroupDashboardLayoutProps> = ({
    children,
    activeTab,
    group,
    counts,
    onOpenAddModal,
    addModalLabel,
    liveSync: externalLiveSync,
    liveSyncIntervalMs,
    liveSyncPaused,
}) => {
    const { url, props } = usePage();
    const user = (props as any).auth?.user || {};

    const resolvedTab: GroupTab =
        activeTab ||
        (url.startsWith('/group/facilities')
            ? 'facilities'
            : url.startsWith('/group/doctors')
              ? 'doctors'
              : url.startsWith('/group/specialties')
                ? 'specialties'
                : url.startsWith('/group/staff')
                  ? 'staff'
                  : 'overview');

    const internalLiveSync = useInertiaLiveSync({
        enabled: !externalLiveSync,
        paused: liveSyncPaused,
        intervalMs: liveSyncIntervalMs ?? 5000,
    });
    const activeLiveSync = externalLiveSync ?? internalLiveSync;

    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);

    const navItems = [
        {
            id: 'overview' as GroupTab,
            href: '/group/dashboard',
            label: 'لوحة التحكم والمؤشرات',
            description: 'نظرة عامة والتحليلات المالية والتشغيلية',
            icon: LayoutDashboard,
            color: 'text-[#005ab5]',
            bg: 'bg-blue-50',
        },
        {
            id: 'facilities' as GroupTab,
            href: '/group/facilities',
            label: 'المستشفيات والعيادات التابعة',
            description: 'إدارة الفروع والمستشفيات والمراكز المعتمدة',
            icon: Building2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            count: counts?.facilities,
            countColor: 'bg-emerald-100 text-emerald-800',
        },
        {
            id: 'doctors' as GroupTab,
            href: '/group/doctors',
            label: 'الأطباء والاستشاريون',
            description: 'إدارة الكادر الطبي وتوزيع الفروع والعيادات',
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            count: counts?.doctors,
            countColor: 'bg-purple-100 text-purple-800',
        },
        {
            id: 'specialties' as GroupTab,
            href: '/group/specialties',
            label: 'الأقسام والتخصصات الطبية',
            description: 'إضافة وتخصيص الأقسام الطبية للمستشفيات',
            icon: Stethoscope,
            color: 'text-teal-600',
            bg: 'bg-teal-50',
            count: counts?.specialties,
            countColor: 'bg-teal-100 text-teal-800',
        },
        {
            id: 'staff' as GroupTab,
            href: '/group/staff',
            label: 'المشرفون والصلاحيات',
            description: 'إدارة مدراء الفروع وموظفي الاستقبال',
            icon: ShieldCheck,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            count: counts?.staff,
            countColor: 'bg-amber-100 text-amber-800',
        },
    ];

    const currentNav = navItems.find((n) => n.id === resolvedTab) || navItems[0];

    const handleLogout = () => {
        router.post(route('logout'));
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex font-['Tajawal']" dir="rtl">
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden transition-opacity"
                />
            )}

            <aside
                className={cn(
                    'fixed inset-y-0 right-0 z-50 bg-white border-l border-gray-200/80 shadow-xl flex flex-col justify-between transition-all duration-300 ease-in-out',
                    mobileOpen ? 'translate-x-0 w-80 sm:w-84' : 'translate-x-full lg:translate-x-0',
                    desktopCollapsed ? 'lg:w-20' : 'lg:w-80'
                )}
            >
                <div>
                    <div className="min-h-[5.5rem] px-4 py-3.5 flex items-center justify-between border-b border-gray-100">
                        <div className={cn('flex items-center gap-3 min-w-0 flex-1', desktopCollapsed && 'lg:hidden')}>
                            <div className="w-10 h-10 rounded-2xl bg-[#005ab5] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span
                                    className="font-black text-[13px] text-gray-900 font-['Cairo'] block leading-snug truncate"
                                    title={group.name_ar}
                                >
                                    {group.name_ar}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                    <span className="text-[11px] text-gray-500 font-bold block truncate">
                                        إدارة المنظومة والمجمعات
                                    </span>
                                </div>
                            </div>
                        </div>

                        {desktopCollapsed && (
                            <div className="hidden lg:flex w-full justify-center">
                                <div className="w-10 h-10 rounded-2xl bg-[#005ab5] flex items-center justify-center text-white shadow-md">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-3 space-y-1.5">
                        <div className={cn('px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider', desktopCollapsed && 'lg:hidden')}>
                            لوحة إدارة المجموعة
                        </div>

                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = resolvedTab === item.id;

                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    title={desktopCollapsed ? item.label : undefined}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-colors text-right cursor-pointer select-none group',
                                        isActive
                                            ? 'bg-blue-50 text-[#005ab5] shadow-xs'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                                            isActive
                                                ? 'bg-[#005ab5] text-white shadow-sm shadow-blue-500/20'
                                                : cn(item.bg, item.color)
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </div>

                                    <div className={cn('flex-1 truncate', desktopCollapsed && 'lg:hidden')}>
                                        <div className="truncate font-bold text-xs">{item.label}</div>
                                        <div className="text-[10px] text-gray-400 truncate font-normal">
                                            {item.description}
                                        </div>
                                    </div>

                                    {item.count !== undefined && item.count > 0 && (
                                        <span
                                            className={cn(
                                                'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0',
                                                desktopCollapsed && 'lg:hidden',
                                                isActive
                                                    ? 'bg-[#005ab5] text-white'
                                                    : item.countColor || 'bg-gray-100 text-gray-700'
                                            )}
                                        >
                                            {item.count}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="p-3 border-t border-gray-100">
                    <div className={cn('p-3 rounded-2xl bg-gray-50/80 mb-2', desktopCollapsed && 'lg:hidden')}>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#005ab5] font-bold flex items-center justify-center text-xs shrink-0">
                                {user.name ? user.name[0] : 'م'}
                            </div>
                            <div className="truncate">
                                <span className="font-bold text-xs text-gray-900 block truncate">
                                    {user.name || 'مدير المجمع'}
                                </span>
                                <span className="text-[10px] text-gray-400 block truncate font-mono">
                                    {user.email || 'group.admin@tebiby.com'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/settings/profile"
                        className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold text-gray-700 hover:text-[#005ab5] hover:bg-blue-50 transition-colors mb-1',
                            desktopCollapsed && 'lg:justify-center lg:px-0'
                        )}
                        title="إعدادات الحساب والملف الشخصي"
                    >
                        <Settings className="w-4 h-4 shrink-0 text-gray-400" />
                        <span className={cn(desktopCollapsed && 'lg:hidden')}>إعدادات الحساب</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer',
                            desktopCollapsed && 'lg:justify-center lg:px-0'
                        )}
                        title="تسجيل الخروج"
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span className={cn(desktopCollapsed && 'lg:hidden')}>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            <div
                className={cn(
                    'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out',
                    desktopCollapsed ? 'lg:mr-20' : 'lg:mr-80'
                )}
            >
                <header className="h-20 bg-white border-b border-gray-200/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
                            className="hidden lg:flex p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title={desktopCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
                        >
                            {desktopCollapsed ? (
                                <PanelRightOpen className="w-5 h-5" />
                            ) : (
                                <PanelRightClose className="w-5 h-5" />
                            )}
                        </button>

                        <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-gray-400 hidden sm:inline">إدارة المجمعات</span>
                            <ChevronLeft className="w-3.5 h-3.5 text-gray-300 hidden sm:inline" />
                            <h1 className="font-black text-gray-900 text-sm sm:text-base font-['Cairo']">
                                {currentNav.label}
                            </h1>
                            {group.cr_number && (
                                <span className="hidden md:inline-block px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[11px] font-mono font-medium">
                                    س.ت: {group.cr_number}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <LiveSyncIndicator sync={activeLiveSync} />

                        {onOpenAddModal && addModalLabel && (
                            <button
                                type="button"
                                onClick={onOpenAddModal}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-colors cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{addModalLabel}</span>
                            </button>
                        )}

                        <Link
                            href="/"
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                            <span>البوابة الرئيسية</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
};
