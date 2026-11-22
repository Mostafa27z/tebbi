import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { AdminDashboardLayout } from '@/layouts/admin-dashboard-layout';
import { ApiDocsContent } from '@/components/common/api-docs-content';
import { KeyRound, ArrowRight } from 'lucide-react';

export default function AdminApiDocsPage() {
    return (
        <AdminDashboardLayout activeTab="api-docs">
            <Head title="المواصفات الفنية للربط البرمجي (Platform API Docs) - الإدارة العامة" />

            <div className="space-y-6">
                {/* Header CTA */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold font-['Cairo'] text-slate-900">
                                إدارة بوابات وشركاء الربط البرمجي (Platform Connect Management)
                            </div>
                            <div className="text-xs text-slate-500">
                                يمكنك بصفتك مشرف المنصة إصدار مفاتيح Live و Sandbox لجميع المستشفيات والشركاء
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/admin/api-integrations"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
                    >
                        <span>لوحة إدارة الربط البرمجي للشركاء</span>
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </Link>
                </div>

                {/* Documentation Body */}
                <ApiDocsContent />
            </div>
        </AdminDashboardLayout>
    );
}
