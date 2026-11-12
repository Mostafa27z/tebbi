export interface Group {
    id: number;
    name_ar: string;
    name_en?: string;
    slug: string;
    cr_number?: string;
    status: string;
    facilities_count?: number;
    admins?: Array<{ id: number; name: string; email: string; phone?: string }>;
    facilities?: Array<{ id: number; name: string; type: string; doctor_profiles_count?: number }>;
}

export interface Clinic {
    id: number;
    group_id?: number;
    name: string;
    branch_name: string;
    type?: 'hospital' | 'clinic';
    moh_license_no?: string;
    city: string;
    district: string;
    address: string;
    phone: string;
    is_active: boolean;
    is_verified: boolean;
    doctor_profiles_count?: number;
    group?: { id: number; name_ar: string };
    admins?: Array<{ id: number; name: string }>;
}

export interface RoleAssignmentItem {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    user_phone: string;
    role: 'group_admin' | 'facility_admin' | 'receptionist';
    scope_type: 'group' | 'facility';
    scope_id: number;
    scope_name: string;
    created_at: string;
}

export interface UserSimple {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: string;
}

export interface Specialty {
    id: number;
    name_ar: string;
    name_en?: string;
    icon_slug: string;
    badge_text?: string;
    description?: string;
    doctor_profiles_count?: number;
    share_percentage?: number;
}

export interface Doctor {
    id: number;
    title_ar: string;
    subspecialty: string;
    consultation_fee: number;
    waiting_time_minutes: number;
    is_available_today: boolean;
    specialty_id: number;
    clinic_id: number;
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        avatar?: string;
    };
    specialty: {
        name_ar: string;
    };
    clinic: {
        name: string;
        branch_name: string;
        city: string;
    };
    doctor_facilities?: Array<{
        id: number;
        facility_id: number;
        facility: { id: number; name: string; type: string };
        consultation_fee: number;
        default_slot_minutes: number;
        is_active: boolean;
    }>;
}

export interface Appointment {
    id: number;
    booking_reference: string;
    appointment_date: string;
    appointment_time: string;
    status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled';
    payment_method: string;
    payment_status: string;
    consultation_fee: number;
    fee_amount?: number;
    total_amount: number;
    facility?: { name: string; city?: string };
    patient: {
        name: string;
        phone: string;
    };
    doctor: {
        title_ar: string;
        user: { name: string };
        clinic: { name: string };
        specialty: { name_ar: string };
    };
    queueTicket?: {
        ticket_number: number;
        status: string;
    };
}

