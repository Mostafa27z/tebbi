import React from 'react';
import { QRCode } from '@/components/common/qr-code';
import { 
    X, 
    Printer, 
    Copy, 
    Check, 
    Download,
    Building2, 
    Sparkles, 
    QrCode, 
    Smartphone 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FacilityQrModalProps {
    isOpen: boolean;
    onClose: () => void;
    facility: {
        id: number;
        name: string;
        branch_name?: string;
        city?: string;
        district?: string;
    };
}

export const FacilityQrModal: React.FC<FacilityQrModalProps> = ({
    isOpen,
    onClose,
    facility,
}) => {
    const [copied, setCopied] = React.useState(false);

    if (!isOpen) return null;

    const qrValue = `TEBBY-FAC-${facility.id}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(qrValue);
        setCopied(true);
        toast.success(`تم نسخ رمز المنشأة: ${qrValue}`);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadImage = () => {
        try {
            const container = document.getElementById('printable-qr-area');
            const svg = container?.querySelector('svg');
            if (!svg) {
                toast.error('تعذر تصدير كود الـ QR');
                return;
            }
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 760;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Draw clean white background card
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Border
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 4;
            ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

            // Header
            ctx.fillStyle = '#003875';
            ctx.font = 'bold 26px Cairo, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(facility.name, canvas.width / 2, 75);

            ctx.fillStyle = '#64748B';
            ctx.font = '16px Cairo, Arial, sans-serif';
            ctx.fillText(facility.branch_name ? `فرع: ${facility.branch_name}` : 'كود الحضور الذكي للاستقبال', canvas.width / 2, 115);

            // Draw QR code image
            const img = new Image();
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            img.onload = () => {
                ctx.drawImage(img, (canvas.width - 400) / 2, 150, 400, 400);
                URL.revokeObjectURL(url);

                // Instructions
                ctx.fillStyle = '#005ab5';
                ctx.font = 'bold 22px Cairo, Arial, sans-serif';
                ctx.fillText('امسح الرمز بكاميرا الجوال لتأكيد وصولك فوراً', canvas.width / 2, 600);

                ctx.fillStyle = '#94A3B8';
                ctx.font = '14px Cairo, Arial, sans-serif';
                ctx.fillText(`رمز المنشأة: ${qrValue} • منصة طبيبي`, canvas.width / 2, 645);

                const link = document.createElement('a');
                link.download = `QR-${facility.name}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                toast.success('تم تحميل كود QR كصورة عالية الدقة بنجاح!');
            };
            img.src = url;
        } catch (e) {
            console.error('QR download error', e);
            toast.error('حدث خطأ أثناء تحميل الصورة.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Cairo'] animate-in fade-in duration-200" dir="rtl">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#005ab5] flex items-center justify-center">
                            <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-900">
                                كود QR الحضور الذكي للاستقبال
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                {facility.name} {facility.branch_name ? `• ${facility.branch_name}` : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Printable QR Display Area */}
                <div className="p-6 text-center space-y-5" id="printable-qr-area">
                    <div className="inline-block p-4 rounded-3xl bg-white border-2 border-dashed border-blue-200 shadow-md">
                        <QRCode
                            value={qrValue}
                            size={220}
                            fgColor="#003875"
                            bgColor="#FFFFFF"
                        />
                    </div>

                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#005ab5] text-xs font-bold font-mono">
                            <Smartphone className="w-3.5 h-3.5" />
                            {qrValue}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 mt-2">
                            امسح لتسجيل الوصول الفوري
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                            يقوم المريض بمسح هذا الرمز بكاميرا الجوال أو من حسابه في منصة طبيبي لتأكيد وصوله بالعيادة فوراً وتجاوز طابور الكاونتر.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                        <button
                            type="button"
                            onClick={handleDownloadImage}
                            className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                            title="تحميل كصورة PNG لطباعتها أو حفظها"
                        >
                            <Download className="w-4 h-4" />
                            <span>تحميل كصورة</span>
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="py-3 px-3 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                            title="طباعة ستاند الكاونتر"
                        >
                            <Printer className="w-4 h-4" />
                            <span>طباعة ستاند</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="py-3 px-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            title="نسخ الرمز النصي"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? 'تم النسخ' : 'نسخ الكود'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacilityQrModal;
