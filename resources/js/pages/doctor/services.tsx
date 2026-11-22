import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import toast from 'react-hot-toast';
import {
    ClipboardList,
    Clock,
    DollarSign,
    Edit3,
    Eye,
    EyeOff,
    Plus,
    Sparkles,
    Trash2,
    CheckCircle2,
} from 'lucide-react';
import { DoctorDashboardLayout } from '@/layouts/doctor-dashboard-layout';
import { MetricCard } from '@/components/common/metric-card';
import { SurfaceCard, EmptyStateCard } from '@/components/common/surface-card';
import { AppButton } from '@/components/common/loading-button';
import { ConfirmDeleteModal } from '@/components/common/confirm-delete-modal';
import { ServiceFormModal } from '@/components/doctor/service-form-modal';
import { SlotCapacityCard } from '@/components/doctor/slot-capacity-card';
import { cn, formatDurationArabic } from '@/lib/utils';
import type { DoctorServiceItem } from '@/components/tebiby/booking/types';

interface DoctorServicesPageProps {
    doctor: {
        id: number;
        title_ar: string;
        is_available_today: boolean;
        consultation_fee: number;
        waiting_time_minutes: number;
        slot_auto_confirm_limit?: number;
        slot_waitlist_limit?: number;
        user: {
            name: string;
            email: string;
            avatar?: string;
        };
        specialty: {
            name_ar: string;
        };
        clinic: {
            name: string;
            district: string;
        };
    };
    services: DoctorServiceItem[];
    stats: {
        totalPatients: number;
        waitingCount: number;
        inConsultationCount: number;
        completedCount: number;
        servicesCount?: number;
    };
}

