import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Modal,
    FormInput,
    SurfaceCard,
    ModalFooter,
    ChoicePillGroup,
    InfoBanner,
} from '@/components/common';
import { Group } from '../types';
import { Globe, Sparkles } from 'lucide-react';

interface GroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingGroup?: Group | null;
    group?: Group | null;
}

const STATUS_OPTIONS = [
    {
        value: 'active' as const,
        label: 'نشط وفعال',
        dotColor: 'bg-emerald-500',
        activeTone: 'emerald' as const,
    },
    {
        value: 'suspended' as const,
        label: 'معلّق مؤقتاً',
        dotColor: 'bg-red-500',
        activeTone: 'danger' as const,
    },
];

export const GroupModal: React.FC<GroupModalProps> = React.memo(({
    isOpen,
    onClose,
    editingGroup,
    group,
}) => {
    const currentGroup = editingGroup || group || null;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name_ar: '',
        name_en: '',
        slug: '',
        cr_number: '',
        status: 'active' as 'active' | 'suspended',
        create_admin: false as boolean,
        admin_name: '',
        admin_email: '',
        admin_password: '',
        admin_phone: '',
    });

    const [customSlugEdited, setCustomSlugEdited] = React.useState(false);

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\u0621-\u064A\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    useEffect(() => {
        if (currentGroup) {
            setData({
                name_ar: currentGroup.name_ar || '',
                name_en: currentGroup.name_en || '',
                slug: currentGroup.slug || '',
                cr_number: currentGroup.cr_number || '',
                status: currentGroup.status === 'suspended' ? 'suspended' : 'active',
                create_admin: false,
                admin_name: '',
                admin_email: '',
                admin_password: '',
                admin_phone: '',
            });
            setCustomSlugEdited(true);
        } else {
            reset();
            setData('status', 'active');
            setCustomSlugEdited(false);
        }
    }, [currentGroup, isOpen]);

    const handleNameArChange = (val: string) => {
        setData((prev) => {
            const next = { ...prev, name_ar: val };
            if (!customSlugEdited && !currentGroup) {
                next.slug = slugify(prev.name_en || val);
            }
            return next;
        });
    };

    const handleNameEnChange = (val: string) => {
        setData((prev) => {
            const next = { ...prev, name_en: val };
            if (!customSlugEdited && !currentGroup) {
                next.slug = slugify(val || prev.name_ar);
            }
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentGroup) {
            put(`/admin/groups/${currentGroup.id}`, {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post('/admin/groups', {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={currentGroup ? `تعديل المجمع الطبي (${currentGroup.name_ar})` : 'إضافة مجمع طبي جديد'}
            description="إدارة المجمعات والمنظومات الطبية الرئيسية في المنصة وتحديث بياناتها الرسمية"
            maxWidth="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4 font-['Tajawal']" dir="rtl">
                <FormInput
                    label="اسم المجمع الطبي (بالعربية)"
                    required
                    placeholder="مثال: مجموعة د. سليمان الحبيب الطبية"
                    value={data.name_ar}
                    onChange={(e) => handleNameArChange(e.target.value)}
                    error={errors.name_ar}
                />

                <FormInput
                    label="اسم المجمع (بالإنجليزية)"
                    placeholder="e.g. Dr. Sulaiman Al Habib Medical Group"
                    value={data.name_en}
                    onChange={(e) => handleNameEnChange(e.target.value)}
                    error={errors.name_en}
                    dir="ltr"
                />

                <div className="space-y-2">
                    <FormInput
                        label={
                            <span className="inline-flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-[#005ab5]" />
                                <span>رابط صفحة المجمع المخصصة (Slug)</span>
                            </span>
                        }
                        labelAction="اسم مخصص للترويج واستعراض الأطباء"
                        value={data.slug}
                        onChange={(e) => {
                            setCustomSlugEdited(true);
                            setData('slug', slugify(e.target.value));
                        }}
                        placeholder="habeeb-medical-group"
                        dir="ltr"
                        className="font-mono text-xs"
                        error={errors.slug}
                    />

                    <InfoBanner
                        variant="blue"
                        icon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                    >
                        <span className="text-[11px] text-slate-500 ml-1.5">معاينة رابط الصفحة:</span>
                        <span className="font-mono font-bold text-[11px] text-[#005ab5]" dir="ltr">
                            {typeof window !== 'undefined' ? window.location.origin : 'https://tebiby.com'}/group/{data.slug || 'your-group-name'}
                        </span>
                    </InfoBanner>
                </div>

                <FormInput
                    label="رقم السجل التجاري"
                    placeholder="1010xxxxxx"
                    value={data.cr_number}
                    onChange={(e) => setData('cr_number', e.target.value)}
                    error={errors.cr_number}
                    dir="ltr"
                />

                {currentGroup ? (
                    <ChoicePillGroup
                        label="حالة تفعيل المنظومة الطبية"
                        value={data.status}
                        onChange={(val) => setData('status', val)}
                        options={STATUS_OPTIONS}
                        columns={2}
                    />
                ) : (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={data.create_admin}
                                onChange={(e) => setData('create_admin', e.target.checked)}
                                className="rounded text-[#005ab5] focus:ring-[#005ab5]"
                            />
                            <span className="text-xs font-bold text-slate-700 font-['Cairo']">
                                إنشاء وتعيين حساب مدير للمجمع الآن
                            </span>
                        </label>

                        {data.create_admin && (
                            <SurfaceCard variant="blue" padding="sm" rounded="2xl" className="space-y-3">
                                <FormInput
                                    label="اسم المدير"
                                    required
                                    placeholder="أحمد العلي"
                                    value={data.admin_name}
                                    onChange={(e) => setData('admin_name', e.target.value)}
                                    error={errors.admin_name}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <FormInput
                                        label="البريد الإلكتروني"
                                        type="email"
                                        required
                                        placeholder="admin@group.com"
                                        value={data.admin_email}
                                        onChange={(e) => setData('admin_email', e.target.value)}
                                        error={errors.admin_email}
                                        dir="ltr"
                                    />
                                    <FormInput
                                        label="كلمة المرور"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={data.admin_password}
                                        onChange={(e) => setData('admin_password', e.target.value)}
                                        error={errors.admin_password}
                                        dir="ltr"
                                    />
                                </div>
                            </SurfaceCard>
                        )}
                    </div>
                )}

                <ModalFooter
                    onCancel={onClose}
                    loading={processing}
                    submitText={currentGroup ? 'حفظ التعديلات' : 'حفظ واعتماد المجمع'}
                />
            </form>
        </Modal>
    );
});
GroupModal.displayName = 'GroupModal';
