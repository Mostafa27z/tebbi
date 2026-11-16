import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Modal,
    FormInput,
    CustomSelect,
    SurfaceCard,
    ModalFooter,
    ChoicePillGroup,
} from '@/components/common';
import { Group, Clinic, UserSimple } from '../types';

interface RoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    groups: Group[];
    clinics: Clinic[];
    allUsers: UserSimple[];
    defaultRole?: 'group_admin' | 'facility_admin' | 'receptionist';
    defaultScopeType?: 'group' | 'facility';
    defaultScopeId?: number;
}

const USER_MODE_OPTIONS = [
    { value: 'new' as const, label: '+ إنشاء مستخدم جديد' },
    { value: 'existing' as const, label: 'اختيار مستخدم مسجل مسبقاً' },
];

export const RoleModal: React.FC<RoleModalProps> = React.memo(({
    isOpen,
    onClose,
    groups,
    clinics,
    allUsers,
    defaultRole = 'group_admin',
    defaultScopeType = 'group',
    defaultScopeId,
}) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        role: defaultRole,
        scope_type: defaultScopeType,
        scope_id: (defaultScopeId || groups[0]?.id || 0) as number,
        user_mode: 'new' as 'existing' | 'new',
        user_id: (allUsers[0]?.id || '') as string | number,
        new_name: '',
        new_email: '',
        new_password: '',
        new_phone: '',
    });

    useEffect(() => {
        if (isOpen) {
            setData((prev) => ({
                ...prev,
                role: defaultRole,
                scope_type: defaultScopeType,
                scope_id:
                    defaultScopeId ||
                    (defaultScopeType === 'group' ? groups[0]?.id || 0 : clinics[0]?.id || 0),
            }));
        }
    }, [isOpen, defaultRole, defaultScopeType, defaultScopeId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/role-assignments', {
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    const roleOptions = [
        { value: 'group_admin', label: 'مدير مجمع طبي', sublabel: 'صلاحية كاملة على مجمع وكافة فروعه' },
        { value: 'facility_admin', label: 'مدير مستشفى / عيادة', sublabel: 'إدارة تشغيلية لفرع محدد' },
        { value: 'receptionist', label: 'موظف استقبال', sublabel: 'إدارة التذاكر والحضور' },
    ];

    const scopeOptions =
        data.scope_type === 'group'
            ? groups.map((g) => ({
                  value: g.id,
                  label: g.name_ar,
                  sublabel: g.cr_number ? `سجل: ${g.cr_number}` : undefined,
              }))
            : clinics.map((c) => ({
                  value: c.id,
                  label: c.name,
                  sublabel: `${c.city} - ${c.district || ''}`,
              }));

    const userOptions = allUsers.map((u) => ({
        value: u.id,
        label: u.name,
        sublabel: u.email,
    }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="تعيين مشرف أو موظف استقبال"
            description="منح صلاحية إدارة مجمع، منشأة أو موظف استقبال"
            maxWidth="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <CustomSelect
                        label="نوع الصلاحية"
                        value={data.role}
                        onChange={(val) => {
                            const newRole = val as 'group_admin' | 'facility_admin' | 'receptionist';
                            setData((prev) => ({
                                ...prev,
                                role: newRole,
                                scope_type: newRole === 'group_admin' ? 'group' : 'facility',
                                scope_id:
                                    newRole === 'group_admin'
                                        ? groups[0]?.id || 0
                                        : clinics[0]?.id || 0,
                            }));
                        }}
                        options={roleOptions}
                        error={errors.role}
                    />

                    <CustomSelect
                        label={data.scope_type === 'group' ? 'المجمع المستهدف' : 'المنشأة المستهدفة'}
                        value={data.scope_id}
                        onChange={(val) => setData('scope_id', Number(val))}
                        options={scopeOptions}
                        error={errors.scope_id}
                    />
                </div>

                <ChoicePillGroup
                    label="المستخدم المطلوب تعيينه:"
                    value={data.user_mode}
                    onChange={(val) => setData('user_mode', val)}
                    options={USER_MODE_OPTIONS}
                    columns={2}
                />

                {data.user_mode === 'existing' ? (
                    <CustomSelect
                        label="اختر المستخدم من القائمة"
                        value={data.user_id}
                        onChange={(val) => setData('user_id', val)}
                        options={userOptions}
                        error={errors.user_id}
                        placeholder="ابحث أو اختر المستخدم..."
                    />
                ) : (
                    <SurfaceCard variant="muted" padding="sm" rounded="3xl" className="space-y-3.5">
                        <FormInput
                            label="اسم المستخدم"
                            required
                            placeholder="سلمان الرشيد"
                            value={data.new_name}
                            onChange={(e) => setData('new_name', e.target.value)}
                            error={errors.new_name}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <FormInput
                                label="البريد الإلكتروني"
                                type="email"
                                required
                                placeholder="user@tebiby.com"
                                value={data.new_email}
                                onChange={(e) => setData('new_email', e.target.value)}
                                error={errors.new_email}
                                dir="ltr"
                            />
                            <FormInput
                                label="كلمة المرور"
                                type="password"
                                required
                                placeholder="••••••••"
                                value={data.new_password}
                                onChange={(e) => setData('new_password', e.target.value)}
                                error={errors.new_password}
                                dir="ltr"
                            />
                        </div>
                    </SurfaceCard>
                )}

                <ModalFooter
                    onCancel={onClose}
                    loading={processing}
                    submitText="تأكيد التعيين والصلاحية"
                />
            </form>
        </Modal>
    );
});
RoleModal.displayName = 'RoleModal';