export default function DoctorServicesPage({
    doctor,
    services = [],
    stats,
}: DoctorServicesPageProps) {
    const [formOpen, setFormOpen] = useState(false);
    const [editingService, setEditingService] = useState<DoctorServiceItem | null>(null);
    const [deletingService, setDeletingService] = useState<DoctorServiceItem | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const activeCount = useMemo(
        () => services.filter((s) => s.is_active !== false).length,
        [services]
    );

    const priceRangeText = useMemo(() => {
        if (services.length === 0) return `${Number(doctor.consultation_fee || 0)} ر.س`;
        const prices = services.map((s) => Number(s.price));
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `${min} ر.س` : `${min} - ${max} ر.س`;
    }, [services, doctor.consultation_fee]);

    const durationRangeText = useMemo(() => {
        if (services.length === 0) return `${doctor.waiting_time_minutes || 20} د`;
        const durations = services.map((s) => Number(s.duration_minutes));
        const min = Math.min(...durations);
        const max = Math.max(...durations);
        return min === max
            ? formatDurationArabic(min, true)
            : `${formatDurationArabic(min, true)} - ${formatDurationArabic(max, true)}`;
    }, [services, doctor.waiting_time_minutes]);

    const handleOpenCreate = () => {
        setEditingService(null);
        setFormOpen(true);
    };

    const handleOpenEdit = (service: DoctorServiceItem) => {
        setEditingService(service);
        setFormOpen(true);
    };

    const handleToggle = (service: DoctorServiceItem) => {
        if (togglingId === service.id) return;
        setTogglingId(service.id);
        router.post(
            `/doctor/services/${service.id}/toggle`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        service.is_active !== false
                            ? 'تم إخفاء نوع الكشف مؤقتاً'
                            : 'تم تفعيل نوع الكشف وإظهاره للمرضى'
                    );
                },
                onFinish: () => setTogglingId(null),
            }
        );
    };

    const handleConfirmDelete = () => {
        if (!deletingService || deleting) return;
        setDeleting(true);
        router.delete(`/doctor/services/${deletingService.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('تم حذف نوع الكشف بنجاح');
                setDeletingService(null);
            },
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <DoctorDashboardLayout
            doctor={doctor}
            activeTab="services"
            counts={{
                waiting: stats?.waitingCount,
                inConsultation: stats?.inConsultationCount,
                completed: stats?.completedCount,
                services: activeCount,
            }}
        >
            <Head title={`أنواع الكشوفات والأسعار - ${doctor.user.name}`} />

            <div className="space-y-6 font-['Tajawal']" dir="rtl">
                {/* Header Banner */}
                <SurfaceCard className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
                                <ClipboardList className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 font-['Cairo']">
                                    أنواع الكشوفات والإجراءات الطبية
                                </h1>
                                <p className="text-xs text-slate-500 mt-1">
                                    أضف أنواع الكشوفات الخاصة بك وحدد السعر والمدة بالدقائق (من 5 دقائق حتى 12 ساعة) لتظهر للمرضى مباشرة عند الحجز.
                                </p>
                            </div>
                        </div>

                        <AppButton
                            variant="primary"
                            size="md"
                            icon={<Plus className="w-4 h-4" />}
                            onClick={handleOpenCreate}
                            className="shrink-0"
                        >
                            إضافة نوع كشف جديد
                        </AppButton>
                    </div>
                </SurfaceCard>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MetricCard
                        title="الكشوفات المفعلة"
                        value={`${activeCount} / ${services.length}`}
                        subtitle="تظهر للمرضى في صفحة الحجز"
                        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="نطاق الأسعار"
                        value={priceRangeText}
                        subtitle="قبل احتساب ضريبة القيمة المضافة"
                        icon={<DollarSign className="w-5 h-5 text-[#005ab5]" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="نطاق المدد الزمنية"
                        value={durationRangeText}
                        subtitle="يُستخدم لحجز الوقت ومنع التعارض"
                        icon={<Clock className="w-5 h-5 text-purple-600" />}
                        iconBg="bg-purple-50"
                    />
                </div>

                {/* Per-Slot Concurrency & Auto-Confirm Settings */}
                <SlotCapacityCard
                    compact
                    autoConfirmLimit={doctor.slot_auto_confirm_limit ?? 1}
                    waitlistLimit={doctor.slot_waitlist_limit ?? 1}
                />

                {/* Services Grid */}
                {services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {services.map((service) => {
                            const active = service.is_active !== false;
                            const isToggling = togglingId === service.id;

                            return (
                                <SurfaceCard
                                    key={service.id}
                                    padding="md"
                                    className={cn(
                                        'flex flex-col justify-between transition-all hover:shadow-md',
                                        active
                                            ? 'border-slate-200/90 hover:border-blue-300'
                                            : 'border-slate-200/70 bg-slate-50/70 opacity-85'
                                    )}
                                >
                                    <div className="space-y-3.5">
                                        {/* Top Title & Status */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-black text-base text-slate-900 font-['Cairo'] leading-snug">
                                                    {service.name}
                                                </h3>
                                                {service.description && (
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                                        {service.description}
                                                    </p>
                                                )}
                                            </div>

                                            <span
                                                className={cn(
                                                    'px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0',
                                                    active
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-slate-200/70 text-slate-600 border-slate-300'
                                                )}
                                            >
                                                {active ? 'مفعّل بالحجز' : 'مخفي'}
                                            </span>
                                        </div>

                                        {/* Price & Duration Metrics */}
                                        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50/90 border border-slate-100">
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400">
                                                    سعر الكشف
                                                </span>
                                                <span className="font-black text-sm text-emerald-700 font-['Cairo'] mt-0.5 block">
                                                    {Number(service.price)} ر.س
                                                </span>
                                            </div>

                                            <div className="border-r border-slate-200/80 pr-3">
                                                <span className="block text-[10px] font-bold text-slate-400">
                                                    مدة الجلسة
                                                </span>
                                                <span className="font-bold text-xs text-[#005ab5] mt-0.5 flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                                    <span>{formatDurationArabic(service.duration_minutes)}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Actions */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEdit(service)}
                                            className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#005ab5] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            <span>تعديل</span>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={isToggling}
                                            onClick={() => handleToggle(service)}
                                            className={cn(
                                                'py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border disabled:opacity-50',
                                                active
                                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                            )}
                                            title={active ? 'إخفاء من صفحة الحجز' : 'إظهار في صفحة الحجز'}
                                        >
                                            {active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            <span>{active ? 'إخفاء' : 'تفعيل'}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setDeletingService(service)}
                                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                            title="حذف نوع الكشف"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </SurfaceCard>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyStateCard
                        icon={<Sparkles className="w-6 h-6 text-[#005ab5]" />}
                        title="لم تقم بإضافة أنواع كشوفات مخصصة بعد"
                        description="يمكنك إضافة الكشوفات والإجراءات التي تقدمها (مثل: كشف عام، خلع ضرس، استشارة متابعة) مع تحديد سعر ومدة كل نوع بالدقائق ليختار المريض منها عند الحجز."
                        actionLabel="إضافة أول نوع كشف"
                        onAction={handleOpenCreate}
                    />
                )}
            </div>

            <ServiceFormModal
                isOpen={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditingService(null);
                }}
                service={editingService}
            />

            <ConfirmDeleteModal
                isOpen={Boolean(deletingService)}
                onClose={() => setDeletingService(null)}
                onConfirm={handleConfirmDelete}
                loading={deleting}
                title="حذف نوع الكشف"
                message={
                    deletingService ? (
                        <span>
                            هل أنت متأكد من حذف نوع الكشف{' '}
                            <strong className="text-slate-900">"{deletingService.name}"</strong>؟ لن يؤثر الحذف على المواعيد المسجلة مسبقاً.
                        </span>
                    ) : (
                        ''
                    )
                }
            />
        </DoctorDashboardLayout>
    );
}
