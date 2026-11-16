export interface FacilitySpecialtyTag {
    id: number;
    name_ar: string;
    icon_slug?: string;
    badge_text?: string;
}

export interface FacilityDoctorPreview {
    id: number;
    name: string;
    avatar?: string;
    specialty?: string;
}

export interface FacilityItem {
    id: number;
    name: string;
    branch_name: string;
    type: 'hospital' | 'clinic';
    city: string;
    district: string;
    address: string;
    phone: string;
    map_url?: string;
    moh_license_no?: string;
    is_verified?: boolean;
    doctor_profiles_count?: number;
    specialties?: FacilitySpecialtyTag[];
    sectors?: string[];
    doctors_preview?: FacilityDoctorPreview[];
}

export interface SpecialtyItem {
    id: number;
    name_ar: string;
    name_en?: string;
    icon?: string;
    icon_slug?: string;
    badge_text?: string;
    description?: string;
    doctors_count: number;
    facilities_count?: number;
}

export interface DoctorItem {
    id: number;
    title_ar: string;
    subspecialty?: string;
    experience_years?: number;
    consultation_fee: number;
    rating: number;
    review_count: number;
    waiting_time_minutes: number;
    accepts_insurance: boolean;
    is_available_today: boolean;
    specialty?: {
        id: number;
        name_ar: string;
        name_en?: string;
        icon_slug?: string;
    };
    user: {
        id: number;
        name: string;
        avatar?: string;
        phone?: string;
    };
    clinic?: {
        id: number;
        name: string;
        branch_name?: string;
        type?: 'hospital' | 'clinic';
        city?: string;
        district?: string;
        address?: string;
    };
    facilities?: Array<{
        id: number;
        name: string;
        branch_name?: string;
        city?: string;
        district?: string;
    }>;
}

export interface GroupLandingInfo {
    id: number;
    name_ar: string;
    name_en?: string;
    slug: string;
    logo_url?: string;
    cr_number?: string;
    status: string;
    public_url: string;
}

export interface GroupLandingStats {
    totalDoctors: number;
    availableTodayDoctors?: number;
    totalFacilities: number;
    totalHospitals: number;
    totalClinics: number;
    specialtiesCount: number;
    avgRating: number;
    cities: string[];
}
