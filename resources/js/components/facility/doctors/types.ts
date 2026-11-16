export interface FacilityDoctor {
    id: number;
    title_ar: string;
    subspecialty?: string;
    bio?: string;
    license_no?: string;
    experience_years?: number;
    consultation_fee: number;
    facility_consultation_fee?: number;
    waiting_time_minutes: number;
    facility_slot_minutes?: number;
    accepts_insurance?: boolean;
    facility_accepts_insurance?: boolean;
    is_available_today: boolean;
    clinic_id?: number;
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        avatar?: string;
    };
    specialty: {
        id: number;
        name_ar: string;
    };
    doctor_facilities?: Array<{
        facility: { id: number; name: string };
        consultation_fee: number;
        default_slot_minutes?: number;
        accepts_insurance?: boolean;
        is_active?: boolean;
    }>;
}

export interface FacilitySpecialtyItem {
    id: number;
    name_ar: string;
    name_en?: string;
    description?: string;
}

export interface AvailableFacilityDoctor {
    id: number;
    title_ar: string;
    consultation_fee: number;
    waiting_time_minutes: number;
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        avatar?: string;
    };
    specialty?: {
        id: number;
        name_ar: string;
    };
    clinic?: {
        id: number;
        name: string;
    };
}
