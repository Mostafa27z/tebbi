import React from 'react';
import { useForm } from '@inertiajs/react';
import { Modal } from '@/components/common/modal';
import { FormInput } from '@/components/common/form-input';
import { CustomSelect } from '@/components/common/custom-select';
import { InternationalPhoneInput } from '@/components/common/international-phone-input';
import { PasswordInput } from '@/components/common/password-input';
import { LoadingButton } from '@/components/common/loading-button';
import { Facility, SpecialtyOption } from '../types';
import { User, Mail, Award, Clock, DollarSign, Check } from 'lucide-react';

interface AddDoctorModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: number;
    facilities: Facility[];
    specialties: SpecialtyOption[];
}

export const AddDoctorModal: React.FC<AddDoctorModalProps> = ({
    isOpen,
    onClose,
    groupId,
    facilities,
    specialties,
}) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        facility_id: facilities[0]?.id || 0,
        specialty_id: specialties[0]?.id || 1,
        title_ar: 'استشاري',
        subspecialty: '',
        consultation_fee: 250,
        waiting_time_minutes: 15,
        experience_years: 5,
        accepts_insurance: true as boolean,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/group/${groupId}/doctors`, {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="إضافة طبيب واستشاري جديد بالمجمع"
            description="إنشاء حساب الطبيب واعتماده بالمنشأة وتحديد سعر الكشف ومدة الموعد"
            maxWidth="2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormInput
                        label="اسم الطبيب بالكامل"
                        required
                        placeholder="د. ماجد السبيعي"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        error={errors.name}
                        icon={<User className="w-4 h-4 text-gray-400" />}
                    />

                    <FormInput
                        label="البريد الإلكتروني للولوج"
                        type="email"
                        required
                        dir="ltr"
                        placeholder="dr.majed@tebiby.com"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        icon={<Mail className="w-4 h-4 text-gray-400" />}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <PasswordInput
                        label="كلمة المرور"
                        required
                        placeholder="••••••••"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                    />

                    <InternationalPhoneInput
                        label="رقم الجوال"
                        value={data.phone}
                        onChange={(fullPhone) => setData('phone', fullPhone)}
                        error={errors.phone}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <CustomSelect
                        label="المنشأة المتاح بها"
                        value={data.facility_id}
                        onChange={(val) => setData('facility_id', Number(val))}
                        options={facilities.map((f) => ({
                            value: f.id,
                            label: `${f.name} (${f.city})`,
                        }))}
                        error={errors.facility_id}
                    />

                    <CustomSelect
                        label="التخصص الطبي"
                        value={data.specialty_id}
                        onChange={(val) => setData('specialty_id', Number(val))}
                        options={specialties.map((s) => ({
                            value: s.id,
                            label: s.name_ar,
                        }))}
                        error={errors.specialty_id}
                    />
                </div>

                <FormInput
                    label="اللقب والمسمى المهني"
                    required
                    placeholder="استشاري جراحة العظام والمفاصل والعمود الفقري"
                    value={data.title_ar}
                    onChange={(e) => setData('title_ar', e.target.value)}
                    error={errors.title_ar}
                    icon={<Award className="w-4 h-4 text-gray-400" />}
                />

                <FormInput
                    label="التخصص الدقيق والاهتمام الإكلينيكي"
                    placeholder="زراعة المفاصل، مناظير الركبة، إصابات الملاعب المتقدمة"
                    value={data.subspecialty}
                    onChange={(e) => setData('subspecialty', e.target.value)}
                    error={errors.subspecialty}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormInput
                        label="سعر الكشف (ر.س)"
                        type="number"
                        min="0"
                        step="10"
                        required
                        value={data.consultation_fee}
                        onChange={(e) => setData('consultation_fee', parseFloat(e.target.value) || 0)}
                        error={errors.consultation_fee}
                        icon={<DollarSign className="w-4 h-4 text-gray-400" />}
                    />

                    <FormInput
                        label="مدة الكشف (بالدقائق)"
                        type="number"
                        min="5"
                        max="120"
                        required
                        value={data.waiting_time_minutes}
                        onChange={(e) => setData('waiting_time_minutes', parseInt(e.target.value) || 15)}
                        error={errors.waiting_time_minutes}
                        icon={<Clock className="w-4 h-4 text-gray-400" />}
                    />

                    <FormInput
                        label="سنوات الخبرة"
                        type="number"
                        min="1"
                        max="50"
                        value={data.experience_years}
                        onChange={(e) => setData('experience_years', parseInt(e.target.value) || 1)}
                        error={errors.experience_years}
                    />
                </div>

                <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={data.accepts_insurance}
                            onChange={(e) => setData('accepts_insurance', e.target.checked)}
                            className="rounded text-[#005ab5] focus:ring-[#005ab5] w-4 h-4"
                        />
                        <span className="font-bold text-gray-700 text-xs font-['Cairo']">
                            قبول شركات التأمين الطبي المعتمدة بالمجمع
                        </span>
                    </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
                    >
                        إلغاء
                    </button>
                    <LoadingButton
                        type="submit"
                        loading={processing}
                        loadingText="جاري الحفظ..."
                        variant="primary"
                        icon={<Check className="w-4 h-4" />}
                    >
                        حفظ واعتماد الطبيب
                    </LoadingButton>
                </div>
            </form>
        </Modal>
    );
};

