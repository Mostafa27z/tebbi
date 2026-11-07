import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { 
    Activity, 
    Calendar, 
    Clock, 
    LayoutDashboard, 
    Stethoscope, 
    User as UserIcon, 
    BarChart3, 
    Bell, 
    ShieldCheck, 
    Search,
    LogOut,
    LogIn,
    UserPlus,
    ChevronDown
} from 'lucide-react';

interface SharedProps {
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
            role: 'patient' | 'doctor' | 'admin';
            avatar?: string;
            doctor_profile?: {
                title_ar: string;
                specialty?: { name_ar: string };
            };
        } | null;
        activeTicket?: {
            booking_reference: string;
            ticket_number: number;
            status: string;
        } | null;
    };
    [key: string]: any;
}

export default function TebibyHeader() {
    const { url, props } = usePage<SharedProps>();
    const user = props.auth?.user;
    const activeTicket = props.auth?.activeTicket;
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const navLinks = [
        { name: 'الرئيسية وحجز موعد', href: '/', active: url === '/', icon: Search },
        ...(activeTicket ? [
            { name: 'تتبع الدور الحي', href: `/queue/${activeTicket.booking_reference}`, active: url.startsWith('/queue'), icon: Clock, badge: `رقم ${activeTicket.ticket_number}` },
        ] : []),
        ...(user?.role === 'patient' ? [
            { name: 'حسابي ومواعيدي', href: '/patient/portal', active: url.startsWith('/patient'), icon: UserIcon },
        ] : []),
        ...(user?.role === 'doctor' ? [
            { name: 'لوحة تحكم الطبيب', href: '/doctor/dashboard', active: url.startsWith('/doctor'), icon: Stethoscope },
        ] : []),
        ...(user?.role === 'admin' ? [
            { name: 'لوحة تحكم الطبيب', href: '/doctor/dashboard', active: url.startsWith('/doctor'), icon: Stethoscope },
            { name: 'إدارة المنصة والتحليلات', href: '/admin/analytics', active: url.startsWith('/admin'), icon: BarChart3 },
        ] : []),
    ];

    const handleLogout = () => {
        router.post('/logout');
    };

    const getRoleBadge = (role?: string) => {
        switch (role) {
            case 'doctor':
                return { text: 'طبيب معتمد', bg: 'bg-purple-100 text-purple-700' };
            case 'admin':
                return { text: 'مشرف النظام', bg: 'bg-amber-100 text-amber-800' };
            default:
                return { text: 'مريض', bg: 'bg-emerald-100 text-emerald-700' };
        }
    };

    const roleBadge = getRoleBadge(user?.role);

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#005ab5] to-[#0072e2] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-[28px]">health_and_safety</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-2xl tracking-tight text-[#005ab5] font-['Cairo']">طبيبي</span>
                                    <span className="text-[10px] font-bold bg-[#68fadd]/20 text-[#006b5c] px-2 py-0.5 rounded-full border border-[#006b5c]/20">Tebiby VIP</span>
                                </div>
                                <span className="text-xs text-gray-500 font-medium block">الحجز الذكي والتتبع الحي للعيادات</span>
                            </div>
                        </Link>

                        {/* Navigation Links */}
                        <nav className="hidden xl:flex items-center gap-1">
                            {navLinks.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                                            item.active
                                                ? 'bg-[#d6e3ff]/60 text-[#005ab5]'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.name}</span>
                                        {item.badge && (
                                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full animate-pulse">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Left Actions: User Profile or Login/Register buttons */}
                    <div className="flex items-center gap-3">
                        {activeTicket && (
                            <Link
                                href={`/queue/${activeTicket.booking_reference}`}
                                className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold hover:bg-emerald-100 transition-colors"
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                <span>دورك الحي: رقم {activeTicket.ticket_number}</span>
                            </Link>
                        )}

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                    className="flex items-center gap-2.5 p-1.5 pr-3 pl-3 rounded-2xl bg-gray-50 border border-gray-200/80 hover:bg-gray-100 transition-colors text-right"
                                >
                                    <img
                                        src={user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces'}
                                        alt={user.name}
                                        className="w-9 h-9 rounded-full object-cover ring-2 ring-[#005ab5]/30"
                                    />
                                    <div className="hidden sm:block">
                                        <div className="flex items-center gap-1.5">
                                            <span className="block text-xs font-bold text-gray-900">{user.name}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${roleBadge.bg}`}>
                                                {roleBadge.text}
                                            </span>
                                        </div>
                                        <span className="block text-[11px] text-gray-500 font-medium truncate max-w-[120px]">
                                            {user.email}
                                        </span>
                                    </div>
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                </button>

                                {/* Dropdown Menu */}
                                {userDropdownOpen && (
                                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 text-xs">
                                        <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                                            <span className="block font-bold text-gray-900">{user.name}</span>
                                            <span className="text-[10px] text-gray-500">{user.email}</span>
                                        </div>

                                        {user.role === 'patient' && (
                                            <Link
                                                href="/patient/portal"
                                                onClick={() => setUserDropdownOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-50 font-bold"
                                            >
                                                <UserIcon className="w-4 h-4 text-[#005ab5]" />
                                                <span>بوابة المريض والملف الطبي</span>
                                            </Link>
                                        )}

                                        {user.role === 'doctor' && (
                                            <Link
                                                href="/doctor/dashboard"
                                                onClick={() => setUserDropdownOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-50 font-bold"
                                            >
                                                <Stethoscope className="w-4 h-4 text-purple-600" />
                                                <span>لوحة تحكم الطبيب والعيادة</span>
                                            </Link>
                                        )}

                                        {user.role === 'admin' && (
                                            <Link
                                                href="/admin/analytics"
                                                onClick={() => setUserDropdownOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-50 font-bold"
                                            >
                                                <BarChart3 className="w-4 h-4 text-amber-600" />
                                                <span>لوحة القيادة المركزية</span>
                                            </Link>
                                        )}

                                        {activeTicket && (
                                            <Link
                                                href={`/queue/${activeTicket.booking_reference}`}
                                                onClick={() => setUserDropdownOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-50 font-bold"
                                            >
                                                <Clock className="w-4 h-4 text-emerald-600" />
                                                <span>تتبع الدور الحي (رقم {activeTicket.ticket_number})</span>
                                            </Link>
                                        )}

                                        <div className="border-t border-gray-100 my-1"></div>

                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-right flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 font-bold"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>تسجيل الخروج</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-[#005ab5] hover:bg-gray-100/70 transition-colors"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span>تسجيل الدخول</span>
                                </Link>
                                <Link
                                    href="/register"
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span>إنشاء حساب</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Sub-Navigation Bar */}
                {navLinks.length > 1 && (
                    <div className="flex xl:hidden overflow-x-auto py-2.5 gap-2 border-t border-gray-100 no-scrollbar">
                        {navLinks.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                                        item.active
                                            ? 'bg-[#005ab5] text-white'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </header>
    );
}
