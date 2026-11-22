import React from 'react';
import Profile from './profile';
import { usePage } from '@inertiajs/react';

interface PasswordPageProps {
    mustVerifyEmail?: boolean;
    status?: string;
}

export default function Password(props: PasswordPageProps) {
    const { auth } = usePage<any>().props;
    const user = auth?.user || {};

    const returnUrl = matchRoleUrl(user);
    const returnLabel = matchRoleLabel(user);

    return (
        <Profile
            profileUser={user}
            doctorProfile={user.doctor_profile}
            returnUrl={returnUrl}
            returnLabel={returnLabel}
            mustVerifyEmail={props.mustVerifyEmail}
            status={props.status}
            initialTab="security"
        />
    );
}

function matchRoleUrl(user: any): string {
    if (user.role === 'admin') return '/admin/analytics';
    if (user.is_group_admin) return '/group/dashboard';
    if (user.is_facility_admin || user.is_receptionist || user.role === 'receptionist') return '/facility/dashboard';
    if (user.role === 'doctor') return '/doctor/dashboard';
    return '/patient/portal';
}

function matchRoleLabel(user: any): string {
    if (user.role === 'admin') return 'لوحة إدارة المنصة';
    if (user.is_group_admin) return 'لوحة إدارة المجمع الطبي';
    if (user.is_facility_admin) return 'لوحة إدارة المنشأة الطبية';
    if (user.is_receptionist || user.role === 'receptionist') return 'لوحة الاستقبال والعيادات';
    if (user.role === 'doctor') return 'لوحة تحكم الطبيب';
    return 'بوابة المريض والملف الطبي';
}
