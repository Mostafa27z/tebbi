import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { FacilityDashboardLayout } from '@/layouts/facility-dashboard-layout';
import { MetricCard } from '@/components/common/metric-card';
import { TableToolbar } from '@/components/common/table-toolbar';
import { Modal } from '@/components/common/modal';
import { FormInput } from '@/components/common/form-input';
import { PasswordInput } from '@/components/common/password-input';
import { LoadingButton } from '@/components/common/loading-button';
import { CustomSelect } from '@/components/common/custom-select';
import { ConfirmDeleteModal } from '@/components/common/confirm-delete-modal';
import { Pagination } from '@/components/common/pagination';
import {
    UserCheck,
    Users,
    UserPlus,
    Edit3,
    Trash2,
    ShieldCheck,
    Hospital,
    Mail,
    Phone,
    IdCard,
    CheckCircle2,
    Clock,
    Lock,
    KeyRound,
    User,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Receptionist {
    id: number; // RoleAssignment ID
    user_id: number;
    name: string;
    email: string;
    phone: string;
    avatar?: string | null;
    national_id?: string | null;
    created_at: string;
    scope_id: number;
    role: string;
}

export interface AvailableUser {
    id: number;
    name: string;
    email: string;
    phone?: string;
}

interface Props {
    facility: {
        id: number;
        name: string;
        branch_name?: string;
        city: string;
        district?: string;
        address?: string;
    };
    facilities?: Array<{ id: number; name: string }>;
    metrics: {
        doctorsCount: number;
        activeDoctorsCount: number;
        specialtiesCount: number;
        totalToday: number;
        waitingCount: number;
        inConsultationCount: number;
        completedCount: number;
        receptionistsCount?: number;
    };
    receptionists: Receptionist[];
    availableUsers?: AvailableUser[];
    canManageFacility?: boolean;
}

export default function FacilityReceptionistsPage({
    facility,
    metrics,
    receptionists = [],
    availableUsers = [],
    canManageFacility = true,
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Add Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addTab, setAddTab] = useState<'new' | 'existing'>('new');

    // Edit Modal State
    const [editModalData, setEditModalData] = useState<Receptionist | null>(null);

    // Delete Modal State
    const [deleteModalData, setDeleteModalData] = useState<Receptionist | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form for creating new receptionist
    const newForm = useForm({
        mode: 'new' as 'new' | 'existing',
        facility_id: facility.id,
        name: '',
        email: '',
        phone: '',
        national_id: '',
        password: '',
    });

    // Form for assigning existing user
    const assignForm = useForm({
        mode: 'existing' as 'new' | 'existing',
        facility_id: facility.id,
        user_id: availableUsers[0]?.id ? String(availableUsers[0].id) : '',
    });

    // Form for editing receptionist
    const editForm = useForm({
        name: '',
        email: '',
        phone: '',
        national_id: '',
        password: '',
    });

    // Filter receptionists
    const filteredReceptionists = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return receptionists;

        return receptionists.filter((item) => {
            return (
                item.name.toLowerCase().includes(query) ||
                item.email.toLowerCase().includes(query) ||
                (item.phone && item.phone.includes(query)) ||
                (item.national_id && item.national_id.includes(query))
            );
        });
    }, [receptionists, searchQuery]);

    // Paginate
    const paginatedReceptionists = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredReceptionists.slice(start, start + pageSize);
    }, [filteredReceptionists, currentPage, pageSize]);

    // Format Arabic date
    const formatDate = (dateString: string) => {
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
    };

    // Open Edit Modal
    const handleOpenEdit = (rec: Receptionist) => {
        setEditModalData(rec);
        editForm.setData({
            name: rec.name,
            email: rec.email,
            phone: rec.phone || '',
            national_id: rec.national_id || '',
            password: '',
        });
        editForm.clearErrors();
    };

    // Submit Create New Receptionist
    const handleCreateNew = (e: React.FormEvent) => {
        e.preventDefault();
        newForm.post('/facility/receptionists', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                newForm.reset();
            },
        });
    };

    // Submit Assign Existing Receptionist
    const handleAssignExisting = (e: React.FormEvent) => {
        e.preventDefault();
        assignForm.post('/facility/receptionists', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                assignForm.reset();
            },
        });
    };

    // Submit Edit Receptionist
    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editModalData) return;

        editForm.put(`/facility/receptionists/${editModalData.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditModalData(null);
                editForm.reset();
            },
        });
    };

    // Confirm Delete Receptionist
    const handleConfirmDelete = () => {
        if (!deleteModalData) return;
        setIsDeleting(true);

        router.delete(`/facility/receptionists/${deleteModalData.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteModalData(null);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <FacilityDashboardLayout
            activeTab="receptionists"
            facilityName={facility.name}
            branchName={facility.branch_name}
            counts={{
                waiting: metrics.waitingCount,
                doctors: metrics.doctorsCount,
                specialties: metrics.specialtiesCount,
                appointments: metrics.totalToday,
                receptionists: receptionists.length,
            }}
        >
            <Head title={`إدارة موظفي الاستقبال - ${facility.name}`} />

            <div className="space-y-6">
                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="إجمالي موظفي الاستقبال"
                        value={receptionists.length}
                        subtitle="كادر خدمة المراجعين والانتظار"
                        icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="الحسابات النشطة"
                        value={receptionists.length}
                        subtitle="مصرح لهم بالدخول للوحة الاستقبال"
                        icon={<CheckCircle2 className="w-5 h-5 text-[#005ab5]" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="المنشأة والفرع الحالي"
                        value={facility.branch_name || 'الفرع الرئيسي'}
                        subtitle={facility.city || 'الرياض'}
                        icon={<Hospital className="w-5 h-5 text-purple-600" />}
                        iconBg="bg-purple-50"
                    />
                    <MetricCard
                        title="صلاحيات الإدارة"
                        value="مدير المنشأة"
                        subtitle="تحكم كامل في موظفي الاستقبال"
                        icon={<ShieldCheck className="w-5 h-5 text-amber-600" />}
                        iconBg="bg-amber-50"
                    />
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-6">
                    {/* Header & Table Toolbar */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 font-['Cairo'] flex items-center gap-2">
                                    <Users className="w-5 h-5 text-[#005ab5]" />
                                    <span>كادر موظفي الاستقبال وتذاكر الانتظار</span>
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    يمكنك إضافة موظف استقبال جديد، تحديث بيانات الدخول، أو سحب الصلاحية عند الحاجة
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    newForm.reset();
                                    assignForm.reset();
                                    setIsAddModalOpen(true);
                                }}
                                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>إضافة موظف استقبال جديد</span>
                            </button>
                        </div>

                        {/* Search Toolbar */}
                        <TableToolbar
                            search={searchQuery}
                            onSearchChange={(val) => {
                                setSearchQuery(val);
                                setCurrentPage(1);
                            }}
                            searchPlaceholder="البحث بالاسم، البريد الإلكتروني، رقم الجوال أو الهوية..."
                        />
                    </div>

                    {/* Table */}
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
                                    {paginatedReceptionists.length > 0 ? (
                                        paginatedReceptionists.map((rec) => (
                                            <tr key={rec.id} className="hover:bg-gray-50/70 transition-colors">
                                                {/* Staff Info */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                                                            {rec.avatar ? (
                                                                <img
                                                                    src={rec.avatar}
                                                                    alt={rec.name}
                                                                    className="w-full h-full object-cover rounded-2xl"
                                                                />
                                                            ) : (
                                                                rec.name ? rec.name[0] : 'م'
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-bold text-gray-900 block truncate font-['Cairo'] text-sm">
                                                                {rec.name}
                                                            </span>
                                                            <span className="text-[11px] text-gray-400 block font-mono truncate" dir="ltr">
                                                                {rec.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Phone */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-1.5 text-gray-700 font-mono font-medium" dir="ltr">
                                                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span>{rec.phone || 'غير مسجل'}</span>
                                                    </div>
                                                </td>

                                                {/* National ID */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-1.5 text-gray-600 font-mono">
                                                        <IdCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span>{rec.national_id || '—'}</span>
                                                    </div>
                                                </td>

                                                {/* Facility */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                                                        <Hospital className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                        <span>{facility.name}</span>
                                                    </div>
                                                </td>

                                                {/* Date Added */}
                                                <td className="py-3.5 px-4 text-gray-500 font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span>{formatDate(rec.created_at)}</span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span>نشط معتمد</span>
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(rec)}
                                                            className="p-2 rounded-xl text-[#005ab5] hover:bg-blue-50 transition-colors cursor-pointer"
                                                            title="تعديل بيانات موظف الاستقبال"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteModalData(rec)}
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
                                                            {searchQuery ? 'لا توجد نتائج مطابقة لبحثك' : 'لا يوجد موظفو استقبال مسجلين حالياً'}
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
                                                            onClick={() => {
                                                                newForm.reset();
                                                                assignForm.reset();
                                                                setIsAddModalOpen(true);
                                                            }}
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

                    {/* Pagination */}
                    {filteredReceptionists.length > pageSize && (
                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredReceptionists.length}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>
            </div>

            {/* Modal 1: Add Receptionist Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="إضافة موظف استقبال للمنشأة"
                description={`تعيين حساب بصلاحية موظف استقبال في: ${facility.name}`}
                maxWidth="lg"
            >
                <div className="space-y-5">
                    {/* Mode Toggle Tabs */}
                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setAddTab('new')}
                            className={cn(
                                'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer',
                                addTab === 'new'
                                    ? 'bg-white text-emerald-700 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            )}
                        >
                            إنشاء حساب موظف جديد
                        </button>
                        <button
                            type="button"
                            onClick={() => setAddTab('existing')}
                            className={cn(
                                'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer',
                                addTab === 'existing'
                                    ? 'bg-white text-emerald-700 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            )}
                        >
                            تعيين مستخدم مسجل مسبقاً
                        </button>
                    </div>

                    {/* Mode 1: Create New Receptionist Form */}
                    {addTab === 'new' ? (
                        <form onSubmit={handleCreateNew} className="space-y-4">
                            <FormInput
                                label="اسم الموظف بالكامل"
                                required
                                placeholder="مثال: عبدالله محمد الشهري"
                                value={newForm.data.name}
                                onChange={(e) => newForm.setData('name', e.target.value)}
                                error={newForm.errors.name}
                                icon={<User className="w-4 h-4" />}
                            />

                            <FormInput
                                label="البريد الإلكتروني لتسجيل الدخول"
                                type="email"
                                required
                                dir="ltr"
                                placeholder="reception.staff@tebiby.com"
                                value={newForm.data.email}
                                onChange={(e) => newForm.setData('email', e.target.value)}
                                error={newForm.errors.email}
                                icon={<Mail className="w-4 h-4" />}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormInput
                                    label="رقم الجوال"
                                    placeholder="0501234567"
                                    dir="ltr"
                                    value={newForm.data.phone}
                                    onChange={(e) => newForm.setData('phone', e.target.value)}
                                    error={newForm.errors.phone}
                                    icon={<Phone className="w-4 h-4" />}
                                />

                                <FormInput
                                    label="رقم الهوية الوطنية (اختياري)"
                                    placeholder="10XXXXXXXX"
                                    dir="ltr"
                                    value={newForm.data.national_id}
                                    onChange={(e) => newForm.setData('national_id', e.target.value)}
                                    error={newForm.errors.national_id}
                                    icon={<IdCard className="w-4 h-4" />}
                                />
                            </div>

                            <PasswordInput
                                label="كلمة المرور"
                                required
                                placeholder="6 أحرف أو أرقام على الأقل"
                                value={newForm.data.password}
                                onChange={(e) => newForm.setData('password', e.target.value)}
                                error={newForm.errors.password}
                            />

                            {/* Info Banner */}
                            <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-100 flex items-start gap-2.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-emerald-800 leading-relaxed font-medium">
                                    سيتم منح الحساب صلاحية موظف استقبال رسمية خاصة بمنشأة ({facility.name}) لتمكينه من قطع التذاكر وإدارة حركة صالة الانتظار.
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                                >
                                    إلغاء
                                </button>
                                <LoadingButton
                                    type="submit"
                                    loading={newForm.processing}
                                    variant="emerald"
                                    className="font-['Cairo']"
                                >
                                    حفظ وتعيين الموظف
                                </LoadingButton>
                            </div>
                        </form>
                    ) : (
                        /* Mode 2: Assign Existing User */
                        <form onSubmit={handleAssignExisting} className="space-y-4">
                            {availableUsers.length > 0 ? (
                                <CustomSelect
                                    label="اختر المستخدم المسجل بالنظام"
                                    value={assignForm.data.user_id}
                                    onChange={(val) => assignForm.setData('user_id', String(val))}
                                    options={availableUsers.map((u) => ({
                                        value: u.id,
                                        label: `${u.name} (${u.email})`,
                                    }))}
                                    error={assignForm.errors.user_id}
                                />
                            ) : (
                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                                    <span>لا يوجد مستخدمون إضافيون متاحون للتعيين حالياً. يرجى اختيار تبويب "إنشاء حساب موظف جديد".</span>
                                </div>
                            )}

                            {/* Info Banner */}
                            <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-start gap-2.5">
                                <Hospital className="w-4 h-4 text-[#005ab5] shrink-0 mt-0.5" />
                                <div className="text-xs text-blue-800 leading-relaxed font-medium">
                                    سيتم إسناد دور موظف الاستقبال لهذا المستخدم في منشأة ({facility.name}) دون التأثير على بياناته الشخصية.
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                                >
                                    إلغاء
                                </button>
                                <LoadingButton
                                    type="submit"
                                    loading={assignForm.processing}
                                    disabled={availableUsers.length === 0}
                                    variant="primary"
                                    className="font-['Cairo']"
                                >
                                    إسناد الصلاحية للمستخدم
                                </LoadingButton>
                            </div>
                        </form>
                    )}
                </div>
            </Modal>

            {/* Modal 2: Edit Receptionist Modal */}
            <Modal
                isOpen={Boolean(editModalData)}
                onClose={() => setEditModalData(null)}
                title="تعديل بيانات موظف الاستقبال"
                description={`تحديث بيانات حساب (${editModalData?.name || ''})`}
                maxWidth="lg"
            >
                {editModalData && (
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <FormInput
                            label="اسم الموظف بالكامل"
                            required
                            placeholder="الاسم الثلاثي"
                            value={editForm.data.name}
                            onChange={(e) => editForm.setData('name', e.target.value)}
                            error={editForm.errors.name}
                            icon={<User className="w-4 h-4" />}
                        />

                        <FormInput
                            label="البريد الإلكتروني للولوج"
                            type="email"
                            required
                            dir="ltr"
                            value={editForm.data.email}
                            onChange={(e) => editForm.setData('email', e.target.value)}
                            error={editForm.errors.email}
                            icon={<Mail className="w-4 h-4" />}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormInput
                                label="رقم الجوال"
                                placeholder="0501234567"
                                dir="ltr"
                                value={editForm.data.phone}
                                onChange={(e) => editForm.setData('phone', e.target.value)}
                                error={editForm.errors.phone}
                                icon={<Phone className="w-4 h-4" />}
                            />

                            <FormInput
                                label="رقم الهوية الوطنية"
                                placeholder="10XXXXXXXX"
                                dir="ltr"
                                value={editForm.data.national_id}
                                onChange={(e) => editForm.setData('national_id', e.target.value)}
                                error={editForm.errors.national_id}
                                icon={<IdCard className="w-4 h-4" />}
                            />
                        </div>

                        <PasswordInput
                            label="كلمة مرور جديدة (اختياري)"
                            placeholder="اترك هذا الحقل فارغاً للإبقاء على كلمة المرور الحالية"
                            helperText="اترك الحقل فارغاً إذا كنت لا ترغب بتغيير كلمة مرور الموظف."
                            value={editForm.data.password}
                            onChange={(e) => editForm.setData('password', e.target.value)}
                            error={editForm.errors.password}
                        />

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2.5 pt-3">
                            <button
                                type="button"
                                onClick={() => setEditModalData(null)}
                                className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                            >
                                إلغاء
                            </button>
                            <LoadingButton
                                type="submit"
                                loading={editForm.processing}
                                variant="emerald"
                                className="font-['Cairo']"
                            >
                                حفظ التعديلات
                            </LoadingButton>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal 3: Confirm Delete Modal */}
            <ConfirmDeleteModal
                isOpen={Boolean(deleteModalData)}
                onClose={() => setDeleteModalData(null)}
                onConfirm={handleConfirmDelete}
                loading={isDeleting}
                title="إلغاء تعيين موظف الاستقبال"
                message={
                    <span>
                        هل أنت متأكد من رغبتك في إلغاء تعيين موظف الاستقبال{' '}
                        <strong className="text-gray-900 font-bold font-['Cairo']">
                            ({deleteModalData?.name})
                        </strong>{' '}
                        من منشأة{' '}
                        <strong className="text-gray-900 font-bold">
                            {facility.name}
                        </strong>
                        ؟ سيتم سحب صلاحيات الدخول إلى لوحة الاستقبال فوراً.
                    </span>
                }
                confirmText="نعم، إلغاء التعيين"
                cancelText="تراجع"
            />
        </FacilityDashboardLayout>
    );
}

