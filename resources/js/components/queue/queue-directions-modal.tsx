import React from 'react';
import { X, Navigation, Car, Clock, Compass, ExternalLink } from 'lucide-react';

interface QueueDirectionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    clinicLocation: { name: string; branch: string };
    userLocation: { lat: number; lng: number; label: string; isLiveGps: boolean };
    distanceInfo: { km: number; minutes: number };
    locating: boolean;
    onRefreshGps: () => void;
    mapEmbedUrl: string;
    googleMapsNavUrl: string;
}

export const QueueDirectionsModal: React.FC<QueueDirectionsModalProps> = React.memo(({
    isOpen,
    onClose,
    clinicLocation,
    userLocation,
    distanceInfo,
    locating,
    onRefreshGps,
    mapEmbedUrl,
    googleMapsNavUrl,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Tajawal']"
            dir="rtl"
        >
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 left-4 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#005ab5] flex items-center justify-center shrink-0">
                        <Navigation className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-gray-900 font-['Cairo']">
                            مسار الملاحة وحساب المسافة للمستشفى
                        </h3>
                        <p className="text-xs text-gray-500">
                            {clinicLocation.name} - {clinicLocation.branch}
                        </p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200/80 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 mb-3 border-b border-blue-200/60">
                        <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-black text-xs">
                                أ
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded-md">
                                        نقطة الانطلاق (موقعك)
                                    </span>
                                    {userLocation.isLiveGps && (
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="GPS مباشر" />
                                    )}
                                </div>
                                <p className="text-xs font-bold text-gray-900 truncate mt-1">
                                    {userLocation.label}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 font-black text-xs">
                                ب
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded-md">
                                    الوجهة (المستشفى)
                                </span>
                                <p className="text-xs font-bold text-gray-900 truncate mt-1">
                                    {clinicLocation.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <Car className="w-4 h-4 text-[#005ab5]" />
                                <span className="text-gray-600 font-medium">المسافة:</span>
                                <span className="font-black text-gray-900 font-mono text-sm bg-white px-2.5 py-0.5 rounded-lg border border-blue-200">
                                    {distanceInfo.km} كم
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-emerald-600" />
                                <span className="text-gray-600 font-medium">الوقت المقدر:</span>
                                <span className="font-black text-emerald-800 font-mono text-sm bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                    ~{distanceInfo.minutes} دقيقة بالسيارة
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onRefreshGps}
                            disabled={locating}
                            className="px-3 py-1 rounded-xl bg-white hover:bg-blue-50 text-[#005ab5] border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <Compass className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                            <span>{locating ? 'جارٍ التحديث...' : 'تحديث GPS'}</span>
                        </button>
                    </div>
                </div>

                <div className="w-full h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative bg-gray-100 mb-5">
                    <iframe
                        title="مسار الملاحة على خرائط جوجل"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={mapEmbedUrl}
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <a
                        href={googleMapsNavUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 w-full py-3.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span>فتح الملاحة خطوة بخطوة في تطبيق Google Maps</span>
                    </a>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
});
QueueDirectionsModal.displayName = 'QueueDirectionsModal';
