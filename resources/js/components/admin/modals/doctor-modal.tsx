import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal } from '@/components/common/modal';
import { FormInput } from '@/components/common/form-input';
import { CustomSelect } from '@/components/common/custom-select';
import { InternationalPhoneInput } from '@/components/common/international-phone-input';
import { LoadingButton } from '@/components/common/loading-button';
import { Doctor, Clinic, Specialty } from '../types';

interface DoctorModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingDoctor: Doctor | null;
    specialties: Specialty[];
    clinics: Clinic[];
}

export const DoctorModal: React.FC<DoctorModalProps> = ({
    isOpen,
    onClose,
    editingDoctor,
    specialties,
    clinics,
}) => {
    // Edit Form
    const editForm = useForm({
        title_ar: '',
        subspecialty: '',
        consultation_fee: 200,
        waiting_time_minutes: 15,
        specialty_id: specialties[0]?.id || 1,
        clinic_id: clinics[0]?.id || 1,
        is_available_today: true as boolean,
    });

    // New Doctor Form
    const newForm = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        facility_id: clinics[0]?.id || 1,
        specialty_id: specialties[0]?.id || 1,
        title_ar: 'استشاري',
        subspecialty: '',
        consultation_fee: 250,
        waiting_time_minutes: 15,
        experience_years: 5,
        accepts_insurance: true as boolean,
    });

    const specialtyOptions = specialties.map((s) => ({
        value: s.id,
        label: s.name_ar,
    }));

    const clinicOptions = clinics.map((c) => ({
        value: c.id,
        label: c.name,
        sublabel: `${c.city} - ${c.district || ''}`,
    }));

    useEffect(() => {
        if (editingDoctor) {
            editForm.setData({
                title_ar: editingDoctor.title_ar,
                subspecialty: editingDoctor.subspecialty || '',
                consultation_fee: editingDoctor.consultation_fee,
                waiting_time_minutes: editingDoctor.waiting_time_minutes,
                specialty_id: editingDoctor.specialty_id,
                clinic_id: editingDoctor.clinic_id,
                is_available_today: editingDoctor.is_available_today,
            });
        } else {
            newForm.reset();
        }
    }, [editingDoctor, isOpen]);

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDoctor) return;
        editForm.put(`/admin/doctors/${editingDoctor.id}`, {
            onSuccess: () => onClose(),
        });
    };

    const handleNewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        newForm.post('/admin/doctors', {
            onSuccess: () => {
                onClose();
                newForm.reset();
            },
        });
    };

    if (editingDoctor) {
        return (
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`تعديل بيانات الطبيب (${editingDoctor.user.name})`}
                description="تعديل المسمى، التخصص، والرسوم"
                maxWidth="lg"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <FormInput
                        label="المسمى واللقب المهني"
                        required
                        value={editForm.data.title_ar}
                        onChange={(e) => editForm.setData('title_ar', e.target.value)}
                        error={editForm.errors.title_ar}
                    />

                    <FormInput
                        label="التخصص الدقيق"
                        value={editForm.data.subspecialty}
                        onChange={(e) => editForm.setData('subspecialty', e.target.value)}
                        error={editForm.errors.subspecialty}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <CustomSelect
                            label="التخصص الطبي"
                            value={editForm.data.specialty_id}
                            onChange={(val) => editForm.setData('specialty_id', Number(val))}
                            error={editForm.errors.specialty_id}
                            options={specialtyOptions}
                        />

                        <CustomSelect
                            label="المنشأة الأساسية"
                            value={editForm.data.clinic_id}
                            onChange={(val) => editForm.setData('clinic_id', Number(val))}
                            error={editForm.errors.clinic_id}
                            options={clinicOptions}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <FormInput
                            label="سعر الكشفية (ر.س)"
                            type="number"
                            required
                            value={editForm.data.consultation_fee}
                            onChange={(e) => editForm.setData('consultation_fee', Number(e.target.value))}
                            error={editForm.errors.consultation_fee}
                        />

                        <FormInput
                            label="مدة الكشف التقريبية (دقيقة)"
                            type="number"
                            required
                            value={editForm.data.waiting_time_minutes}
                            onChange={(e) => editForm.setData('waiting_time_minutes', Number(e.target.value))}
                            error={editForm.errors.waiting_time_minutes}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={editForm.processing}
                            className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                        <LoadingButton
                            type="submit"
                            loading={editForm.processing}
                            className="font-['Cairo']"
                        >
                            حفظ التعديلات
                        </LoadingButton>
                    </div>
                </form>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="تسجيل واعتماد طبيب جديد"
            description="إنشاء حساب الطبيب وربطه بالمنشأة والتخصص"
            maxWidth="xl"
        >
            <form onSubmit={handleNewSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <FormInput
                        label="اسم الطبيب كاملاً"
                        required
                        placeholder="د. طارق التويجري"
                        value={newForm.data.name}
                        onChange={(e) => newForm.setData('name', e.target.value)}
                        error={newForm.errors.name}
                    />

                    <InternationalPhoneInput
                        label="رقم الهاتف"
                        value={newForm.data.phone}
                        onChange={(val) => newForm.setData('phone', val)}
                        error={newForm.errors.phone}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <FormInput
                        label="البريد الإلكتروني"
                        type="email"
                        required
                        placeholder="doctor@tebiby.com"
                        value={newForm.data.email}
                        onChange={(e) => newForm.setData('email', e.target.value)}
                        error={newForm.errors.email}
                        dir="ltr"
                    />

                    <FormInput
                        label="كلمة المرور الأولية"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newForm.data.password}
                        onChange={(e) => newForm.setData('password', e.target.value)}
                        error={newForm.errors.password}
                        dir="ltr"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <CustomSelect
                        label="المنشأة الطبية التابع لها"
                        value={newForm.data.facility_id}
                        onChange={(val) => newForm.setData('facility_id', Number(val))}
                        error={newForm.errors.facility_id}
                        options={clinicOptions}
                    />

                    <CustomSelect
                        label="التخصص الطبي"
                        value={newForm.data.specialty_id}
                        onChange={(val) => newForm.setData('specialty_id', Number(val))}
                        error={newForm.errors.specialty_id}
                        options={specialtyOptions}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <FormInput
                        label="المسمى واللقب المهني"
                        required
                        placeholder="استشاري جراحة العظام"
                        value={newForm.data.title_ar}
                        onChange={(e) => newForm.setData('title_ar', e.target.value)}
                        error={newForm.errors.title_ar}
                    />

                    <FormInput
                        label="التخصص الدقيق"
                        placeholder="جراحة مناظير المفاصل"
                        value={newForm.data.subspecialty}
                        onChange={(e) => newForm.setData('subspecialty', e.target.value)}
                        error={newForm.errors.subspecialty}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <FormInput
                        label="سعر الكشفية (ر.س)"
                        type="number"
                        required
                        value={newForm.data.consultation_fee}
                        onChange={(e) => newForm.setData('consultation_fee', Number(e.target.value))}
                        error={newForm.errors.consultation_fee}
                    />

                    <FormInput
                        label="مدة الكشف (دقيقة)"
                        type="number"
                        value={newForm.data.waiting_time_minutes}
                        onChange={(e) => newForm.setData('waiting_time_minutes', Number(e.target.value))}
                        error={newForm.errors.waiting_time_minutes}
                    />

                    <FormInput
                        label="سنوات الخبرة"
                        type="number"
                        value={newForm.data.experience_years}
                        onChange={(e) => newForm.setData('experience_years', Number(e.target.value))}
                        error={newForm.errors.experience_years}
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={newForm.processing}
                        className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                        إلغاء
                    </button>
                    <LoadingButton
                        type="submit"
                        loading={newForm.processing}
                        className="font-['Cairo']"
                    >
                        اعتماد وتسجيل الطبيب
                    </LoadingButton>
                </div>
            </form>
        </Modal>
    );
};
