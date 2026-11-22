import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { FacilityDashboardLayout } from '@/layouts/facility-dashboard-layout';
import { ApiDocsContent } from '@/components/common/api-docs-content';
import { KeyRound, ArrowRight } from 'lucide-react';

interface Props {
    facility: {
        id: number;
        name: string;
        name_ar?: string;
        branch_name?: string;
    };
    metrics?: any;
    counts?: any;
}

export default function FacilityApiDocsPage({ facility, metrics, counts }: Props) {
    const facilityName = facility.name_ar || facility.name || 'المنشأة الطبية';

    return (
        <FacilityDashboardLayout
            activeTab="api-docs"
            facilityName={facilityName}
            branchName={facility.branch_name}
            counts={counts}
        >
            <Head title="دليل ومواصفات الربط البرمجي (API Documentation) - طبيبي" />

            <div className="space-y-6">
                {/* Header CTA */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#005ab5] flex items-center justify-center shrink-0">
                            <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold font-['Cairo'] text-slate-900">
                                إدارة وتوليد مفاتيح الربط المباشرة لمستشفى / عيادة: {facilityName}
                            </div>
                            <div className="text-xs text-slate-500">
                                يمكنك توليد مفاتيح الربط البرمجي الحية (Live API Keys) واستخدامها في برامجك
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/facility/api-keys"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#005ab5] text-white hover:bg-blue-700 transition-colors shadow-xs"
                    >
                        <span>لوحة مفاتيح الربط (API Keys)</span>
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </Link>
                </div>

                {/* Documentation Body */}
                <ApiDocsContent />
            </div>
        </FacilityDashboardLayout>
    );
}
