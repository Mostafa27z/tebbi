import React, { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { 
    QrCode, 
    Camera, 
    X, 
    CheckCircle2, 
    AlertCircle, 
    Sparkles, 
    Building2, 
    ScanLine,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QrCheckinModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: number;
    facilityId?: number;
    facilityName: string;
    expectedFacilityCode?: string;
    onSuccess?: (ticketNumber: number) => void;
}

export const QrCheckinModal: React.FC<QrCheckinModalProps> = ({
    isOpen,
    onClose,
    appointmentId,
    facilityId,
    facilityName,
    expectedFacilityCode,
    onSuccess,
}) => {
    const [mode, setMode] = useState<'camera' | 'manual'>('camera');
    const [manualCode, setManualCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasCamera, setHasCamera] = useState<boolean | null>(null);
    const [scanSuccess, setScanSuccess] = useState<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const defaultCode = expectedFacilityCode || (facilityId ? `TEBBY-FAC-${facilityId}` : 'TEBBY-FAC-1');

    // Camera initialization
    useEffect(() => {
        if (!isOpen || mode !== 'camera') {
            stopCamera();
            return;
        }

        let isMounted = true;
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
                .getUserMedia({ video: { facingMode: 'environment' } })
                .then((stream) => {
                    if (!isMounted) {
                        stream.getTracks().forEach((track) => track.stop());
                        return;
                    }
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                    setHasCamera(true);
                })
                .catch(() => {
                    if (isMounted) {
                        setHasCamera(false);
                    }
                });
        } else {
            setHasCamera(false);
        }

        return () => {
            isMounted = false;
            stopCamera();
        };
    }, [isOpen, mode]);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    };

    const handleCheckInSubmit = (codeToVerify: string) => {
        const cleanCode = codeToVerify.trim();
        if (!cleanCode) {
            toast.error('يرجى إدخال أو مسح رمز المنشأة.');
            return;
        }

        setLoading(true);

        router.post(
            '/patient/check-in',
            {
                appointment_id: appointmentId,
                facility_code: cleanCode,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setLoading(false);
                    stopCamera();
                    const newTicket = (page.props as any)?.activeAppointment?.queueTicket?.ticket_number || 1;
                    setScanSuccess(newTicket);
                    toast.success('تم إثبات وصولك بالاستقبال بنجاح! أنت الآن في قائمة الانتظار.');
                    if (onSuccess) onSuccess(newTicket);
                },
                onError: (errors) => {
                    setLoading(false);
                    const msg = errors.facility_code || errors.appointment_id || 'فشل تأكيد الحضور، تأكد من كود المنشأة.';
                    toast.error(msg);
                },
            }
        );
    };

    if (!isOpen) return null;

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
                                تسجيل الوصول بالعيادة (QR Check-in)
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                {facilityName}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            stopCamera();
                            onClose();
                            setScanSuccess(null);
                        }}
                        className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {scanSuccess ? (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                                <CheckCircle2 className="w-10 h-10 animate-in zoom-in-50 duration-300" />
                            </div>
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    المرحلة 2: تم تأكيد الاستقبال والحضور
                                </span>
                                <h4 className="text-xl font-black text-gray-900">
                                    أهلاً بك! تم تسجيل وصولك بنجاح
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    تم إدراجك في قائمة الانتظار المباشرة ووصل إشعار لموظف الاستقبال بتواجدك في الصالة.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#003875] to-[#005ab5] text-white">
                                <span className="text-xs text-blue-100 block font-bold mb-1">رقم تذكرتك في العيادة</span>
                                <div className="text-4xl font-black text-amber-300 font-mono">
                                    #{scanSuccess}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    setScanSuccess(null);
                                }}
                                className="w-full py-3 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                            >
                                إغلاق ومتابعة الطابور الحي
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Mode Tabs */}
                            <div className="flex bg-gray-100 p-1 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setMode('camera')}
                                    className={cn(
                                        'flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                                        mode === 'camera'
                                            ? 'bg-white text-[#005ab5] shadow-xs'
                                            : 'text-gray-500 hover:text-gray-900'
                                    )}
                                >
                                    <Camera className="w-3.5 h-3.5" />
                                    <span>مسح بالكاميرا</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('manual')}
                                    className={cn(
                                        'flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                                        mode === 'manual'
                                            ? 'bg-white text-[#005ab5] shadow-xs'
                                            : 'text-gray-500 hover:text-gray-900'
                                    )}
                                >
                                    <ScanLine className="w-3.5 h-3.5" />
                                    <span>كتابة الرمز يدوياً</span>
                                </button>
                            </div>

                            {mode === 'camera' ? (
                                <div className="space-y-4">
                                    {/* Camera Stream or Scanner Frame */}
                                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-dashed border-[#005ab5]/40 shadow-inner">
                                        {hasCamera ? (
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center p-6 text-gray-300">
                                                <Camera className="w-12 h-12 mx-auto mb-2 text-gray-500" />
                                                <p className="text-xs font-bold">
                                                    وجّه الكاميرا نحو كود الـ QR الموجود على كاونتر الاستقبال
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-1">
                                                    (أو اضغط زر المحاكاة السريعة بالأسفل للاختبار الفوري)
                                                </p>
                                            </div>
                                        )}

                                        {/* Scanner Viewfinder Box */}
                                        <div className="absolute inset-8 border-2 border-emerald-400 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                                            <div className="flex justify-between">
                                                <span className="w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-md"></span>
                                                <span className="w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-md"></span>
                                            </div>
                                            {/* Laser scanline animation */}
                                            <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></div>
                                            <div className="flex justify-between">
                                                <span className="w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-md"></span>
                                                <span className="w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-md"></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Instant One-Click Verification Button for Testing */}
                                    <button
                                        type="button"
                                        onClick={() => handleCheckInSubmit(defaultCode)}
                                        disabled={loading}
                                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>
                                            {loading
                                                ? 'جارٍ تأكيد الوصول...'
                                                : `محاكاة مسح كود (${facilityName})`}
                                        </span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                            رمز كود الاستقبال
                                        </label>
                                        <input
                                            type="text"
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value)}
                                            placeholder={`مثال: ${defaultCode}`}
                                            className="w-full h-11 px-4 rounded-2xl border border-gray-200 text-xs text-left font-mono focus:ring-2 focus:ring-[#005ab5] focus:outline-none"
                                            dir="ltr"
                                        />
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            كود هذه المنشأة هو: <strong className="text-[#005ab5] font-mono">{defaultCode}</strong>
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleCheckInSubmit(manualCode || defaultCode)}
                                        disabled={loading}
                                        className="w-full py-3.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                                    >
                                        <span>{loading ? 'جارٍ التحقق والتأكيد...' : 'تأكيد الحضور الآن'}</span>
                                        <ArrowRight className="w-4 h-4 rotate-180" />
                                    </button>
                                </div>
                            )}

                            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                                💡 بمجرد تسجيل الوصول، تُعتبر المرحلة 2 (تأكيد الاستقبال) معتمدة فوراً ويظهر اسمك مباشرة على شاشة الطبيب والاستقبال للبدء في المناداة.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QrCheckinModal;
