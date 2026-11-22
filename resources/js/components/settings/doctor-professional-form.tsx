import React, { FormEventHandler } from 'react';
import { useForm } from '@inertiajs/react';
import { Stethoscope, Award, DollarSign, Clock, FileText, Check, Shield, Users } from 'lucide-react';
import { FormInput } from '@/components/common/form-input';
import { FormTextarea } from '@/components/common/form-textarea';
import { LoadingButton } from '@/components/common/loading-button';
import { SurfaceCard } from '@/components/common/surface-card';

interface DoctorProfessionalFormProps {
    doctorProfile?: {
        title_ar?: string | null;
        subspecialty?: string | null;
        bio?: string | null;
        experience_years?: number | null;
        consultation_fee?: number | string | null;
        waiting_time_minutes?: number | null;
        license_no?: string | null;
        slot_auto_confirm_limit?: number | null;
        slot_waitlist_limit?: number | null;
        specialty?: { name_ar: string } | null;
        clinic?: { name: string } | null;
    } | null;
    userName: string;
    onUpdated?: () => void;
}

export const DoctorProfessionalForm: React.FC<DoctorProfessionalFormProps> = React.memo(({
    doctorProfile,
    userName,
    onUpdated,
}) => {
    const { data, setData, patch, processing, errors } = useForm({
        name: userName,
        title_ar: doctorProfile?.title_ar || '',
        subspecialty: doctorProfile?.subspecialty || '',
        experience_years: doctorProfile?.experience_years ? String(doctorProfile.experience_years) : '5',
        consultation_fee: doctorProfile?.consultation_fee ? String(doctorProfile.consultation_fee) : '200',
        waiting_time_minutes: doctorProfile?.waiting_time_minutes ? String(doctorProfile.waiting_time_minutes) : '15',
        license_no: doctorProfile?.license_no || '',
        slot_auto_confirm_limit: doctorProfile?.slot_auto_confirm_limit ? String(doctorProfile.slot_auto_confirm_limit) : '1',
        slot_waitlist_limit: doctorProfile?.slot_waitlist_limit ? String(doctorProfile.slot_waitlist_limit) : '2',
        bio: doctorProfile?.bio || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => {
                onUpdated?.();
            },
        });
    };

    return (
        <SurfaceCard padding="lg" rounded="3xl">
            <form onSubmit={submit} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-2">
                    <div>
                        <h3 className="text-base font-black text-gray-900 font-['Cairo'] flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-[#005ab5]" />
                            <span>الملف المهني والبيانات الطبية (للطبيب)</span>
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                            تحديث التخصص الدقيق، أتعاب الاستشارة، متوسط وقت الكشف، وطاقة الحجز المباشر.
                        </p>
                    </div>

                    {(doctorProfile?.specialty || doctorProfile?.clinic) && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            {doctorProfile.specialty && (
                                <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-[#005ab5] font-bold border border-blue-100">
                                    {doctorProfile.specialty.name_ar}
                                </span>
                            )}
                            {doctorProfile.clinic && (
                                <span className="px-2.5 py-1 rounded-xl bg-gray-50 text-gray-700 font-medium border border-gray-200">
                                    {doctorProfile.clinic.name}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                    {/* Title */}
                    <FormInput
                        id="title_ar"
                        name="title_ar"
                        label="اللقب المهني"
                        value={data.title_ar}
                        onChange={(e) => setData('title_ar', e.target.value)}
                        error={errors.title_ar}
                        placeholder="مثال: استشاري أول أمراض القلب والأوعية"
                        icon={<Award className="w-4 h-4 text-gray-400" />}
                    />

                    {/* Subspecialty */}
                    <FormInput
                        id="subspecialty"
                        name="subspecialty"
                        label="التخصص الدقيق والاهتمامات الطبية"
                        value={data.subspecialty}
                        onChange={(e) => setData('subspecialty', e.target.value)}
                        error={errors.subspecialty}
                        placeholder="مثال: القسطرة التداخلية، صمامات القلب"
                        icon={<Stethoscope className="w-4 h-4 text-gray-400" />}
                    />

                    {/* Consultation Fee */}
                    <FormInput
                        id="consultation_fee"
                        name="consultation_fee"
                        type="number"
                        step="1"
                        min="0"
                        label="سعر الكشف الافتراضي (ر.س)"
                        value={data.consultation_fee}
                        onChange={(e) => setData('consultation_fee', e.target.value)}
                        error={errors.consultation_fee}
                        placeholder="مثال: 250"
                        icon={<DollarSign className="w-4 h-4 text-gray-400" />}
                    />

                    {/* Waiting Time Minutes */}
                    <FormInput
                        id="waiting_time_minutes"
                        name="waiting_time_minutes"
                        type="number"
                        min="5"
                        max="240"
                        label="متوسط مدة الكشف / الاستشارة (بالدقائق)"
                        value={data.waiting_time_minutes}
                        onChange={(e) => setData('waiting_time_minutes', e.target.value)}
                        error={errors.waiting_time_minutes}
                        placeholder="مثال: 15"
                        icon={<Clock className="w-4 h-4 text-gray-400" />}
                    />

                    {/* Experience Years */}
                    <FormInput
                        id="experience_years"
                        name="experience_years"
                        type="number"
                        min="0"
                        max="70"
                        label="سنوات الخبرة العملية"
                        value={data.experience_years}
                        onChange={(e) => setData('experience_years', e.target.value)}
                        error={errors.experience_years}
                        placeholder="مثال: 10"
                        icon={<Award className="w-4 h-4 text-gray-400" />}
                    />

                    {/* License No */}
                    <FormInput
                        id="license_no"
                        name="license_no"
                        label="رقم ترخيص الهيئة الطبية / مزاولة المهنة"
                        value={data.license_no}
                        onChange={(e) => setData('license_no', e.target.value)}
                        error={errors.license_no}
                        placeholder="مثال: 21-R-0987654"
                        icon={<Shield className="w-4 h-4 text-gray-400" />}
                    />

                    {/* Slot Auto Confirm Limit */}
                    <FormInput
                        id="slot_auto_confirm_limit"
                        name="slot_auto_confirm_limit"
                        type="number"
                        min="1"
                        max="50"
                        label="طاقة الحجز الفوري (تأكيد تلقائي لكل فترة زمنية)"
                        helperText="العدد الأقصى للحجوزات التي يتم تأكيدها فورياً في نفس الموعد"
                        value={data.slot_auto_confirm_limit}
                        onChange={(e) => setData('slot_auto_confirm_limit', e.target.value)}
                        error={errors.slot_auto_confirm_limit}
                        icon={<Users className="w-4 h-4 text-gray-400" />}
                    />

                    {/* Slot Waitlist Limit */}
                    <FormInput
                        id="slot_waitlist_limit"
                        name="slot_waitlist_limit"
                        type="number"
                        min="0"
                        max="50"
                        label="طاقة قائمة الانتظار (تأكيد مشروط لكل فترة)"
                        helperText="العدد الأقصى للمرضى الإضافيين في قائمة الانتظار للموعد الواحد"
                        value={data.slot_waitlist_limit}
                        onChange={(e) => setData('slot_waitlist_limit', e.target.value)}
                        error={errors.slot_waitlist_limit}
                        icon={<Clock className="w-4 h-4 text-gray-400" />}
                    />
                </div>

                {/* Bio */}
                <FormTextarea
                    id="bio"
                    name="bio"
                    label="النبذة التعريفية والخبرات المهنية (تظهر للمرضى)"
                    value={data.bio}
                    onChange={(e) => setData('bio', e.target.value)}
                    error={errors.bio}
                    rows={4}
                    placeholder="اكتب نبذة مختصرة عن مؤهلاتك العلمية، شهادات الاختصاص، وخبراتك الإكلينيكية..."
                />

                <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                    <LoadingButton
                        type="submit"
                        variant="primary"
                        size="md"
                        loading={processing}
                        loadingText="جارٍ الحفظ..."
                        icon={<Check className="w-4 h-4" />}
                    >
                        حفظ بيانات الملف الطبي
                    </LoadingButton>
                </div>
            </form>
        </SurfaceCard>
    );
});

DoctorProfessionalForm.displayName = 'DoctorProfessionalForm';
