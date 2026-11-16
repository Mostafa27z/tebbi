import React, { useState, useMemo, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Home } from 'lucide-react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import {
    SpecialtyItem,
    SpecialtyFilterCategory,
    SpecialtiesHero,
    SpecialtiesFilterBar,
    SpecialtyCard,
    SpecialtiesEmptyState,
} from '@/components/specialties';

interface Props {
    specialties: SpecialtyItem[];
    totalDoctors: number;
    totalFacilities: number;
}

export default function SpecialtiesPage({ specialties, totalDoctors, totalFacilities }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<SpecialtyFilterCategory>('all');

    const activeDoctorsSpecCount = useMemo(
        () => specialties.filter((s) => s.doctors_count > 0).length,
        [specialties]
    );

    const topDemandSpecCount = useMemo(
        () => specialties.filter((s) => s.doctors_count >= 2 || Boolean(s.badge_text)).length,
        [specialties]
    );

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        return specialties.filter((s) => {
            const matchesSearch =
                !q ||
                s.name_ar.toLowerCase().includes(q) ||
                (s.name_en && s.name_en.toLowerCase().includes(q)) ||
                (s.description && s.description.toLowerCase().includes(q)) ||
                (s.badge_text && s.badge_text.toLowerCase().includes(q));

            const matchesCategory =
                selectedCategory === 'all' ||
                (selectedCategory === 'active_doctors' && s.doctors_count > 0) ||
                (selectedCategory === 'top_demand' && (s.doctors_count >= 2 || Boolean(s.badge_text)));

            return matchesSearch && matchesCategory;
        });
    }, [specialties, searchQuery, selectedCategory]);

    const handleResetFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedCategory('all');
    }, []);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title="طبيبي - كافة الأقسام والتخصصات الطبية المعتمدة" />
            <TebibyHeader />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6 font-medium">
                    <Link href="/" className="hover:text-[#005ab5] flex items-center gap-1 transition-colors">
                        <Home className="w-3.5 h-3.5" />
                        <span>الرئيسية</span>
                    </Link>
                    <span>/</span>
                    <span className="text-gray-700 font-bold">كافة الأقسام والعيادات التخصصية</span>
                </nav>

                <SpecialtiesHero
                    specialtiesCount={specialties.length}
                    totalDoctors={totalDoctors}
                    totalFacilities={totalFacilities}
                />

                <SpecialtiesFilterBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    totalCount={specialties.length}
                    activeDoctorsSpecCount={activeDoctorsSpecCount}
                    topDemandSpecCount={topDemandSpecCount}
                />

                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {filtered.map((spec) => (
                            <SpecialtyCard key={spec.id} specialty={spec} />
                        ))}
                    </div>
                ) : (
                    <SpecialtiesEmptyState onReset={handleResetFilters} />
                )}
            </main>

            <TebibyFooter />
        </div>
    );
}
