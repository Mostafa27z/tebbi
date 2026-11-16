import React, { useState, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import { Plus, Building2, AlertCircle } from 'lucide-react';
import {
    Modal,
    FormInput,
    CustomSelect,
    ModalFooter,
    ChoicePillGroup,
    EmptyStateCard,
} from '@/components/common';
import { FacilitySpecialtyItem, AvailableFacilityDoctor } from './types';

interface AddFacilityDoctorModalProps {
    isOpen: boolean;
    onClose: () => void;
    facility: { id: number; name: string; branch_name?: string };
    allSpecialties: FacilitySpecialtyItem[];
    availableDoctors: AvailableFacilityDoctor[];
}

export const AddFacilityDoctorModal: React.FC<AddFacilityDoctorModalProps> = React.memo(({
    isOpen,
    onClose,
    facility,
    allSpecialties,
    availableDoctors,
}) => {
    const [addTab, setAddTab] = useState<'new' | 'existing'>('new');

    const newDoctorForm = useForm({
        mode: 'new',
        facility_id: facility.id,
        name: '',
        title_ar: 'استشاري',
        specialty_id: allSpecialties[0]?.id ? String(allSpecialties[0].id) : '',
        subspecialty: '',
        email: '',
        phone: '',
        password: '',
        consultation_fee: 250,
        waiting_time_minutes: 20,
        experience_years: 7,
        license_no: '',
        accepts_insurance: true as boolean,
    });

    const assignDoctorForm = useForm({
        mode: 'existing',
        facility_id: facility.id,
        doctor_profile_id: availableDoctors[0]?.id ? String(availableDoctors[0].id) : '',
        consultation_fee: 250,
        waiting_time_minutes: 20,
        accepts_insurance: true as boolean,
    });

    const specialtyOptions = useMemo(
        () =>
            allSpecialties.map((s) => ({
                value: String(s.id),
                label: s.name_ar,
            })),
        [allSpecialties]
    );

    const availableDoctorOptions = useMemo(
        () =>
            availableDoctors.map((doc) => ({
                value: String(doc.id),
                label: `${doc.user.name} — ${doc.specialty?.name_ar || ''} (${doc.title_ar})`,
                sublabel: doc.clinic ? `المقر الحالي: ${doc.clinic.name}` : undefined,
            })),
        [availableDoctors]
    );

    const tabOptions = useMemo(
        () => [
            {
                value: 'new' as const,
                label: 'طبيب جديد بالمنظومة',
                icon: <Plus className="w-3.5 h-3.5" />,
            },
            {
                value: 'existing' as const,
                label: `تعيين طبيب مسجل مسبقاً (${availableDoctors.length})`,
                icon: <Building2 className="w-3.5 h-3.5" />,
            },
        ],
        [availableDoctors.length]
    );

    if (!isOpen) return null;

    const handleCreateDoctor = (e: React.FormEvent) => {
        e.preventDefault();
        newDoctorForm.post('/facility/doctors', {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                newDoctorForm.reset();
            },
        });
    };

    const handleAssignDoctor = (e: React.FormEvent) => {
        e.preventDefault();
        assignDoctorForm.post('/facility/doctors', {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                assignDoctorForm.reset();
            },
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="إضافة واستدعاء طبيب للمنشأة"
            description={`منشأة ${facility.name} ${facility.branch_name ? `(${facility.branch_name})` : ''}`}
            headerIcon={<Plus className="w-5 h-5" />}
            maxWidth="2xl"
        >
            <div className="space-y-5">
                <ChoicePillGroup
                    value={addTab}
                    onChange={(val) => setAddTab(val)}
                    options={tabOptions}
                    columns={2}
                />

                {addTab === 'new' ? (
                    <form onSubmit={handleCreateDoctor} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormInput
                                label="الاسم الكامل للطبيب"
                                required
                                value={newDoctorForm.data.name}
                                onChange={(e) => newDoctorForm.setData('name', e.target.value)}
                                placeholder="د. أحمد المحمدي"
                                error={newDoctorForm.errors.name}
                            />

                            <FormInput
                                label="اللقب المهني / الدرجة"
                                required
                                value={newDoctorForm.data.title_ar}
                                onChange={(e) => newDoctorForm.setData('title_ar', e.target.value)}
                                placeholder="استشاري / أخصائي أول"
                                error={newDoctorForm.errors.title_ar}
                            />

                            <CustomSelect
                                label="التخصص الطبي"
                                value={newDoctorForm.data.specialty_id}
                                onChange={(val) => newDoctorForm.setData('specialty_id', String(val))}
                                options={specialtyOptions}
                                placeholder="اختر التخصص الطبي..."
                                error={newDoctorForm.errors.specialty_id}
                            />

                            <FormInput
                                label="التخصص الدقيق (اختياري)"
                                value={newDoctorForm.data.subspecialty}
                                onChange={(e) => newDoctorForm.setData('subspecialty', e.target.value)}
                                placeholder="جراحة المفاصل والعمود الفقري"
                            />

                            <FormInput
                                label="البريد الإلكتروني المهني"
                                type="email"
                                required
                                dir="ltr"
                                value={newDoctorForm.data.email}
                                onChange={(e) => newDoctorForm.setData('email', e.target.value)}
                                placeholder="doctor@tebiby.com"
                                error={newDoctorForm.errors.email}
                            />

                            <FormInput
                                label="رقم الجوال"
                                type="tel"
                                dir="ltr"
                                value={newDoctorForm.data.phone}
                                onChange={(e) => newDoctorForm.setData('phone', e.target.value)}
                                placeholder="05XXXXXXXX"
                            />

                            <FormInput
                                label="كلمة المرور للحساب"
                                type="password"
                                required
                                dir="ltr"
                                value={newDoctorForm.data.password}
                                onChange={(e) => newDoctorForm.setData('password', e.target.value)}
                                placeholder="••••••••"
                                error={newDoctorForm.errors.password}
                            />

                            <FormInput
                                label="رقم ترخيص الهيئة (SCFHS)"
                                dir="ltr"
                                value={newDoctorForm.data.license_no}
                                onChange={(e) => newDoctorForm.setData('license_no', e.target.value)}
                                placeholder="SCFHS-123456"
                            />

                            <FormInput
                                label="سعر الكشف بالمنشأة (ر.س)"
                                type="number"
                                required
                                min="0"
                                step="5"
                                value={newDoctorForm.data.consultation_fee}
                                onChange={(e) =>
                                    newDoctorForm.setData('consultation_fee', Number(e.target.value))
                                }
                                error={newDoctorForm.errors.consultation_fee}
                            />

                            <FormInput
                                label="مدة الكشف / الانتظار (دقيقة)"
                                type="number"
                                min="5"
                                max="120"
                                value={newDoctorForm.data.waiting_time_minutes}
                                onChange={(e) =>
                                    newDoctorForm.setData('waiting_time_minutes', Number(e.target.value))
                                }
                            />

                            <FormInput
                                label="سنوات الخبرة الإكلينيكية"
                                type="number"
                                min="0"
                                max="50"
                                value={newDoctorForm.data.experience_years}
                                onChange={(e) =>
                                    newDoctorForm.setData('experience_years', Number(e.target.value))
                                }
                            />

                            <div className="flex items-center gap-2 pt-6">
                                <input
                                    type="checkbox"
                                    id="new_accepts_insurance"
                                    checked={newDoctorForm.data.accepts_insurance}
                                    onChange={(e) =>
                                        newDoctorForm.setData('accepts_insurance', e.target.checked)
                                    }
                                    className="w-4 h-4 text-[#005ab5] rounded border-slate-300 focus:ring-[#005ab5]"
                                />
                                <label
                                    htmlFor="new_accepts_insurance"
                                    className="text-xs font-bold text-slate-700 cursor-pointer font-['Cairo']"
                                >
                                    يقبل التأمين الطبي المعتمد بالمنشأة
                                </label>
                            </div>
                        </div>

                        <ModalFooter
                            onCancel={onClose}
                            loading={newDoctorForm.processing}
                            loadingText="جارٍ الحفظ والاعتماد..."
                            submitText="حفظ وإضافة الطبيب"
                        />
                    </form>
                ) : (
                    <form onSubmit={handleAssignDoctor} className="space-y-4">
                        {availableDoctors.length === 0 ? (
                            <EmptyStateCard
                                icon={<AlertCircle className="w-6 h-6 text-amber-600" />}
                                title="جميع الأطباء المسجلين معينون في هذه المنشأة بالفعل"
                                description="يمكنك إضافة طبيب جديد بالمنظومة من خلال التبويب الآخر أعلاه."
                            />
                        ) : (
                            <div className="space-y-4">
                                <CustomSelect
                                    label={`اختر الطبيب المراد تعيينه في ${facility.name}`}
                                    value={assignDoctorForm.data.doctor_profile_id}
                                    onChange={(val) =>
                                        assignDoctorForm.setData('doctor_profile_id', String(val))
                                    }
                                    options={availableDoctorOptions}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormInput
                                        label="سعر الكشف المحدد لهذه المنشأة (ر.س)"
                                        type="number"
                                        required
                                        min="0"
                                        step="5"
                                        value={assignDoctorForm.data.consultation_fee}
                                        onChange={(e) =>
                                            assignDoctorForm.setData(
                                                'consultation_fee',
                                                Number(e.target.value)
                                            )
                                        }
                                    />

                                    <FormInput
                                        label="مدة الكشف (دقيقة)"
                                        type="number"
                                        min="5"
                                        max="120"
                                        value={assignDoctorForm.data.waiting_time_minutes}
                                        onChange={(e) =>
                                            assignDoctorForm.setData(
                                                'waiting_time_minutes',
                                                Number(e.target.value)
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="assign_accepts_insurance"
                                        checked={assignDoctorForm.data.accepts_insurance}
                                        onChange={(e) =>
                                            assignDoctorForm.setData(
                                                'accepts_insurance',
                                                e.target.checked
                                            )
                                        }
                                        className="w-4 h-4 text-[#005ab5] rounded border-slate-300 focus:ring-[#005ab5]"
                                    />
                                    <label
                                        htmlFor="assign_accepts_insurance"
                                        className="text-xs font-bold text-slate-700 cursor-pointer font-['Cairo']"
                                    >
                                        يقبل التأمين الطبي المعتمد في هذا الفرع
                                    </label>
                                </div>

                                <ModalFooter
                                    onCancel={onClose}
                                    loading={assignDoctorForm.processing}
                                    loadingText="جارٍ التعيين..."
                                    submitText="تعيين الطبيب بالمنشأة"
                                />
                            </div>
                        )}
                    </form>
                )}
            </div>
        </Modal>
    );
});
AddFacilityDoctorModal.displayName = 'AddFacilityDoctorModal';
