import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { 
    Clock, 
    Users, 
    Stethoscope, 
    Calendar, 
    ExternalLink, 
    LogOut, 
    Menu, 
    X, 
    ChevronLeft,
    PanelRightClose,
    PanelRightOpen,
    Hospital,
    Ticket,
    Activity,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type FacilityTab = 'queue' | 'doctors' | 'specialties' | 'appointments';

interface FacilityDashboardLayoutProps {
    children: React.ReactNode;
    activeTab?: FacilityTab;
    onTabChange?: (tab: FacilityTab) => void;
    facilityName: string;
    branchName?: string;
    counts?: {
        waiting?: number;
        doctors?: number;
        specialties?: number;
        appointments?: number;
    };
    onOpenWalkInModal?: () => void;
}

export const FacilityDashboardLayout: React.FC<FacilityDashboardLayoutProps> = ({
    children,
    activeTab,
    onTabChange,
    facilityName,
    branchName,
    counts,
    onOpenWalkInModal,
}) => {
    const { url, props } = usePage();
    const user = (props as any).auth?.user || {};

    const resolvedTab: FacilityTab = activeTab || (
        url.startsWith('/facility/doctors') ? 'doctors' :
        url.startsWith('/facility/specialties') ? 'specialties' :
        url.startsWith('/facility/appointments') ? 'appointments' : 'queue'
    );

    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);

    const navItems = [
        {
            id: 'queue' as FacilityTab,
            href: '/facility/dashboard',
            label: 'حركة الاستقبال والانتظار',
            description: 'طابور المرضى والحضور المباشر',
            icon: Clock,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
            count: counts?.waiting,
            countColor: 'bg-amber-100 text-amber-800',
        },
        {
            id: 'doctors' as FacilityTab,
            href: '/facility/doctors',
            label: 'أطباء المنشأة وتواجدهم',
            description: 'جدول الأطباء وتفعيل الحضور اليومي',
            icon: Users,
            color: 'text-purple-500',
            bg: 'bg-purple-50',
            count: counts?.doctors,
            countColor: 'bg-purple-100 text-purple-800',
        },
        {
            id: 'specialties' as FacilityTab,
            href: '/facility/specialties',
            label: 'الأقسام والتخصصات',
            description: 'العيادات الطبية المعتمدة',
            icon: Stethoscope,
            color: 'text-teal-500',
            bg: 'bg-teal-50',
            count: counts?.specialties,
            countColor: 'bg-teal-100 text-teal-800',
        },
        {
            id: 'appointments' as FacilityTab,
            href: '/facility/appointments',
            label: 'سجل المواعيد والتذاكر',
            description: 'كافة حجوزات اليوم وتفاصيلها',
            icon: Calendar,
            color: 'text-[#005ab5]',
            bg: 'bg-blue-50',
            count: counts?.appointments,
            countColor: 'bg-blue-100 text-[#005ab5]',
        },
    ];

    const currentNav = navItems.find((n) => n.id === resolvedTab) || navItems[0];

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

            {/* Right Sidebar (RTL) */}
            <aside
                className={cn(
                    'fixed inset-y-0 right-0 z-50 bg-white border-l border-gray-200/80 shadow-xl flex flex-col justify-between transition-all duration-300 ease-in-out',
                    mobileOpen ? 'translate-x-0 w-80 sm:w-84' : 'translate-x-full lg:translate-x-0',
                    desktopCollapsed ? 'lg:w-20' : 'lg:w-80'
                )}
            >
                {/* Brand / Facility Header */}
                <div>
                    <div className="min-h-[5.5rem] px-4 py-3.5 flex items-center justify-between border-b border-gray-100">
                        <div className={cn('flex items-center gap-3 min-w-0 flex-1', desktopCollapsed && 'lg:hidden')}>
                            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
                                <Hospital className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span
                                    className="font-black text-[13px] text-gray-900 font-['Cairo'] block leading-snug"
                                    title={facilityName}
                                >
                                    {facilityName}
                                </span>
                                <span
                                    className="text-[11px] text-emerald-700 font-bold block mt-0.5 leading-tight"
                                    title={branchName}
                                >
                                    {branchName ? `فرع: ${branchName}` : 'لوحة الاستقبال المعتمدة'}
                                </span>
                            </div>
                        </div>

                        {/* Collapsed Icon */}
                        {desktopCollapsed && (
                            <div className="hidden lg:flex w-full justify-center">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                                    <Hospital className="w-5 h-5" />
                                </div>
                            </div>
                        )}

                        {/* Mobile Close Button */}
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <div className="p-3 space-y-1.5">
                        <div className={cn('px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider', desktopCollapsed && 'lg:hidden')}>
                            إدارة الاستقبال اليومي
                        </div>

                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = resolvedTab === item.id;

                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    onClick={() => {
                                        if (onTabChange) onTabChange(item.id);
                                        setMobileOpen(false);
                                    }}
                                    title={desktopCollapsed ? item.label : undefined}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-right cursor-pointer select-none group',
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

                {/* Footer User Info & Logout */}
                <div className="p-3 border-t border-gray-100">
                    <div className={cn('p-3 rounded-2xl bg-gray-50/80 mb-2', desktopCollapsed && 'lg:hidden')}>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                                {user.name ? user.name[0] : 'م'}
                            </div>
                            <div className="truncate">
                                <span className="font-bold text-xs text-gray-900 block truncate">
                                    {user.name || 'موظف الاستقبال'}
                                </span>
                                <span className="text-[10px] text-gray-400 block truncate font-mono">
                                    {user.email || 'reception'}
                                </span>
                            </div>
                        </div>
                    </div>

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

            {/* Main Content Area */}
            <div
                className={cn(
                    'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out',
                    desktopCollapsed ? 'lg:mr-20' : 'lg:mr-80'
                )}
            >
                {/* Top Header Bar */}
                <header className="h-20 bg-white border-b border-gray-200/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Trigger */}
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Desktop Collapse Toggle */}
                        <button
                            type="button"
                            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
                            className="hidden lg:flex p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            title={desktopCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
                        >
                            {desktopCollapsed ? (
                                <PanelRightOpen className="w-5 h-5" />
                            ) : (
                                <PanelRightClose className="w-5 h-5" />
                            )}
                        </button>

                        {/* Breadcrumbs / Section Title */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-gray-400 hidden sm:inline">
                                {user?.is_receptionist ? 'قسم الاستقبال والانتظار' : 'إدارة المنشأة الطبية'}
                            </span>
                            <ChevronLeft className="w-3.5 h-3.5 text-gray-300 hidden sm:inline" />
                            <span className="font-black text-gray-900 text-sm font-['Cairo']">
                                {currentNav.label}
                            </span>
                        </div>
                    </div>

                    {/* Top Actions */}
                    <div className="flex items-center gap-3">
                        {onOpenWalkInModal && (
                            <button
                                type="button"
                                onClick={onOpenWalkInModal}
                                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                            >
                                <Ticket className="w-4 h-4" />
                                <span className="hidden sm:inline">قطع تذكرة فورية (Walk-in)</span>
                                <span className="sm:hidden">تذكرة فورية</span>
                            </button>
                        )}

                        <Link
                            href="/"
                            target="_blank"
                            className="p-2.5 rounded-xl text-gray-400 hover:text-[#005ab5] hover:bg-blue-50 transition-colors hidden md:flex items-center gap-1.5 text-xs font-bold"
                            title="فتح بوابة المنصة الرئيسية"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>بوابة طبيبي</span>
                        </Link>
                    </div>
                </header>

                {/* Page Body */}
                <main className="flex-1 px-4 sm:px-8 py-6 max-w-full w-full">
                    {children}
                </main>
            </div>
        </div>
    );
};

