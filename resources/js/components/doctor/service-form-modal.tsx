import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { ClipboardList, Clock, DollarSign, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/common/modal';
import { FormInput } from '@/components/common/form-input';
import { FormTextarea } from '@/components/common/form-textarea';
import { ModalFooter } from '@/components/common/surface-card';
import { cn, formatDurationArabic } from '@/lib/utils';
import type { DoctorServiceItem } from '@/components/tebiby/booking/types';

interface ServiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: DoctorServiceItem | null;
}

const DURATION_PRESETS = [
    { minutes: 15, label: '15 د' },
    { minutes: 30, label: '30 د' },
    { minutes: 45, label: '45 د' },
    { minutes: 60, label: '60 د (ساعة)' },
    { minutes: 90, label: '90 د' },
    { minutes: 120, label: '120 د (ساعتان)' },
    { minutes: 180, label: '180 د (3 ساعات)' },
    { minutes: 300, label: '300 د (5 ساعات)' },
];

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
    isOpen,
    onClose,
    service,
}) => {
    const isEditing = Boolean(service);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('200');
    const [durationMinutes, setDurationMinutes] = useState('30');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        if (service) {
            setName(service.name || '');
            setPrice(String(Number(service.price ?? 0)));
            setDurationMinutes(String(service.duration_minutes ?? 30));
            setDescription(service.description || '');
            setIsActive(service.is_active !== false);
        } else {
            setName('');
            setPrice('200');
            setDurationMinutes('30');
            setDescription('');
            setIsActive(true);
        }
        setErrors({});
    }, [isOpen, service]);

    const parsedDuration = Math.max(0, parseInt(durationMinutes || '0', 10) || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        const nextErrors: Record<string, string> = {};
        if (!name.trim()) {
            nextErrors.name = 'يرجى إدخال اسم نوع الكشف أو الإجراء الطبي';
        }
        const numPrice = Number(price);
        if (price === '' || Number.isNaN(numPrice) || numPrice < 0) {
            nextErrors.price = 'يرجى إدخال سعر صحيح';
        }
        if (parsedDuration < 5 || parsedDuration > 720) {
            nextErrors.duration_minutes = 'يجب أن تتراوح المدة بين 5 دقائق و 720 دقيقة (12 ساعة)';
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setErrors({});
        setSubmitting(true);

        const payload = {
            name: name.trim(),
            price: numPrice,
            duration_minutes: parsedDuration,
            description: description.trim() || null,
            is_active: isActive,
        };

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    isEditing
                        ? 'تم تحديث بيانات نوع الكشف بنجاح'
                        : 'تم إضافة نوع الكشف الجديد بنجاح'
                );
                onClose();
            },
            onError: (backendErrors: Record<string, string>) => {
                setErrors(backendErrors);
                toast.error('تعذر حفظ البيانات، يرجى مراجعة الحقول');
            },
            onFinish: () => {
                setSubmitting(false);
            },
        };

        if (isEditing && service) {
            router.put(`/doctor/services/${service.id}`, payload, options);
        } else {
            router.post('/doctor/services', payload, options);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="xl"
            headerIcon={<ClipboardList className="w-5 h-5" />}
            title={isEditing ? 'تعديل نوع الكشف / الإجراء الطبي' : 'إضافة نوع كشف جديد'}
            description="حدد اسم الكشف أو الإجراء والسعر ومدته بالدقائق ليظهر للمرضى أثناء الحجز"
        >
            <form onSubmit={handleSubmit} className="space-y-4 font-['Tajawal']" dir="rtl">
                <FormInput
                    label="اسم نوع الكشف أو الإجراء الطبي"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: كشف استشاري، خلع ضرس جراحي، تنظيف بشرة..."
                    error={errors.name}
                    icon={<ClipboardList className="w-4 h-4" />}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                        label="السعر (ر.س)"
                        required
                        type="number"
                        min={0}
                        max={100000}
                        step="0.5"
                        dir="ltr"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        error={errors.price}
                        icon={<DollarSign className="w-4 h-4" />}
                        helperText="السعر الأساسي قبل الضريبة (15%)"
                    />

                    <FormInput
                        label="مدة الكشف (بالدقائق)"
                        required
                        type="number"
                        min={5}
                        max={720}
                        step={5}
                        dir="ltr"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        error={errors.duration_minutes}
                        icon={<Clock className="w-4 h-4" />}
                        helperText={
                            parsedDuration >= 5
                                ? `المدة المحسوبة: ${formatDurationArabic(parsedDuration)}`
                                : 'الحد الأدنى 5 دقائق والحد الأقصى 720 دقيقة'
                        }
                    />
                </div>

                {/* Quick Duration Presets */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 space-y-2">
                    <span className="block text-[11px] font-bold text-slate-600 font-['Cairo']">
                        اختيار سريع لمدة الجلسة:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {DURATION_PRESETS.map((preset) => {
                            const selected = parsedDuration === preset.minutes;
                            return (
                                <button
                                    key={preset.minutes}
                                    type="button"
                                    onClick={() => setDurationMinutes(String(preset.minutes))}
                                    className={cn(
                                        'px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer select-none',
                                        selected
                                            ? 'bg-[#005ab5] text-white border-[#005ab5] shadow-2xs'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-[#005ab5]'
                                    )}
                                >
                                    {preset.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <FormTextarea
                    label="وصف مختصر للإجراء (اختياري)"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اكتب نبذة مختصرة للمريض حول ما يشمله هذا الكشف..."
                    error={errors.description}
                />

                {/* Active Visibility Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                    <div className="flex items-center gap-2.5">
                        <div
                            className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                                isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                            )}
                        >
                            {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-slate-900 font-['Cairo']">
                                إظهار الخدمة للمرضى عند الحجز
                            </span>
                            <span className="block text-[11px] text-slate-500">
                                {isActive
                                    ? 'تظهر حالياً ضمن قائمة كشوفاتك المتاحة للحجز'
                                    : 'مخفية مؤقتاً ولن تظهر للمرضى'}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsActive((prev) => !prev)}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0',
                            isActive
                                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        )}
                    >
                        {isActive ? 'مفعّل' : 'مخفي'}
                    </button>
                </div>

                <ModalFooter
                    onCancel={onClose}
                    loading={submitting}
                    loadingText="جارٍ الحفظ..."
                    submitText={isEditing ? 'حفظ التعديلات' : 'إضافة نوع الكشف'}
                    submitIcon={<CheckCircle2 className="w-4 h-4" />}
                />
            </form>
        </Modal>
    );
};
