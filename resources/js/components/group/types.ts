export interface Facility {
    id: number;
    name: string;
    branch_name: string;
    type: 'hospital' | 'clinic';
    moh_license_no?: string;
    city: string;
    district: string;
    address: string;
    phone: string;
    is_active: boolean;
    is_verified: boolean;
    doctor_profiles_count?: number;
    admins?: Array<{ id: number; name: string; email: string }>;
    receptionists?: Array<{ id: number; name: string; email: string }>;
}

export interface Doctor {
    id: number;
    title_ar: string;
    subspecialty: string;
    consultation_fee: number;
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        avatar?: string;
    };
    specialty: {
        id?: number;
        name_ar: string;
    };
    clinic?: {
        id?: number;
        name: string;
    };
    doctor_facilities?: Array<{
        facility: { id: number; name: string; type: string };
        consultation_fee: number;
    }>;
}

export interface StaffAssignment {
    id: number;
    user_name: string;
    user_email: string;
    user_phone: string;
    role: string;
    scope_type: string;
    scope_id: number;
    scope_name: string;
}

export interface GroupInfo {
    id: number;
    name_ar: string;
    name_en?: string;
    cr_number?: string;
    logo_url?: string;
}

export interface GroupMetrics {
    facilitiesCount: number;
    hospitalsCount: number;
    clinicsCount: number;
    doctorsCount: number;
    todayAppointments: number;
    totalRevenue: string;
}

export interface SpecialtyOption {
    id: number;
    name_ar: string;
}

