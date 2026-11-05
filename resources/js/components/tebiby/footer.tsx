import React from 'react';
import { Link } from '@inertiajs/react';

export default function TebibyFooter() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-20 pt-12 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#005ab5] flex items-center justify-center text-white">
                                <span className="material-symbols-outlined text-[24px]">health_and_safety</span>
                            </div>
                            <span className="font-extrabold text-2xl text-[#005ab5] font-['Cairo']">طبيبي</span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            المنصة الصحية الأولى لحجز المواعيد الطبية الذكية وتتبع دور الانتظار المباشر بدقة بالغة داخل كبرى المستشفيات والمراكز المتخصصة.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 text-sm mb-4 font-['Cairo']">روابط المنصة</h4>
                        <ul className="space-y-2.5 text-sm text-gray-600">
                            <li><Link href="/" className="hover:text-[#005ab5]">الرئيسية وحجز طبيب</Link></li>
                            <li><Link href="/queue/TB-92841" className="hover:text-[#005ab5]">تتبع الدور المباشر</Link></li>
                            <li><Link href="/patient/portal" className="hover:text-[#005ab5]">بوابة المريض والملف الطبي</Link></li>
                            <li><Link href="/doctor/dashboard" className="hover:text-[#005ab5]">بوابة الأطباء والعيادات</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 text-sm mb-4 font-['Cairo']">التخصصات الشائعة</h4>
                        <ul className="space-y-2.5 text-sm text-gray-600">
                            <li><Link href="/?specialty_id=1" className="hover:text-[#005ab5]">طب وجراحة الأسنان</Link></li>
                            <li><Link href="/?specialty_id=2" className="hover:text-[#005ab5]">الجلدية والتجميل والليزر</Link></li>
                            <li><Link href="/?specialty_id=3" className="hover:text-[#005ab5]">الأطفال وحديثي الولادة</Link></li>
                            <li><Link href="/?specialty_id=4" className="hover:text-[#005ab5]">الباطنة والجهاز الهضمي</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 text-sm mb-4 font-['Cairo']">الاعتمادات والتأمين</h4>
                        <p className="text-xs text-gray-500 mb-3">ربط مباشر مع كبرى شركات التأمين والامتثال لمعايير وزارة الصحة السعودية ومجلس الضمان الصحي.</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2.5 py-1 rounded-md">بوبا العربية</span>
                            <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2.5 py-1 rounded-md">التعاونية</span>
                            <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2.5 py-1 rounded-md">ميدغلف</span>
                            <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2.5 py-1 rounded-md">تكافل الراجحي</span>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
                    <p>© 2026 منصة طبيبي للرعاية الصحية (Tebiby). جميع الحقوق محفوظة.</p>
                    <div className="flex items-center gap-6">
                        <Link href="/admin/analytics" className="text-gray-500 hover:text-[#005ab5]">لوحة القيادة المركزية</Link>
                        <span>سياسة الخصوصية</span>
                        <span>شروط الاستخدام</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

