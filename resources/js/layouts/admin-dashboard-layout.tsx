import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { 
    ShieldCheck, 
    BarChart3, 
    Building2, 
    Hospital, 
    Settings2, 
    Users, 
    Stethoscope, 
    Calendar, 
    ExternalLink, 
    LogOut, 
    Menu, 
    X, 
    ChevronLeft,
    PanelRightClose,
    PanelRightOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdminTab = 
    | 'analytics' 
    | 'groups' 
    | 'clinics' 
    | 'admins' 
    | 'doctors' 
    | 'specialties' 
    | 'appointments';

interface AdminDashboardLayoutProps {
    children: React.ReactNode;
    activeTab?: AdminTab;
    setActiveTab?: (tab: AdminTab) => void;
    counts?: {
        groups?: number;
        clinics?: number;
        admins?: number;
        doctors?: number;
        specialties?: number;
        appointments?: number;
    };
}

export const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({
    children,
    activeTab: explicitActiveTab,
    setActiveTab,
    counts: explicitCounts,
}) => {
    const { url, props } = usePage();
    const sharedCounts = (props as any).adminCounts || {};

    const resolvedCounts = {
        groups: explicitCounts?.groups ?? sharedCounts.groups ?? 0,
        clinics: explicitCounts?.clinics ?? sharedCounts.clinics ?? 0,
        admins: explicitCounts?.admins ?? sharedCounts.admins ?? 0,
        doctors: explicitCounts?.doctors ?? sharedCounts.doctors ?? 0,
        specialties: explicitCounts?.specialties ?? sharedCounts.specialties ?? 0,
        appointments: explicitCounts?.appointments ?? sharedCounts.appointments ?? 0,
    };

    // Auto-detect active section from URL if not explicitly supplied
    const detectActiveTab = (): AdminTab => {
        if (explicitActiveTab) return explicitActiveTab;
        if (url.startsWith('/admin/groups')) return 'groups';
        if (url.startsWith('/admin/clinics')) return 'clinics';
        if (url.startsWith('/admin/admins')) return 'admins';
        if (url.startsWith('/admin/doctors')) return 'doctors';
        if (url.startsWith('/admin/specialties')) return 'specialties';
        if (url.startsWith('/admin/appointments')) return 'appointments';
        return 'analytics';
    };

    const activeTab = detectActiveTab();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);

    const navItems = [
        {
            id: 'analytics' as AdminTab,
            href: '/admin/analytics',
            label: 'تحليلات النمو والأداء',
            icon: BarChart3,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            count: null,
        },
        {
            id: 'groups' as AdminTab,
            href: '/admin/groups',
            label: 'المجمعات الطبية',
            icon: Building2,
            color: 'text-indigo-500',
            bg: 'bg-indigo-50',
            count: resolvedCounts.groups,
        },
        {
            id: 'clinics' as AdminTab,
            href: '/admin/clinics',
            label: 'المستشفيات والعيادات',
            icon: Hospital,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            count: resolvedCounts.clinics,
        },
        {
            id: 'admins' as AdminTab,
            href: '/admin/admins',
            label: 'المشرفون وصلاحيات الاستقبال',
            icon: Settings2,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
            count: resolvedCounts.admins,
        },
        {
            id: 'doctors' as AdminTab,
            href: '/admin/doctors',
            label: 'الأطباء والاستشاريون',
            icon: Users,
            color: 'text-purple-500',
            bg: 'bg-purple-50',
            count: resolvedCounts.doctors,
        },
        {
            id: 'specialties' as AdminTab,
            href: '/admin/specialties',
            label: 'الأقسام والتخصصات الطبية',
            icon: Stethoscope,
            color: 'text-teal-500',
            bg: 'bg-teal-50',
            count: resolvedCounts.specialties,
        },
        {
            id: 'appointments' as AdminTab,
            href: '/admin/appointments',
            label: 'سجل الحجوزات والتذاكر',
            icon: Calendar,
            color: 'text-rose-500',
            bg: 'bg-rose-50',
            count: resolvedCounts.appointments,
        },
    ];

    const currentNav = navItems.find((n) => n.id === activeTab) || navItems[0];

    const handleLogout = () => {
        router.post(route('logout'));
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex font-['Tajawal']" dir="rtl">
            {/* Mobile Sidebar Backdrop */}
            {mobileOpen && (
                <div 
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
                />
            )}

            {/* RIGHT SIDEBAR (Desktop Collapsible & Mobile Sliding Drawer) */}
            <aside
                className={cn(
                    'fixed inset-y-0 right-0 z-50 bg-white border-l border-gray-200/90 flex flex-col transition-all duration-300 ease-in-out shadow-xl lg:shadow-none',
                    mobileOpen ? 'translate-x-0 w-72' : 'translate-x-full lg:translate-x-0',
                    desktopCollapsed ? 'lg:w-20' : 'lg:w-72'
                )}
            >
                {/* Brand & Logo Header */}
                <div className={cn(
                    'h-18 px-5 border-b border-gray-100 flex items-center shrink-0 bg-white transition-all',
                    desktopCollapsed ? 'lg:justify-center lg:px-2 justify-between' : 'justify-between'
                )}>
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#005ab5] to-[#0072e2] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className={cn('transition-opacity duration-200', desktopCollapsed ? 'lg:hidden' : 'block')}>
                            <span className="font-black text-lg tracking-tight text-[#005ab5] font-['Cairo'] block leading-tight">
                                طبيبي
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold block">
                                لوحة الإدارة العليا
                            </span>
                        </div>
                    </Link>

                    {/* Mobile Close Button */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 lg:hidden cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sidebar Navigation Links */}
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
                    <div className={cn('px-3 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider font-["Cairo"]', desktopCollapsed ? 'lg:hidden' : 'block')}>
                        التحكم والعمليات
                    </div>

                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                title={item.label}
                                onClick={() => {
                                    if (setActiveTab) setActiveTab(item.id);
                                    setMobileOpen(false);
                                }}
                                className={cn(
                                    'w-full flex items-center rounded-2xl text-xs font-bold transition-all cursor-pointer select-none group',
                                    desktopCollapsed ? 'lg:justify-center lg:p-2.5 justify-between px-3.5 py-3' : 'justify-between px-3.5 py-3',
                                    isActive
                                        ? 'bg-[#005ab5] text-white shadow-md shadow-blue-600/20 font-["Cairo"]'
                                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                )}
                            >
                                <div className={cn('flex items-center gap-3', desktopCollapsed && 'lg:gap-0')}>
                                    <div className={cn(
                                        'w-7 h-7 rounded-xl flex items-center justify-center transition-colors shrink-0',
                                        isActive ? 'bg-white/20 text-white' : `${item.bg} ${item.color}`
                                    )}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className={cn('truncate', desktopCollapsed ? 'lg:hidden' : 'block')}>{item.label}</span>
                                </div>

                                {item.count !== null && (
                                    <span
                                        className={cn(
                                            'text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg transition-colors',
                                            desktopCollapsed ? 'lg:hidden' : 'block',
                                            isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                                        )}
                                    >
                                        {item.count}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom Sidebar: Return Link & User Profile / Logout */}
                <div className={cn('shrink-0 border-t border-gray-100 bg-gray-50/70 space-y-2 transition-all', desktopCollapsed ? 'lg:p-2 p-3.5' : 'p-3.5')}>
                    <Link
                        href="/"
                        title="عرض المنصة الرئيسية"
                        className={cn(
                            'w-full flex items-center rounded-xl text-xs font-bold text-gray-600 hover:text-[#005ab5] hover:bg-white transition-all border border-transparent hover:border-gray-200/80',
                            desktopCollapsed ? 'lg:justify-center lg:p-2.5 justify-between px-3 py-2' : 'justify-between px-3 py-2'
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className={desktopCollapsed ? 'lg:hidden' : 'inline'}>عرض المنصة الرئيسية</span>
                        </span>
                        <ChevronLeft className={cn('w-3.5 h-3.5 text-gray-400', desktopCollapsed ? 'lg:hidden' : 'inline')} />
                    </Link>

                    {/* Admin Profile Strip */}
                    <div className={cn(
                        'bg-white rounded-2xl border border-gray-200/80 flex items-center gap-2.5 transition-all',
                        desktopCollapsed ? 'lg:p-2 lg:justify-center p-3 justify-between' : 'p-3 justify-between'
                    )}>
                        <div className="flex items-center gap-2.5 min-w-0" title="مدير منصة طبيبي">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#005ab5] to-blue-400 flex items-center justify-center text-white font-black text-xs font-['Cairo'] shadow-xs shrink-0">
                                م.ع
                            </div>
                            <div className={cn('min-w-0', desktopCollapsed ? 'lg:hidden' : 'block')}>
                                <span className="block text-xs font-black text-gray-900 truncate font-['Cairo']">
                                    مدير منصة طبيبي
                                </span>
                                <span className="block text-[10px] text-emerald-600 font-bold">
                                    مشرف عام معتمد
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className={cn('p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0', desktopCollapsed && 'lg:hidden')}
                            title="تسجيل الخروج"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT COLUMN (Left on RTL) */}
            <div className={cn(
                'flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out',
                desktopCollapsed ? 'lg:mr-20' : 'lg:mr-72'
            )}>
                {/* Top Bar Header */}
                <header className="h-18 bg-white border-b border-gray-200/90 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
                    <div className="flex items-center gap-3">
                        {/* Mobile Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 lg:hidden cursor-pointer"
                            title="فتح القائمة الجانبية"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Desktop Collapse/Expand Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setDesktopCollapsed((prev) => !prev)}
                            className="hidden lg:flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-[#005ab5] hover:bg-blue-50 transition-colors cursor-pointer border border-gray-200/60"
                            title={desktopCollapsed ? "توسيع القائمة الجانبية (يمين)" : "طي القائمة الجانبية (يسار)"}
                        >
                            {desktopCollapsed ? (
                                <PanelRightOpen className="w-5 h-5 text-[#005ab5]" />
                            ) : (
                                <PanelRightClose className="w-5 h-5 text-gray-600" />
                            )}
                        </button>

                        <div>
                            <h1 className="text-base sm:text-lg font-black text-gray-900 font-['Cairo'] flex items-center gap-2">
                                <span>{currentNav.label}</span>
                            </h1>
                            <p className="text-[11px] text-gray-400 hidden sm:block">
                                لوحة التحكم الإدارية الموحدة لشبكة المراكز والخدمات الطبية
                            </p>
                        </div>
                    </div>

                    {/* Actions & Health Status */}
                    <div className="flex items-center gap-3">
                        {/* System Health Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>النظام متصل • 100% جهوزية</span>
                        </div>
                    </div>
                </header>

                {/* Main Scrollable Viewport - Full Width Fluid Dashboard */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 w-full">
                    {children}
                </main>
            </div>
        </div>
    );
};

