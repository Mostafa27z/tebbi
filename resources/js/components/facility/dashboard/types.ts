import { ConfirmationStages } from '@/components/common/confirmation-stages-badge';

export interface ReceptionDoctor {
    id: number;
    title_ar: string;
    subspecialty?: string;
    consultation_fee: number;
    facility_consultation_fee?: number;
    waiting_time_minutes: number;
    is_available_today: boolean;
    user: { id: number; name: string; email: string; avatar?: string; phone?: string };
    specialty: { id: number; name_ar: string; description?: string };
}

export interface ReceptionAppointment {
    id: number;
    booking_reference: string;
    appointment_date: string;
    appointment_time: string;
    status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled' | 'confirmed' | 'booked';
    payment_status: 'paid' | 'pending' | 'refunded' | 'pending_verification';
    payment_method?: 'cash' | 'pos' | 'card' | 'insurance' | string;
    payment_notes?: string;
    service_name?: string | null;
    duration_minutes?: number | null;
    delay_minutes?: number;
    delay_reason?: string | null;
    total_amount: number;
    fee_amount?: number;
    patient: { name: string; phone: string; national_id?: string };
    doctor: {
        id: number;
        title_ar: string;
        user: { name: string };
        specialty?: { id?: number; name_ar: string };
        specialty_id?: number;
    };
    queueTicket?: {
        ticket_number: number;
        status: string;
        estimated_wait_minutes: number;
    };
    confirmation_stages?: ConfirmationStages;
}

export interface ReceptionSpecialtyItem {
    id: number;
    name_ar: string;
    name_en?: string;
    description?: string;
}

export interface ReceptionMetrics {
    doctorsCount: number;
    activeDoctorsCount: number;
    specialtiesCount: number;
    totalToday: number;
    waitingCount: number;
    inConsultationCount: number;
    completedCount: number;
    notArrivedCount?: number;
    insuranceCount?: number;
    receptionistsCount?: number;
}
