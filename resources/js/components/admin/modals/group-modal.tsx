import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal } from '@/components/common/modal';
import { FormInput } from '@/components/common/form-input';
import { LoadingButton } from '@/components/common/loading-button';
import { Group } from '../types';

interface GroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingGroup: Group | null;
}

export const GroupModal: React.FC<GroupModalProps> = ({ isOpen, onClose, editingGroup }) => {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name_ar: '',
        name_en: '',
        cr_number: '',
        create_admin: false as boolean,
        admin_name: '',
        admin_email: '',
        admin_password: '',
        admin_phone: '',
    });

    useEffect(() => {
        if (editingGroup) {
            setData({
                name_ar: editingGroup.name_ar,
                name_en: editingGroup.name_en || '',
                cr_number: editingGroup.cr_number || '',
                create_admin: false,
                admin_name: '',
                admin_email: '',
                admin_password: '',
                admin_phone: '',
            });
        } else {
            reset();
        }
    }, [editingGroup, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingGroup) {
            put(`/admin/groups/${editingGroup.id}`, {
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
            title={editingGroup ? `تعديل المجمع الطبي (${editingGroup.name_ar})` : 'إضافة مجمع طبي جديد'}
            description="إدارة المجمعات والمنظومات الطبية الرئيسية في المنصة"
            maxWidth="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="اسم المجمع الطبي (بالعربية)"
                    required
                    placeholder="مثال: مجموعة د. سليمان الحبيب الطبية"
                    value={data.name_ar}
                    onChange={(e) => setData('name_ar', e.target.value)}
                    error={errors.name_ar}
                />

                <FormInput
                    label="اسم المجمع (بالإنجليزية)"
                    placeholder="e.g. Dr. Sulaiman Al Habib Medical Group"
                    value={data.name_en}
                    onChange={(e) => setData('name_en', e.target.value)}
                    error={errors.name_en}
                    dir="ltr"
                />

                <FormInput
                    label="رقم السجل التجاري"
                    placeholder="1010xxxxxx"
                    value={data.cr_number}
                    onChange={(e) => setData('cr_number', e.target.value)}
                    error={errors.cr_number}
                    dir="ltr"
                />

                {!editingGroup && (
                    <div className="pt-3 border-t border-gray-100 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={data.create_admin}
                                onChange={(e) => setData('create_admin', e.target.checked)}
                                className="rounded text-[#005ab5] focus:ring-[#005ab5]"
                            />
                            <span className="text-xs font-bold text-gray-700">
                                إنشاء وتعيين حساب مدير للمجمع الآن
                            </span>
                        </label>

                        {data.create_admin && (
                            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
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
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                        إلغاء
                    </button>
                    <LoadingButton
                        type="submit"
                        loading={processing}
                        className="font-['Cairo']"
                    >
                        {editingGroup ? 'تحديث البيانات' : 'حفظ واعتماد المجمع'}
                    </LoadingButton>
                </div>
            </form>
        </Modal>
    );
};

