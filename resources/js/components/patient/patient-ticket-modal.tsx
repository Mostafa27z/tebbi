import React from 'react';
import { QRCode } from '@/components/common/qr-code';
import { X, Ticket, ShieldCheck, User, Calendar, Clock } from 'lucide-react';
import { format12HourTime } from '@/lib/utils';

interface PatientTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: {
        id: number;
        booking_reference: string;
        appointment_date: string;
        appointment_time: string;
        status: string;
        patient?: { name: string; phone?: string };
        doctor?: { user: { name: string }; specialty: { name_ar: string } };
        queueTicket?: { ticket_number: number };
    };
    facilityName: string;
}

export const PatientTicketModal: React.FC<PatientTicketModalProps> = ({
    isOpen,
    onClose,
    appointment,
    facilityName,
}) => {
    if (!isOpen) return null;

    const ticketNumber = appointment.queueTicket?.ticket_number || '01';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Cairo'] animate-in fade-in duration-200" dir="rtl">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative">
                {/* Header */}
                <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-[#005ab5]" />
                        <h3 className="text-sm font-black text-gray-900">
                            تذكرة الموعد الإلكترونية
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 text-center space-y-4">
                    <div className="p-4 rounded-3xl bg-blue-50/60 border border-blue-100">
                        <span className="text-[11px] text-gray-500 block font-bold mb-1">
                            رقم التذكرة
                        </span>
                        <div className="text-5xl font-black text-[#005ab5] font-mono">
                            #{ticketNumber}
                        </div>
                        <p className="text-xs text-gray-600 font-bold mt-1">
                            {facilityName}
                        </p>
                    </div>

                    <div className="inline-block p-3 rounded-2xl bg-white border border-gray-200 shadow-xs">
                        <QRCode
                            value={appointment.booking_reference}
                            size={180}
                            fgColor="#003875"
                            bgColor="#FFFFFF"
                            title={`رمز الحجز: ${appointment.booking_reference}`}
                        />
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                        <p>
                            الطبيب: <strong className="text-gray-900">{appointment.doctor?.user?.name}</strong>
                        </p>
                        <p>
                            الوقت: <strong className="text-gray-900">{format12HourTime(appointment.appointment_time)}</strong>
                        </p>
                        <p className="text-[11px] text-gray-400 pt-1">
                            يمكن لموظف الاستقبال مسح هذا الباركود للتحقق السريع
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-colors cursor-pointer"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientTicketModal;
