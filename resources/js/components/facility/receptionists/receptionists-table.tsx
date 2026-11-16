import React from 'react';
import {
    Phone,
    IdCard,
    Hospital,
    Calendar,
    Edit3,
    Trash2,
    UserCheck,
    UserPlus,
} from 'lucide-react';
import { ReceptionistItem } from './types';

function formatReceptionDate(dateString: string): string {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    } catch {
        return dateString;
    }
}

interface ReceptionistsTableProps {
    receptionists: ReceptionistItem[];
    facilityName: string;
    searchQuery: string;
    onEdit: (rec: ReceptionistItem) => void;
    onDelete: (rec: ReceptionistItem) => void;
    onOpenAdd: () => void;
}

export const ReceptionistsTable: React.FC<ReceptionistsTableProps> = React.memo(({
    receptionists,
    facilityName,
    searchQuery,
    onEdit,
    onDelete,
    onOpenAdd,
}) => {
    return (
        <div className="rounded-2xl border border-gray-200/80 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                    <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                        <tr>
                            <th className="py-3.5 px-4">موظف الاستقبال</th>
                            <th className="py-3.5 px-4">رقم الجوال</th>
                            <th className="py-3.5 px-4">الهوية الوطنية</th>
                            <th className="py-3.5 px-4">المنشأة المعين بها</th>
                            <th className="py-3.5 px-4">تاريخ التعيين</th>
                            <th className="py-3.5 px-4 text-center">الحالة</th>
                            <th className="py-3.5 px-4 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {receptionists.length > 0 ? (
                            receptionists.map((rec) => (
                                <tr key={rec.id} className="hover:bg-gray-50/70 transition-colors">
                                    <td className="py-3.5 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                                                {rec.avatar ? (
                                                    <img
                                                        src={rec.avatar}
                                                        alt={rec.name}
                                                        className="w-full h-full object-cover rounded-2xl"
                                                    />
                                                ) : rec.name ? (
                                                    rec.name[0]
                                                ) : (
                                                    'م'
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="font-bold text-gray-900 block truncate font-['Cairo'] text-sm">
                                                    {rec.name}
                                                </span>
                                                <span
                                                    className="text-[11px] text-gray-400 block font-mono truncate"
                                                    dir="ltr"
                                                >
                                                    {rec.email}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-3.5 px-4">
                                        <div
                                            className="flex items-center gap-1.5 text-gray-700 font-mono font-medium"
                                            dir="ltr"
                                        >
                                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span>{rec.phone || 'غير مسجل'}</span>
                                        </div>
                                    </td>

                                    <td className="py-3.5 px-4">
                                        <div className="flex items-center gap-1.5 text-gray-600 font-mono">
                                            <IdCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span>{rec.national_id || '—'}</span>
                                        </div>
                                    </td>

                                    <td className="py-3.5 px-4">
                                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                                            <Hospital className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            <span>{facilityName}</span>
                                        </div>
                                    </td>

                                    <td className="py-3.5 px-4 text-gray-500 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span>{formatReceptionDate(rec.created_at)}</span>
                                        </div>
                                    </td>

                                    <td className="py-3.5 px-4 text-center">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span>نشط معتمد</span>
                                        </span>
                                    </td>

                                    <td className="py-3.5 px-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onEdit(rec)}
                                                className="p-2 rounded-xl text-[#005ab5] hover:bg-blue-50 transition-colors cursor-pointer"
                                                title="تعديل بيانات موظف الاستقبال"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => onDelete(rec)}
                                                className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                title="إلغاء التعيين وسحب الصلاحية"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="w-16 h-16 rounded-3xl bg-gray-50 text-gray-300 flex items-center justify-center">
                                            <UserCheck className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-700 font-['Cairo'] text-sm">
                                                {searchQuery
                                                    ? 'لا توجد نتائج مطابقة لبحثك'
                                                    : 'لا يوجد موظفو استقبال مسجلين حالياً'}
                                            </h4>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {searchQuery
                                                    ? 'جرب البحث بكلمات أخرى أو امسح شريط البحث'
                                                    : 'يمكنك البدء بإضافة موظفي الاستقبال لتمكينهم من إدارة طابور المراجعين والتذاكر'}
                                            </p>
                                        </div>
                                        {!searchQuery && (
                                            <button
                                                type="button"
                                                onClick={onOpenAdd}
                                                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                                <span>إضافة أول موظف استقبال</span>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
});
ReceptionistsTable.displayName = 'ReceptionistsTable';
