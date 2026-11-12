import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { 
    Stethoscope, 
    Calendar, 
    Clock, 
    FileText, 
    LogOut, 
    Menu, 
    X, 
    ChevronLeft,
    PanelRightClose,
    PanelRightOpen,
    ExternalLink,
    ToggleLeft,
    ToggleRight,
    UserCheck,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvailabilityDialog } from '@/components/doctor/availability-dialog';

export type DoctorTab = 'consultation' | 'history' | 'schedule';

interface DoctorDashboardLayoutProps {
    children: React.ReactNode;
    activeTab?: DoctorTab;
    onTabChange?: (tab: DoctorTab) => void;
    doctor: {
        id: number;
        title_ar: string;
        is_available_today: boolean;
        user: { name: string; email: string; avatar?: string };
        specialty: { name_ar: string };
        clinic: { name: string; district: string };
    };
    counts?: {
        waiting?: number;
        inConsultation?: number;
        completed?: number;
    };
    onToggleAvailability?: () => void;
    onCallNext?: () => void;
    callingNext?: boolean;
}

export const DoctorDashboardLayout: React.FC<DoctorDashboardLayoutProps> = ({
    children,
    activeTab,
    onTabChange,
    doctor,
    counts,
    onToggleAvailability,
    onCallNext,
    callingNext,
}) => {
    const { url } = usePage();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);
    const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);

    const handleToggleClick = () => {
        if (onToggleAvailability) {
            onToggleAvailability();
        } else {
            setAvailabilityDialogOpen(true);
        }
    };

    const resolvedTab: DoctorTab = activeTab || (
        url.startsWith('/doctor/history') ? 'history' :
        url.startsWith('/doctor/schedule') ? 'schedule' : 'consultation'
    );

    const navItems = [
        {
            id: 'consultation' as DoctorTab,
            href: '/doctor/dashboard',
            label: 'العيادة والكشف المباشر',
            description: 'جلسة المعاينة الحالية وقائمة الانتظار',
            icon: Stethoscope,
            color: 'text-[#005ab5]',
            bg: 'bg-blue-50',
            count: counts?.waiting,
            countColor: 'bg-amber-100 text-amber-800',
        },
        {
            id: 'history' as DoctorTab,
            href: '/doctor/history',
            label: 'سجل الكشوفات والروشتات',
            description: 'الحالات المكتملة والوصفات الصادرة',
            icon: FileText,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            count: counts?.completed,
            countColor: 'bg-emerald-100 text-emerald-800',
        },
        {
            id: 'schedule' as DoctorTab,
            href: '/doctor/schedule',
            label: 'جدول وتواجد الطبيب',
            description: 'مواعيد الاستقبال والحالة التشغيلية',
            icon: Clock,
            color: 'text-purple-500',
            bg: 'bg-purple-50',
            count: undefined,
        },
    ];

    const currentNav = navItems.find((n) => n.id === resolvedTab) || navItems[0];

    const handleLogout = () => {
        router.post(route('logout'));
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex font-['Tajawal']" dir="rtl">
            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div 
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
                />
            )}

            {/* Right Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 right-0 z-50 bg-white border-l border-gray-200/80 shadow-xl flex flex-col justify-between transition-all duration-300 ease-in-out',
                    mobileOpen ? 'translate-x-0 w-80' : 'translate-x-full lg:translate-x-0',
                    desktopCollapsed ? 'lg:w-20' : 'lg:w-80'
                )}
            >
                <div>
                    {/* Doctor Header in Sidebar */}
                    <div className="min-h-[5.5rem] px-4.5 py-3.5 flex items-center justify-between border-b border-gray-100">
                        <div className={cn('flex items-center gap-3 min-w-0 flex-1', desktopCollapsed && 'lg:hidden')}>
                            <img
                                src={
                                    doctor.user.avatar ||
                                    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&h=100&fit=crop&crop=faces'
                                }
                                alt={doctor.user.name}
                                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#005ab5]/20 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <span className="font-black text-[13.5px] text-gray-900 font-['Cairo'] block leading-snug truncate" title={doctor.user.name}>
                                    {doctor.user.name}
                                </span>
                                <span className="text-[11px] text-[#005ab5] font-bold block truncate">
                                    {doctor.specialty.name_ar}
                                </span>
                                <span className="text-[10px] text-gray-400 block truncate" title={doctor.clinic?.name}>
                                    {doctor.clinic?.name || 'المنشأة الطبية'}
                                </span>
                            </div>
                        </div>

                        {/* Collapsed Icon */}
                        {desktopCollapsed && (
                            <div className="hidden lg:flex w-full justify-center">
                                <img
                                    src={
                                        doctor.user.avatar ||
                                        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&h=100&fit=crop&crop=faces'
                                    }
                                    alt={doctor.user.name}
                                    className="w-10 h-10 rounded-2xl object-cover ring-2 ring-[#005ab5]/20"
                                />
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

                    {/* Navigation Items */}
                    <div className="p-3 space-y-1.5">
                        <div className={cn('px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider', desktopCollapsed && 'lg:hidden')}>
                            لوحة الطبيب الاستشاري
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

                {/* Footer User & Logout */}
                <div className="p-3 border-t border-gray-100">
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

            {/* Main Area */}
            <div
                className={cn(
                    'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out',
                    desktopCollapsed ? 'lg:mr-20' : 'lg:mr-80'
                )}
            >
                {/* Header Bar */}
                <header className="h-20 bg-white border-b border-gray-200/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

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

                        <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-gray-400 hidden sm:inline">عيادة الطبيب</span>
                            <ChevronLeft className="w-3.5 h-3.5 text-gray-300 hidden sm:inline" />
                            <span className="font-black text-gray-900 text-sm font-['Cairo']">
                                {currentNav.label}
                            </span>
                        </div>
                    </div>

                    {/* Top Actions: Availability & Call Next */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleToggleClick}
                            className={cn(
                                'hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer',
                                doctor.is_available_today
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                            )}
                        >
                            {doctor.is_available_today ? (
                                <>
                                    <ToggleRight className="w-4 h-4 text-emerald-600" />
                                    <span>متاح بالعيادة</span>
                                </>
                            ) : (
                                <>
                                    <ToggleLeft className="w-4 h-4 text-gray-400" />
                                    <span>العيادة معلقة</span>
                                </>
                            )}
                        </button>

                        {onCallNext && (
                            <button
                                type="button"
                                onClick={onCallNext}
                                disabled={callingNext || (counts?.waiting ?? 0) === 0}
                                className="px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <UserCheck className="w-4 h-4" />
                                <span>{callingNext ? 'جارٍ الاستدعاء...' : 'استدعاء التالي'}</span>
                            </button>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 px-4 sm:px-8 py-6 max-w-full w-full">
                    {children}
                </main>
            </div>

            {/* Availability Confirmation Modal */}
            <AvailabilityDialog
                isOpen={availabilityDialogOpen}
                onClose={() => setAvailabilityDialogOpen(false)}
                isAvailable={doctor.is_available_today}
            />
        </div>
    );
};

