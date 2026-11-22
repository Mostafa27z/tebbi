import React, { useState, useMemo, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import BookingModal from '@/components/tebiby/booking-modal';
import toast from 'react-hot-toast';
import { Hospital, Stethoscope, Users, X } from 'lucide-react';
import { SectionHeader, EmptyStateCard, AppButton } from '@/components/common';
import {
    FacilityItem,
    SpecialtyItem,
    DoctorItem,
    GroupLandingInfo,
    GroupLandingStats,
    GroupLandingHero,
    GroupLandingFilters,
    GroupSpecialtiesSection,
    GroupDoctorCard,
    GroupFacilityCard,
    GroupQrModal,
} from '@/components/group/landing';

interface GroupLandingProps {
    group: GroupLandingInfo;
    facilities: FacilityItem[];
    doctors: DoctorItem[];
    specialties: SpecialtyItem[];
    stats: GroupLandingStats;
}

export default function GroupPublicLanding({
    group,
    facilities = [],
    doctors = [],
    specialties = [],
    stats,
}: GroupLandingProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState<'all' | number>('all');
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<'all' | number>('all');
    const [todayOnly, setTodayOnly] = useState(false);
    const [insuranceOnly, setInsuranceOnly] = useState(false);
    const [activeSectionTab, setActiveSectionTab] = useState<'all' | 'doctors' | 'facilities' | 'specialties'>('all');

    const [bookingDoctor, setBookingDoctor] = useState<any | null>(null);
    const [preferredSlot, setPreferredSlot] = useState<string | null>(null);
    const [initialServiceId, setInitialServiceId] = useState<number | null>(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    const selectedSpecialtyObj = useMemo(
        () => specialties.find((s) => s.id === selectedSpecialtyId) || null,
        [specialties, selectedSpecialtyId]
    );

    const filteredDoctors = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return doctors.filter((doc) => {
            const matchesSearch =
                !q ||
                doc.user.name.toLowerCase().includes(q) ||
                doc.title_ar.toLowerCase().includes(q) ||
                (doc.subspecialty && doc.subspecialty.toLowerCase().includes(q)) ||
                (doc.specialty && doc.specialty.name_ar.toLowerCase().includes(q)) ||
                (doc.clinic && doc.clinic.name.toLowerCase().includes(q)) ||
                (doc.active_services && doc.active_services.some((s) => s.name.toLowerCase().includes(q)));

            const matchesBranch =
                selectedBranchId === 'all' ||
                doc.clinic?.id === selectedBranchId ||
                (doc.facilities && doc.facilities.some((f) => f.id === selectedBranchId));

            const matchesSpecialty =
                selectedSpecialtyId === 'all' ||
                doc.specialty?.id === selectedSpecialtyId ||
                (selectedSpecialtyObj && doc.specialty?.name_ar === selectedSpecialtyObj.name_ar);

            const matchesToday = !todayOnly || doc.is_available_today;
            const matchesInsurance = !insuranceOnly || doc.accepts_insurance;

            return matchesSearch && matchesBranch && matchesSpecialty && matchesToday && matchesInsurance;
        });
    }, [doctors, searchQuery, selectedBranchId, selectedSpecialtyId, selectedSpecialtyObj, todayOnly, insuranceOnly]);

    const handleOpenBooking = useCallback(
        (doc: DoctorItem, slot?: string, serviceId?: number) => {
            setBookingDoctor({
                id: doc.id,
                title_ar: doc.title_ar,
                consultation_fee: doc.consultation_fee,
                waiting_time_minutes: doc.waiting_time_minutes,
                slot_auto_confirm_limit: doc.slot_auto_confirm_limit,
                slot_waitlist_limit: doc.slot_waitlist_limit,
                active_services: doc.active_services || [],
                user: {
                    name: doc.user.name,
                    avatar: doc.user.avatar || '/images/default-avatar.png',
                },
                clinic: {
                    name: doc.clinic?.name || group.name_ar,
                    district: doc.clinic?.district || '',
                    city: doc.clinic?.city || '',
                },
                specialty: {
                    name_ar: doc.specialty?.name_ar || 'استشاري',
                },
            });
            setPreferredSlot(slot || null);
            setInitialServiceId(serviceId ?? null);
            setIsBookingOpen(true);
        },
        [group.name_ar]
    );

    const copyPublicUrl = useCallback(() => {
        navigator.clipboard.writeText(group.public_url);
        toast.success('تم نسخ الرابط الترويجي للمجمع بنجاح!');
    }, [group.public_url]);

    const shareOnWhatsApp = useCallback(() => {
        const text = `احجز موعدك الطبي الآن في ${group.name_ar} عبر منصة طبيبي:\n${group.public_url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }, [group.name_ar, group.public_url]);

    const resetFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedBranchId('all');
        setSelectedSpecialtyId('all');
        setTodayOnly(false);
        setInsuranceOnly(false);
        setActiveSectionTab('all');
    }, []);

    const handleSelectHospitalSpecialty = useCallback((specId: number, branchId: number) => {
        setSelectedBranchId(branchId);
        setSelectedSpecialtyId(specId);
        const el = document.getElementById('group-doctors-section');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    const hasActiveFilters =
        Boolean(searchQuery) ||
        selectedBranchId !== 'all' ||
        selectedSpecialtyId !== 'all' ||
        todayOnly ||
        insuranceOnly;

    const showDoctorsSection = activeSectionTab === 'all' || activeSectionTab === 'doctors';
    const showFacilitiesSection = activeSectionTab === 'all' || activeSectionTab === 'facilities';
    const showSpecialtiesSection = activeSectionTab === 'all' || activeSectionTab === 'specialties';

    return (
        <div className="min-h-screen bg-slate-50/70 flex flex-col font-['Tajawal']" dir="rtl">
            <Head>
                <title>{`${group.name_ar} - الأطباء والمستشفيات وحجز المواعيد | طبيبي`}</title>
                <meta
                    name="description"
                    content={`استعرض كافة أطباء واستشاريي ومستشفيات ${group.name_ar}. احجز موعدك الطبي فوراً، تعرف على التخصصات، وتابع دورك في الانتظار مباشرة عبر منصة طبيبي.`}
                />
            </Head>

            <TebibyHeader />

            <main className="flex-1 pb-20">
                <GroupLandingHero
                    group={group}
                    stats={stats}
                    onCopyUrl={copyPublicUrl}
                    onShareWhatsApp={shareOnWhatsApp}
                    onOpenQrModal={() => setIsQrModalOpen(true)}
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20 space-y-12">
                    <GroupLandingFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        todayOnly={todayOnly}
                        onToggleToday={() => setTodayOnly((prev) => !prev)}
                        insuranceOnly={insuranceOnly}
                        onToggleInsurance={() => setInsuranceOnly((prev) => !prev)}
                        facilities={facilities}
                        selectedBranchId={selectedBranchId}
                        onSelectBranch={setSelectedBranchId}
                        specialties={specialties}
                        selectedSpecialtyId={selectedSpecialtyId}
                        onSelectSpecialty={setSelectedSpecialtyId}
                        activeSectionTab={activeSectionTab}
                        onChangeSectionTab={setActiveSectionTab}
                        totalDoctorsCount={doctors.length}
                    />

                    {/* 1. Doctors & Consultants Directory */}
                    {showDoctorsSection && (
                        <section id="group-doctors-section" className="space-y-6">
                            <SectionHeader
                                icon={<Users className="w-6 h-6 text-[#005ab5]" />}
                                title={`أطباء واستشاريو ${group.name_ar}`}
                                description="اختر الطبيب المناسب واحجز موعدك فوراً مع إصدار تذكرة الطابور الذكي وتأكيد الحضور المباشر"
                                badge={
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#005ab5] text-xs font-bold font-mono">
                                        {filteredDoctors.length} طبيب
                                    </span>
                                }
                                actions={
                                    hasActiveFilters ? (
                                        <AppButton
                                            size="sm"
                                            variant="danger-soft"
                                            icon={<X className="w-3.5 h-3.5" />}
                                            onClick={resetFilters}
                                        >
                                            إعادة ضبط الفلاتر
                                        </AppButton>
                                    ) : undefined
                                }
                            />

                            {filteredDoctors.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredDoctors.map((doc) => (
                                        <GroupDoctorCard
                                            key={doc.id}
                                            doctor={doc}
                                            groupName={group.name_ar}
                                            groupSlug={group.slug}
                                            onBook={handleOpenBooking}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyStateCard
                                    icon={<Stethoscope className="w-6 h-6 text-[#005ab5]" />}
                                    title="لا يوجد أطباء مطابقون لخيارات التصفية الحالية"
                                    description="جرّب تغيير معايير البحث أو اختيار مستشفى أو تخصص طبي آخر للاطلاع على قائمة الأطباء المتاحين."
                                    actionLabel="إظهار كافة أطباء المجمع"
                                    onAction={resetFilters}
                                />
                            )}
                        </section>
                    )}

                    {/* 2. Hospitals, Clinics & Operational Sectors */}
                    {showFacilitiesSection && facilities.length > 0 && (
                        <section id="group-facilities-section" className="space-y-6">
                            <SectionHeader
                                icon={<Hospital className="w-6 h-6 text-[#005ab5]" />}
                                title={`المستشفيات والقطاعات الطبية التابعة لـ ${group.name_ar}`}
                                description="استعرض المستشفيات والمراكز التخصصية، القطاعات والخدمات التشغيلية المتوفرة بكل مستشفى، والتخصصات المعتمدة بها"
                                badge={
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                                        {facilities.length} منشآت طبية
                                    </span>
                                }
                            />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {facilities.map((fac) => (
                                    <GroupFacilityCard
                                        key={fac.id}
                                        facility={fac}
                                        isSelected={selectedBranchId === fac.id}
                                        onSelectBranch={setSelectedBranchId}
                                        onSelectSpecialty={handleSelectHospitalSpecialty}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 3. Medical Specialties & Clinical Departments */}
                    {showSpecialtiesSection && specialties.length > 0 && (
                        <div id="group-specialties-section">
                            <GroupSpecialtiesSection
                                groupName={group.name_ar}
                                specialties={specialties}
                                selectedSpecialtyId={selectedSpecialtyId}
                                onSelectSpecialty={(id) => {
                                    setSelectedSpecialtyId(id);
                                    if (id !== 'all') {
                                        const el = document.getElementById('group-doctors-section');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            </main>

            {bookingDoctor && (
                <BookingModal
                    doctor={bookingDoctor}
                    selectedSlot={preferredSlot}
                    initialServiceId={initialServiceId}
                    isOpen={isBookingOpen}
                    onClose={() => {
                        setIsBookingOpen(false);
                        setBookingDoctor(null);
                        setPreferredSlot(null);
                        setInitialServiceId(null);
                    }}
                />
            )}

            <GroupQrModal
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                group={group}
                onCopyUrl={copyPublicUrl}
            />

            <TebibyFooter />
        </div>
    );
}
