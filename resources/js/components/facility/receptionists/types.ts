export interface ReceptionistItem {
    id: number;
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

export interface AvailableReceptionUser {
    id: number;
    name: string;
    email: string;
    phone?: string;
}
