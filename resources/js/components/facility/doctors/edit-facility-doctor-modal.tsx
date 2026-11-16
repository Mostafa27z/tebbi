import React, { useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import { Edit3 } from 'lucide-react';
import { Modal, FormInput, CustomSelect, ModalFooter } from '@/components/common';
import { FacilityDoctor, FacilitySpecialtyItem } from './types';

interface EditFacilityDoctorModalProps {
    doctor: FacilityDoctor | null;
    onClose: () => void;
    facility: { id: number; name: string };
    allSpecialties: FacilitySpecialtyItem[];
}

export const EditFacilityDoctorModal: React.FC<EditFacilityDoctorModalProps> = React.memo(({
    doctor,
    onClose,
    facility,
    allSpecialties,
}) => {
    const editDoctorForm = useForm({
        facility_id: facility.id,
        name: '',
        email: '',
        phone: '',
        specialty_id: '',
        title_ar: '',
        subspecialty: '',
        consultation_fee: 250,
        waiting_time_minutes: 20,
        experience_years: 5,
        license_no: '',
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

    useEffect(() => {
        if (!doctor) return;
        const fee = doctor.facility_consultation_fee ?? doctor.consultation_fee;
        const duration = doctor.facility_slot_minutes ?? doctor.waiting_time_minutes ?? 20;
        const ins =
            doctor.facility_accepts_insurance !== undefined
                ? doctor.facility_accepts_insurance
                : (doctor.accepts_insurance ?? true);

        editDoctorForm.setData({
            facility_id: facility.id,
            name: doctor.user.name,
            email: doctor.user.email,
            phone: doctor.user.phone || '',
            specialty_id: String(doctor.specialty.id),
            title_ar: doctor.title_ar,
            subspecialty: doctor.subspecialty || '',
            consultation_fee: Number(fee),
            waiting_time_minutes: Number(duration),
            experience_years: doctor.experience_years || 5,
            license_no: doctor.license_no || '',
            accepts_insurance: ins,
        });
    }, [doctor, facility.id]);

    if (!doctor) return null;

    const handleUpdateDoctor = (e: React.FormEvent) => {
        e.preventDefault();
        editDoctorForm.put(`/facility/doctors/${doctor.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Modal
            isOpen={Boolean(doctor)}
            onClose={onClose}
            title="تعديل بيانات الطبيب وتسعيرة المنشأة"
            description={`${doctor.user.name} - ${facility.name}`}
            headerIcon={<Edit3 className="w-5 h-5" />}
            maxWidth="2xl"
        >
            <form onSubmit={handleUpdateDoctor} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                        label="الاسم الكامل"
                        required
                        value={editDoctorForm.data.name}
                        onChange={(e) => editDoctorForm.setData('name', e.target.value)}
                        error={editDoctorForm.errors.name}
                    />

                    <FormInput
                        label="اللقب المهني / الدرجة"
                        required
                        value={editDoctorForm.data.title_ar}
                        onChange={(e) => editDoctorForm.setData('title_ar', e.target.value)}
                        error={editDoctorForm.errors.title_ar}
                    />

                    <CustomSelect
                        label="التخصص الطبي"
                        value={editDoctorForm.data.specialty_id}
                        onChange={(val) => editDoctorForm.setData('specialty_id', String(val))}
                        options={specialtyOptions}
                        error={editDoctorForm.errors.specialty_id}
                    />

                    <FormInput
                        label="التخصص الدقيق"
                        value={editDoctorForm.data.subspecialty}
                        onChange={(e) => editDoctorForm.setData('subspecialty', e.target.value)}
                    />

                    <FormInput
                        label="البريد الإلكتروني المهني"
                        type="email"
                        required
                        dir="ltr"
                        value={editDoctorForm.data.email}
                        onChange={(e) => editDoctorForm.setData('email', e.target.value)}
                        error={editDoctorForm.errors.email}
                    />

                    <FormInput
                        label="رقم الجوال"
                        type="tel"
                        dir="ltr"
                        value={editDoctorForm.data.phone}
                        onChange={(e) => editDoctorForm.setData('phone', e.target.value)}
                    />

                    <FormInput
                        label="سعر الكشف المحدد لهذه المنشأة (ر.س)"
                        type="number"
                        required
                        min="0"
                        step="5"
                        value={editDoctorForm.data.consultation_fee}
                        onChange={(e) =>
                            editDoctorForm.setData('consultation_fee', Number(e.target.value))
                        }
                    />

                    <FormInput
                        label="متوسط مدة الكشف (دقيقة)"
                        type="number"
                        min="5"
                        max="120"
                        value={editDoctorForm.data.waiting_time_minutes}
                        onChange={(e) =>
                            editDoctorForm.setData('waiting_time_minutes', Number(e.target.value))
                        }
                    />

                    <FormInput
                        label="رقم ترخيص الهيئة (SCFHS)"
                        dir="ltr"
                        value={editDoctorForm.data.license_no}
                        onChange={(e) => editDoctorForm.setData('license_no', e.target.value)}
                    />

                    <FormInput
                        label="سنوات الخبرة الإكلينيكية"
                        type="number"
                        min="0"
                        max="50"
                        value={editDoctorForm.data.experience_years}
                        onChange={(e) =>
                            editDoctorForm.setData('experience_years', Number(e.target.value))
                        }
                    />

                    <div className="flex items-center gap-2 pt-6">
                        <input
                            type="checkbox"
                            id="edit_accepts_insurance"
                            checked={editDoctorForm.data.accepts_insurance}
                            onChange={(e) =>
                                editDoctorForm.setData('accepts_insurance', e.target.checked)
                            }
                            className="w-4 h-4 text-[#005ab5] rounded border-slate-300 focus:ring-[#005ab5]"
                        />
                        <label
                            htmlFor="edit_accepts_insurance"
                            className="text-xs font-bold text-slate-700 cursor-pointer font-['Cairo']"
                        >
                            يقبل التأمين الطبي المعتمد بالمنشأة
                        </label>
                    </div>
                </div>

                <ModalFooter
                    onCancel={onClose}
                    loading={editDoctorForm.processing}
                    loadingText="جارٍ حفظ التعديلات..."
                    submitText="تأكيد وحفظ التعديلات"
                />
            </form>
        </Modal>
    );
});
EditFacilityDoctorModal.displayName = 'EditFacilityDoctorModal';
