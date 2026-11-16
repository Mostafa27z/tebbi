import { ConfirmationStages } from '@/components/common/confirmation-stages-badge';

export interface FacilityAppointmentRecord {
    id: number;
    booking_reference: string;
    appointment_date: string;
    appointment_time: string;
    status: 'booked' | 'confirmed' | 'waiting' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show';
    payment_method: string;
    payment_status: string;
    total_amount: number;
    patient: {
        id: number;
        name: string;
        phone: string;
    };
    doctor: {
        id: number;
        title_ar: string;
        consultation_fee: number;
        specialty_id?: number;
        user: {
            name: string;
            avatar?: string;
        };
        specialty?: {
            id: number;
            name_ar: string;
        };
    };
    queueTicket?: {
        ticket_number: number;
        status: string;
    };
    confirmation_stages?: ConfirmationStages;
}

export interface FacilityAppointmentDoctor {
    id: number;
    title_ar: string;
    user: { name: string };
    specialty: { id: number; name_ar: string };
}
